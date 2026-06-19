import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  ImageIcon,
  Megaphone,
  Plus,
  ReceiptText,
  Save,
  Target,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  increment,
} from "firebase/firestore";

import { db } from "../firebase";
import { campaignTitle, gold, money } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import { contributionTotal } from "../services/fundTransactions";
import { uploadAthleteMedia } from "../services/mediaUpload";

const PROVINCES = [
  "Alberta",
  "Colombie-Britannique",
  "Île-du-Prince-Édouard",
  "Manitoba",
  "Nouveau-Brunswick",
  "Nouvelle-Écosse",
  "Nunavut",
  "Ontario",
  "Québec",
  "Saskatchewan",
  "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest",
  "Yukon",
];

const DISCIPLINES = [
  "Karaté combat",
  "Kata",
  "Point Fighting",
  "Light Contact",
  "Kick Light",
  "Arts martiaux",
  "Autre",
];

const PROGRAMS = [
  "WKC Spain 2026",
  "WAKO Italie 2026",
  "Saison compétitive 2026",
  "Fonds Athlètes KinkoLab",
  "Autre",
];

const ATHLETE_STATUSES = [
  "Athlète",
  "Parent / famille",
  "Coach",
  "Assistant coach",
];

function sumRaised(participation) {
  return (
    Number(participation?.raisedShop || 0) +
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
}

function percentOf(raised, goal) {
  if (!goal || Number(goal) <= 0) return 0;
  return Math.min(Math.round((Number(raised || 0) / Number(goal)) * 100), 100);
}

function formatDate(value) {
  if (!value) return "";
  if (value?.toDate) return value.toDate().toLocaleDateString("fr-CA");
  return String(value).slice(0, 10);
}

function sortByDateDesc(items) {
  return [...(items || [])].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || Date.parse(a.date || a.displayDate || "") || 0;
    const bTime = b.createdAt?.toMillis?.() || Date.parse(b.date || b.displayDate || "") || 0;
    return bTime - aTime;
  });
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-5 py-3 font-black ${
        active ? "bg-black text-white" : "bg-white text-zinc-950"
      }`}
    >
      {children}
    </button>
  );
}

function StatBox({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
          {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
        </div>
        {Icon && (
          <div className="rounded-2xl bg-zinc-100 p-3">
            <Icon size={22} style={{ color: gold }} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const clean = status || "en_attente";
  const color =
    clean === "active" || clean === "actif" || clean === "approuvé"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : clean === "suspendue" || clean === "suspendu"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : clean === "archivée" || clean === "archivé"
      ? "bg-zinc-100 text-zinc-600 border-zinc-300"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${color}`}>
      {clean}
    </span>
  );
}

function AthleteMiniCard({ athlete, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition ${
        active ? "bg-black text-white" : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-200 text-3xl">
        {athlete.photoUrl ? (
          <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full object-cover" />
        ) : (
          athlete.avatar || "🥋"
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate font-black">{athlete.name}</p>
        <p className="text-sm opacity-70">{athlete.discipline || "Discipline à confirmer"}</p>
        <p className="text-xs opacity-60">
          {athlete.belt ? `Ceinture ${athlete.belt}` : "Ceinture à confirmer"}
        </p>
      </div>
    </button>
  );
}

function CampaignGroupCard({ group, campaigns, onEditParticipation }) {
  const percent = percentOf(group.raised, group.goal);
  const campaign = campaigns.find((item) => item.id === group.campaignId);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: gold }}>
            {group.fundingMode === "family" ? "Fonds commun familial" : "Financement individuel"}
          </p>
          <h3 className="mt-2 text-2xl font-black text-zinc-950">
            {group.campaignTitle || campaign?.title || "Campagne"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {campaign?.city || ""} {campaign?.country || ""}
            {campaign?.eventDate ? ` · Événement : ${campaign.eventDate}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status="active" />
          <button
            type="button"
            onClick={() => onEditParticipation?.(group)}
            className="rounded-2xl bg-black px-4 py-2 text-sm font-black text-white"
          >
            Modifier
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-100 p-4">
        <p className="text-sm font-black text-zinc-700">Participants</p>
        <p className="mt-1 text-sm text-zinc-600">
          {group.participations.map((item) => item.athleteName).join(", ")}
        </p>
      </div>

      {(group.publicMessage || group.fundingNeeds || group.campaignReason) && (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          {group.publicMessage && <p className="text-sm text-zinc-700">{group.publicMessage}</p>}
          {group.fundingNeeds && <p className="mt-2 text-sm text-zinc-500">Besoins : {group.fundingNeeds}</p>}
          {group.campaignReason && <p className="mt-2 text-sm text-zinc-500">Motivation : {group.campaignReason}</p>}
        </div>
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-100 p-4">
          <p className="text-xs uppercase text-zinc-500">Objectif</p>
          <p className="mt-1 text-2xl font-black">{money(group.goal)}</p>
        </div>
        <div className="rounded-2xl bg-zinc-100 p-4">
          <p className="text-xs uppercase text-zinc-500">Récolté</p>
          <p className="mt-1 text-2xl font-black">{money(group.raised)}</p>
        </div>
        <div className="rounded-2xl bg-zinc-100 p-4">
          <p className="text-xs uppercase text-zinc-500">Reste</p>
          <p className="mt-1 text-2xl font-black">{money(Math.max(group.goal - group.raised, 0))}</p>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={percent} />
        <p className="mt-2 text-sm text-zinc-500">{percent}% atteint</p>
      </div>
    </div>
  );
}

function ContributionCard({ contribution }) {
  const amount = Number(contribution.amountReserved || contribution.reservedAmount || contribution.amount || 0);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            {formatDate(contribution.createdAt) || contribution.displayDate || "Date à confirmer"}
          </p>
          <h3 className="mt-2 text-lg font-black text-zinc-950">
            {contribution.productName || contribution.productTitle || contribution.name || "Contribution Shopify"}
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            {contribution.customerName || contribution.customerEmail || "Client Shopify"}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase text-emerald-700">Réservé</p>
          <p className="text-xl font-black text-emerald-800">+ {money(amount)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-100 p-3">
          <p className="text-xs uppercase text-zinc-500">Campagne</p>
          <p className="mt-1 text-sm font-black text-zinc-800">
            {contribution.campaignTitle || contribution.campaignId || "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-100 p-3">
          <p className="text-xs uppercase text-zinc-500">Soutien</p>
          <p className="mt-1 text-sm font-black text-zinc-800">
            {contribution.supportLabel || contribution.athleteName || contribution.familyName || "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-zinc-100 p-3">
          <p className="text-xs uppercase text-zinc-500">Commande</p>
          <p className="mt-1 text-sm font-black text-zinc-800">
            {contribution.orderName || contribution.orderId || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AthleteDashboard({
  currentUser,
  campaigns = [],
  participations = [],
  goHome,
  onOpenAthlete,
}) {
  const [activeTab, setActiveTab] = useState("summary");
  const [family, setFamily] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");

  const [updates, setUpdates] = useState([]);
  const [fundingEvents, setFundingEvents] = useState([]);
  const [contributions, setContributions] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editingParticipationGroup, setEditingParticipationGroup] = useState(null);
  const [savingParticipation, setSavingParticipation] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    birthDate: "",
    email: "",
    phone: "",
    city: "",
    province: "",
    dojo: "",
    discipline: "",
    belt: "",
    programRequested: "",
    athleteStatus: "",
    bio: "",
    photoUrl: "",
    athleteSocials: "",
  });

  const [participationForm, setParticipationForm] = useState({
    goal: "",
    fundingNeeds: "",
    campaignReason: "",
    publicMessage: "",
    isPublic: true,
  });

  const [newUpdate, setNewUpdate] = useState({
    title: "",
    content: "",
    type: "Nouvelle",
    mediaUrl: "",
  });

  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
    goal: "",
    amountRaised: "",
    participationId: "",
  });

  const [newContribution, setNewContribution] = useState({
    participationId: "",
    athleteId: "",
    amount: "",
    source: "Contribution manuelle",
    contributorName: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [savingContribution, setSavingContribution] = useState(false);

  useEffect(() => {
    if (!currentUser?.familyId) return;

    async function loadFamily() {
      const snap = await getDoc(doc(db, "families", currentUser.familyId));
      if (snap.exists()) setFamily({ id: snap.id, ...snap.data() });
    }

    loadFamily();
  }, [currentUser?.familyId]);

  useEffect(() => {
    if (!currentUser?.familyId) return;

    const q = query(collection(db, "athletes"), where("familyId", "==", currentUser.familyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      setAthletes(data);
      if (data.length && !selectedAthleteId) setSelectedAthleteId(data[0].id);
    });

    return () => unsubscribe();
  }, [currentUser?.familyId, selectedAthleteId]);

  useEffect(() => {
    if (!currentUser?.familyId) return;

    const q = query(collection(db, "contributions"), where("familyId", "==", currentUser.familyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      setContributions(sortByDateDesc(data));
    });

    return () => unsubscribe();
  }, [currentUser?.familyId]);

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) || athletes[0] || null;
  }, [athletes, selectedAthleteId]);

  useEffect(() => {
    if (!selectedAthlete) return;

    const nameParts = String(selectedAthlete.name || "").split(" ");
    setForm({
      firstName: selectedAthlete.firstName || nameParts[0] || "",
      lastName: selectedAthlete.lastName || nameParts.slice(1).join(" ") || "",
      displayName: selectedAthlete.displayName || selectedAthlete.name || "",
      birthDate: selectedAthlete.birthDate || "",
      email: selectedAthlete.email || selectedAthlete.athleteEmail || "",
      phone: selectedAthlete.phone || selectedAthlete.athletePhone || "",
      city: selectedAthlete.city || "",
      province: selectedAthlete.province || "",
      dojo: selectedAthlete.dojo || "",
      discipline: selectedAthlete.discipline || "",
      belt: selectedAthlete.belt || "",
      programRequested: selectedAthlete.programRequested || "",
      athleteStatus: selectedAthlete.athleteStatus || "",
      bio: selectedAthlete.bio || selectedAthlete.presentation || "",
      photoUrl: selectedAthlete.photoUrl || "",
      athleteSocials: selectedAthlete.athleteSocials || "",
    });
    setSaved(false);
  }, [selectedAthlete]);

  useEffect(() => {
    if (!selectedAthlete?.id) return;

    const q = query(collection(db, "athleteUpdates"), where("athleteId", "==", selectedAthlete.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      setUpdates(sortByDateDesc(data));
    });

    return () => unsubscribe();
  }, [selectedAthlete?.id]);

  useEffect(() => {
    if (!selectedAthlete?.id) return;

    const q = query(collection(db, "fundraisingEvents"), where("athleteId", "==", selectedAthlete.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      setFundingEvents(sortByDateDesc(data));
    });

    return () => unsubscribe();
  }, [selectedAthlete?.id]);

  const familyAthleteIds = useMemo(() => athletes.map((athlete) => athlete.id), [athletes]);

  const familyParticipations = useMemo(() => {
    return (participations || []).filter(
      (participation) =>
        familyAthleteIds.includes(participation.athleteId) &&
        participation.status !== "archivée" &&
        participation.status !== "archivé" &&
        participation.status !== "archive" &&
        participation.status !== "suspendue" &&
        participation.status !== "suspendu"
    );
  }, [participations, familyAthleteIds]);

  const selectedAthleteParticipations = useMemo(() => {
    if (!selectedAthlete?.id) return [];
    return familyParticipations.filter((participation) => participation.athleteId === selectedAthlete.id);
  }, [familyParticipations, selectedAthlete?.id]);

  const familyFundingGroups = useMemo(() => {
    const map = new Map();

    familyParticipations.forEach((participation) => {
      const key = participation.fundingGroupId || participation.id;
      if (!map.has(key)) {
        map.set(key, {
          fundingGroupId: key,
          campaignId: participation.campaignId,
          campaignTitle: participation.campaignTitle || campaignTitle(campaigns, participation.campaignId),
          fundingMode: participation.fundingMode,
          participations: [],
          goal: 0,
          raised: 0,
          fundingNeeds: participation.fundingNeeds || "",
          campaignReason: participation.campaignReason || "",
          publicMessage: participation.publicMessage || "",
          isPublic: participation.isPublic !== false,
        });
      }

      const group = map.get(key);
      group.participations.push(participation);
      group.goal += Number(participation.goal || 0);
      group.raised += sumRaised(participation);

      if (!group.fundingNeeds && participation.fundingNeeds) group.fundingNeeds = participation.fundingNeeds;
      if (!group.campaignReason && participation.campaignReason) group.campaignReason = participation.campaignReason;
      if (!group.publicMessage && participation.publicMessage) group.publicMessage = participation.publicMessage;
    });

    return Array.from(map.values());
  }, [familyParticipations, campaigns]);

  const familyGoal = familyFundingGroups.reduce((sum, group) => sum + group.goal, 0);
  const familyRaised = familyFundingGroups.reduce((sum, group) => sum + group.raised, 0);
  const familyRemaining = Math.max(familyGoal - familyRaised, 0);
  const familyPercent = percentOf(familyRaised, familyGoal);
  const totalContributions = contributionTotal(contributions);

  async function handleAthletePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedAthlete?.id) return;

    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadAthleteMedia(file, selectedAthlete.id, "profile");
      setForm((current) => ({ ...current, photoUrl }));
      await updateDoc(doc(db, "athletes", selectedAthlete.id), {
        photoUrl,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Erreur upload photo:", error);
      alert("Impossible de téléverser la photo.");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  }

  async function saveAthleteProfile() {
    if (!selectedAthlete?.id) return;

    const displayName =
      form.displayName.trim() ||
      `${form.firstName.trim()} ${form.lastName.trim()}`.trim() ||
      selectedAthlete.name;

    try {
      setSaving(true);
      await updateDoc(doc(db, "athletes", selectedAthlete.id), {
        firstName: form.firstName,
        lastName: form.lastName,
        name: displayName,
        displayName,
        birthDate: form.birthDate,
        email: form.email,
        athleteEmail: form.email,
        phone: form.phone,
        athletePhone: form.phone,
        city: form.city,
        province: form.province,
        dojo: form.dojo,
        discipline: form.discipline,
        belt: form.belt,
        programRequested: form.programRequested,
        athleteStatus: form.athleteStatus,
        bio: form.bio,
        presentation: form.bio,
        photoUrl: form.photoUrl,
        athleteSocials: form.athleteSocials,
        updatedAt: serverTimestamp(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error("Erreur sauvegarde profil:", error);
      alert("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  function openParticipationEditor(group) {
    setEditingParticipationGroup(group);
    setParticipationForm({
      goal: String(group.goal || ""),
      fundingNeeds: group.fundingNeeds || "",
      campaignReason: group.campaignReason || "",
      publicMessage: group.publicMessage || "",
      isPublic: group.isPublic !== false,
    });
    setActiveTab("campaigns");
  }

  async function saveParticipationGroup() {
    if (!editingParticipationGroup) return;

    const editableParticipations = editingParticipationGroup.participations || [];
    if (!editableParticipations.length) return;

    try {
      setSavingParticipation(true);
      const totalCurrentGoal = editableParticipations.reduce((sum, item) => sum + Number(item.goal || 0), 0);
      const desiredGoal = Number(participationForm.goal || 0);

      await Promise.all(
        editableParticipations.map((participation) => {
          let nextGoal = desiredGoal;
          if (editableParticipations.length > 1 && totalCurrentGoal > 0 && participation.goal) {
            nextGoal = desiredGoal * (Number(participation.goal || 0) / Number(totalCurrentGoal));
          }

          return updateDoc(doc(db, "campaignParticipations", participation.id), {
            goal: Math.round(nextGoal),
            fundingNeeds: participationForm.fundingNeeds,
            campaignReason: participationForm.campaignReason,
            publicMessage: participationForm.publicMessage,
            isPublic: participationForm.isPublic,
            updatedAt: serverTimestamp(),
          });
        })
      );

      setEditingParticipationGroup(null);
      alert("Participation mise à jour.");
    } catch (error) {
      console.error("Erreur modification participation:", error);
      alert("Impossible de modifier cette participation.");
    } finally {
      setSavingParticipation(false);
    }
  }

  async function publishUpdate() {
    if (!selectedAthlete?.id) return;
    if (!newUpdate.title.trim() || !newUpdate.content.trim()) {
      alert("Le titre et le texte sont obligatoires.");
      return;
    }

    try {
      await addDoc(collection(db, "athleteUpdates"), {
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        familyId: currentUser?.familyId || null,
        title: newUpdate.title,
        content: newUpdate.content,
        type: newUpdate.type,
        mediaUrl: newUpdate.mediaUrl,
        status: "en_attente",
        createdAt: serverTimestamp(),
        date: new Date().toISOString().slice(0, 10),
      });

      setNewUpdate({ title: "", content: "", type: "Nouvelle", mediaUrl: "" });
      alert("Nouvelle soumise pour validation.");
    } catch (error) {
      console.error("Erreur ajout nouvelle:", error);
      alert("Impossible d'ajouter la nouvelle.");
    }
  }

  async function createFundingEvent() {
    if (!selectedAthlete?.id) return;
    if (!newEvent.title.trim()) {
      alert("Le titre de l’événement est obligatoire.");
      return;
    }

    const amountRaised = Number(newEvent.amountRaised || 0);
    const linkedParticipation =
      familyParticipations.find((item) => item.id === newEvent.participationId) ||
      selectedAthleteParticipations[0] ||
      null;

    try {
      await addDoc(collection(db, "fundraisingEvents"), {
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        familyId: currentUser?.familyId || null,
        campaignId: linkedParticipation?.campaignId || null,
        campaignTitle:
          linkedParticipation?.campaignTitle ||
          campaignTitle(campaigns, linkedParticipation?.campaignId) ||
          null,
        participationId: linkedParticipation?.id || null,
        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description,
        goal: Number(newEvent.goal || 0),
        raised: amountRaised,
        amountRaised,
        status: "en_attente",
        createdAt: serverTimestamp(),
      });

      if (amountRaised > 0 && linkedParticipation?.id) {
        await updateDoc(doc(db, "campaignParticipations", linkedParticipation.id), {
          raisedOffline: increment(amountRaised),
          updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "contributions"), {
          familyId: currentUser?.familyId || null,
          athleteId: selectedAthlete.id,
          athleteName: selectedAthlete.name,
          campaignId: linkedParticipation.campaignId || null,
          campaignTitle:
            linkedParticipation.campaignTitle ||
            campaignTitle(campaigns, linkedParticipation.campaignId),
          participationId: linkedParticipation.id,
          source: "Événement",
          productName: newEvent.title,
          contributorName: "Événement de financement",
          customerName: "Événement de financement",
          amountReserved: amountRaised,
          reservedAmount: amountRaised,
          currency: "CAD",
          note: newEvent.description || "Résultat financier d’un événement",
          displayDate: newEvent.date || new Date().toISOString().slice(0, 10),
          createdAt: serverTimestamp(),
        });
      }

      setNewEvent({
        title: "",
        date: "",
        description: "",
        goal: "",
        amountRaised: "",
        participationId: "",
      });
      alert("Événement soumis pour validation.");
    } catch (error) {
      console.error("Erreur ajout événement:", error);
      alert("Impossible de créer l'événement.");
    }
  }

  async function createManualContribution() {
    const amount = Number(newContribution.amount || 0);
    if (!amount || amount <= 0) {
      alert("Indique un montant valide.");
      return;
    }

    const linkedParticipation = familyParticipations.find(
      (item) => item.id === newContribution.participationId
    );

    if (!linkedParticipation) {
      alert("Choisis une campagne ou une participation.");
      return;
    }

    const athlete = athletes.find((item) => item.id === linkedParticipation.athleteId);

    try {
      setSavingContribution(true);

      await addDoc(collection(db, "contributions"), {
        familyId: currentUser?.familyId || null,
        athleteId: linkedParticipation.athleteId,
        athleteName: athlete?.name || linkedParticipation.athleteName || "Athlète",
        campaignId: linkedParticipation.campaignId || null,
        campaignTitle:
          linkedParticipation.campaignTitle ||
          campaignTitle(campaigns, linkedParticipation.campaignId),
        participationId: linkedParticipation.id,
        source: newContribution.source || "Contribution manuelle",
        productName: newContribution.source || "Contribution manuelle",
        contributorName: newContribution.contributorName || "Contribution manuelle",
        customerName: newContribution.contributorName || "Contribution manuelle",
        amountReserved: amount,
        reservedAmount: amount,
        currency: "CAD",
        note: newContribution.note || "",
        displayDate: newContribution.date || new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "campaignParticipations", linkedParticipation.id), {
        raisedOffline: increment(amount),
        updatedAt: serverTimestamp(),
      });

      setNewContribution({
        participationId: "",
        athleteId: "",
        amount: "",
        source: "Contribution manuelle",
        contributorName: "",
        note: "",
        date: new Date().toISOString().slice(0, 10),
      });

      alert("Contribution ajoutée.");
    } catch (error) {
      console.error("Erreur ajout contribution:", error);
      alert("Impossible d’ajouter la contribution.");
    } finally {
      setSavingContribution(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={goHome}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Dashboard famille
          </p>
          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            {family?.name || "Ma famille"}
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Gérez vos profils, vos campagnes, vos nouvelles, vos événements et vos contributions.
          </p>
        </section>

        {!currentUser?.familyId && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Aucun compte famille associé</h2>
            <p className="mt-2 text-zinc-600">
              Votre compte n’est pas encore lié à une famille. Contactez l’admin KinkoLab.
            </p>
          </section>
        )}

        {currentUser?.familyId && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <StatBox icon={Users} label="Athlètes" value={athletes.length} sub="Profils rattachés" />
              <StatBox icon={Target} label="Campagnes" value={familyFundingGroups.length} sub="Groupes de financement" />
              <StatBox icon={Wallet} label="Objectif" value={money(familyGoal)} sub={`Reste : ${money(familyRemaining)}`} />
              <StatBox icon={ReceiptText} label="Contributions" value={money(totalContributions)} sub={`${contributions.length} contribution(s)`} />
            </section>

            <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Progression globale</h2>
              <div className="mt-5">
                <ProgressBar value={familyPercent} />
              </div>
              <p className="mt-3 text-sm text-zinc-500">
                {money(familyRaised)} récoltés sur {money(familyGoal)}
              </p>
            </section>

            <section className="mt-8 flex flex-wrap gap-2">
              <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>Résumé</TabButton>
              <TabButton active={activeTab === "athletes"} onClick={() => setActiveTab("athletes")}>Athlètes</TabButton>
              <TabButton active={activeTab === "campaigns"} onClick={() => setActiveTab("campaigns")}>Campagnes</TabButton>
              <TabButton active={activeTab === "contributions"} onClick={() => setActiveTab("contributions")}>Contributions</TabButton>
              <TabButton active={activeTab === "updates"} onClick={() => setActiveTab("updates")}>Nouvelles</TabButton>
              <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>Événements</TabButton>
            </section>

            {activeTab === "summary" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Users style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Membres de la famille</h2>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {athletes.length === 0 && <p className="text-zinc-500">Aucun athlète rattaché à cette famille.</p>}
                    {athletes.map((athlete) => (
                      <button
                        key={athlete.id}
                        type="button"
                        onClick={() => {
                          setSelectedAthleteId(athlete.id);
                          setActiveTab("athletes");
                        }}
                        className="flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 text-left hover:bg-zinc-100"
                      >
                        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 text-3xl">
                          {athlete.photoUrl ? (
                            <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full object-cover" />
                          ) : (
                            athlete.avatar || "🥋"
                          )}
                        </div>
                        <div>
                          <p className="font-black text-zinc-950">{athlete.name}</p>
                          <p className="text-sm text-zinc-500">
                            {athlete.discipline || "Discipline à confirmer"} · {athlete.dojo || "Dojo à confirmer"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Target style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Campagnes actives</h2>
                  </div>
                  <div className="mt-5 space-y-4">
                    {familyFundingGroups.length === 0 && <p className="text-zinc-500">Aucune campagne active pour cette famille.</p>}
                    {familyFundingGroups.map((group) => (
                      <CampaignGroupCard
                        key={group.fundingGroupId}
                        group={group}
                        campaigns={campaigns}
                        onEditParticipation={openParticipationEditor}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "athletes" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <UserRound style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Choisir un athlète</h2>
                  </div>
                  <div className="mt-5 space-y-3">
                    {athletes.map((athlete) => (
                      <AthleteMiniCard
                        key={athlete.id}
                        athlete={athlete}
                        active={selectedAthlete?.id === athlete.id}
                        onClick={() => setSelectedAthleteId(athlete.id)}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ImageIcon style={{ color: gold }} />
                      <h2 className="text-2xl font-black text-zinc-950">Modifier le profil</h2>
                    </div>
                    {selectedAthlete && (
                      <button
                        type="button"
                        onClick={() => onOpenAthlete(selectedAthlete.id)}
                        className="flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-black text-white"
                      >
                        <Eye size={16} />
                        Voir la page publique
                      </button>
                    )}
                  </div>

                  {selectedAthlete && (
                    <div className="mt-5 grid gap-4">
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <p className="text-sm font-black text-zinc-700">Photo de profil</p>
                        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center">
                          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-zinc-200 text-4xl">
                            {form.photoUrl ? (
                              <img src={form.photoUrl} alt={selectedAthlete.name} className="h-full w-full object-cover" />
                            ) : (
                              selectedAthlete.avatar || "🥋"
                            )}
                          </div>
                          <div className="flex-1">
                            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 font-black text-white">
                              <ImageIcon size={18} />
                              {uploadingPhoto ? "Téléversement..." : "Téléverser une photo"}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAthletePhotoUpload}
                                disabled={uploadingPhoto}
                                className="hidden"
                              />
                            </label>
                            <p className="mt-2 text-xs text-zinc-500">
                              La photo sera reliée automatiquement au profil public.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Prénom" className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Nom" className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Nom affiché publiquement" className="rounded-2xl border border-zinc-200 p-3 md:col-span-2" />
                        <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Courriel" className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville" className="rounded-2xl border border-zinc-200 p-3" />
                        <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="rounded-2xl border border-zinc-200 p-3">
                          <option value="">Province</option>
                          {PROVINCES.map((province) => (
                            <option key={province} value={province}>{province}</option>
                          ))}
                        </select>
                        <select value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} className="rounded-2xl border border-zinc-200 p-3">
                          <option value="">Discipline</option>
                          {DISCIPLINES.map((discipline) => (
                            <option key={discipline} value={discipline}>{discipline}</option>
                          ))}
                        </select>
                        <input value={form.dojo} onChange={(e) => setForm({ ...form, dojo: e.target.value })} placeholder="Club / Dojo" className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={form.belt} onChange={(e) => setForm({ ...form, belt: e.target.value })} placeholder="Ceinture / niveau" className="rounded-2xl border border-zinc-200 p-3" />
                        <select value={form.programRequested} onChange={(e) => setForm({ ...form, programRequested: e.target.value })} className="rounded-2xl border border-zinc-200 p-3">
                          <option value="">Programme demandé</option>
                          {PROGRAMS.map((program) => (
                            <option key={program} value={program}>{program}</option>
                          ))}
                        </select>
                        <select value={form.athleteStatus} onChange={(e) => setForm({ ...form, athleteStatus: e.target.value })} className="rounded-2xl border border-zinc-200 p-3">
                          <option value="">Statut</option>
                          {ATHLETE_STATUSES.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Présentation de l’athlète" className="min-h-32 rounded-2xl border border-zinc-200 p-3" />
                      <input value={form.athleteSocials} onChange={(e) => setForm({ ...form, athleteSocials: e.target.value })} placeholder="Réseaux sociaux" className="rounded-2xl border border-zinc-200 p-3" />
                      <button type="button" onClick={saveAthleteProfile} disabled={saving || uploadingPhoto} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60">
                        <Save size={18} />
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                      </button>
                      {saved && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">Profil sauvegardé.</p>}
                    </div>
                  )}
                </div>
              </section>
            )}

            {activeTab === "campaigns" && (
              <section className="mt-8 space-y-6">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Target style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Campagnes et participations</h2>
                  </div>
                  <div className="mt-5 space-y-4">
                    {familyFundingGroups.length === 0 && <p className="text-zinc-500">Aucune participation active.</p>}
                    {familyFundingGroups.map((group) => (
                      <CampaignGroupCard
                        key={group.fundingGroupId}
                        group={group}
                        campaigns={campaigns}
                        onEditParticipation={openParticipationEditor}
                      />
                    ))}
                  </div>
                </div>

                {editingParticipationGroup && (
                  <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: gold }}>
                          Modifier ma participation
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-zinc-950">
                          {editingParticipationGroup.campaignTitle || "Campagne"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          Ces informations pourront ensuite alimenter la page publique de l’athlète et la page campagne.
                        </p>
                      </div>
                      <button type="button" onClick={() => setEditingParticipationGroup(null)} className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700">
                        Fermer
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <input type="number" value={participationForm.goal} onChange={(e) => setParticipationForm({ ...participationForm, goal: e.target.value })} placeholder="Objectif financier" className="rounded-2xl border border-zinc-200 p-3" />
                      <textarea value={participationForm.fundingNeeds} onChange={(e) => setParticipationForm({ ...participationForm, fundingNeeds: e.target.value })} placeholder="Besoins de financement : transport, hébergement, inscription, équipement..." className="min-h-28 rounded-2xl border border-zinc-200 p-3" />
                      <textarea value={participationForm.campaignReason} onChange={(e) => setParticipationForm({ ...participationForm, campaignReason: e.target.value })} placeholder="Pourquoi cette campagne est importante pour l’athlète ?" className="min-h-28 rounded-2xl border border-zinc-200 p-3" />
                      <textarea value={participationForm.publicMessage} onChange={(e) => setParticipationForm({ ...participationForm, publicMessage: e.target.value })} placeholder="Message public affiché sur la campagne" className="min-h-28 rounded-2xl border border-zinc-200 p-3" />
                      <label className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-4 text-sm font-black text-zinc-700">
                        <input type="checkbox" checked={participationForm.isPublic} onChange={(e) => setParticipationForm({ ...participationForm, isPublic: e.target.checked })} />
                        Afficher cette participation publiquement
                      </label>
                      <button type="button" onClick={saveParticipationGroup} disabled={savingParticipation} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60">
                        <Save size={18} />
                        {savingParticipation ? "Sauvegarde..." : "Sauvegarder la participation"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === "contributions" && (
              <section className="mt-8 space-y-6">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <ReceiptText style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Ajouter une contribution</h2>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">
                    Ajoutez ici les montants reçus hors Shopify : dons directs, Interac, argent remis au dojo, commandites locales ou ventes terrain. Le montant sera ajouté à la campagne choisie.
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <select
                      value={newContribution.participationId}
                      onChange={(e) => setNewContribution({ ...newContribution, participationId: e.target.value })}
                      className="rounded-2xl border border-zinc-200 p-3 md:col-span-2"
                    >
                      <option value="">Choisir la campagne / participation</option>
                      {familyParticipations.map((participation) => {
                        const athlete = athletes.find((item) => item.id === participation.athleteId);
                        return (
                          <option key={participation.id} value={participation.id}>
                            {(athlete?.name || participation.athleteName || "Athlète")} — {participation.campaignTitle || campaignTitle(campaigns, participation.campaignId)}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newContribution.amount}
                      onChange={(e) => setNewContribution({ ...newContribution, amount: e.target.value })}
                      placeholder="Montant reçu"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <input
                      type="date"
                      value={newContribution.date}
                      onChange={(e) => setNewContribution({ ...newContribution, date: e.target.value })}
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <select
                      value={newContribution.source}
                      onChange={(e) => setNewContribution({ ...newContribution, source: e.target.value })}
                      className="rounded-2xl border border-zinc-200 p-3"
                    >
                      <option>Contribution manuelle</option>
                      <option>Don direct</option>
                      <option>Interac</option>
                      <option>Commandite locale</option>
                      <option>Vente terrain</option>
                      <option>Événement</option>
                    </select>

                    <input
                      value={newContribution.contributorName}
                      onChange={(e) => setNewContribution({ ...newContribution, contributorName: e.target.value })}
                      placeholder="Nom du contributeur / source"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <textarea
                      value={newContribution.note}
                      onChange={(e) => setNewContribution({ ...newContribution, note: e.target.value })}
                      placeholder="Note interne ou contexte"
                      className="min-h-24 rounded-2xl border border-zinc-200 p-3 md:col-span-2"
                    />

                    <button
                      type="button"
                      onClick={createManualContribution}
                      disabled={savingContribution}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60 md:col-span-2"
                    >
                      <Plus size={18} />
                      {savingContribution ? "Ajout..." : "Ajouter la contribution"}
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <ReceiptText style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Historique des contributions</h2>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <StatBox icon={ReceiptText} label="Total suivi" value={money(totalContributions)} sub="Shopify + contributions manuelles" />
                    <StatBox icon={Wallet} label="Transactions" value={contributions.length} sub="Contributions enregistrées" />
                    <StatBox icon={Target} label="Moyenne" value={money(contributions.length ? totalContributions / contributions.length : 0)} sub="Par contribution" />
                  </div>
                  <div className="mt-6 space-y-4">
                    {contributions.length === 0 && <p className="rounded-2xl bg-zinc-100 p-5 text-zinc-500">Aucune contribution enregistrée pour le moment.</p>}
                    {contributions.map((contribution) => (
                      <ContributionCard key={contribution.id} contribution={contribution} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "updates" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Megaphone style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Ajouter une nouvelle</h2>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} className="rounded-2xl border border-zinc-200 p-3">
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
                      ))}
                    </select>
                    <input value={newUpdate.title} onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })} placeholder="Titre" className="rounded-2xl border border-zinc-200 p-3" />
                    <textarea value={newUpdate.content} onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })} placeholder="Texte" className="min-h-32 rounded-2xl border border-zinc-200 p-3" />
                    <input value={newUpdate.mediaUrl} onChange={(e) => setNewUpdate({ ...newUpdate, mediaUrl: e.target.value })} placeholder="URL image ou média" className="rounded-2xl border border-zinc-200 p-3" />
                    <button type="button" onClick={publishUpdate} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white">
                      <Plus size={18} />
                      Soumettre pour validation
                    </button>
                  </div>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">Nouvelles envoyées</h2>
                  <div className="mt-5 space-y-3">
                    {updates.length === 0 && <p className="text-zinc-500">Aucune nouvelle envoyée pour cet athlète.</p>}
                    {updates.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-zinc-950">{item.title}</p>
                          <StatusBadge status={item.status || "en_attente"} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">{item.content}</p>
                        {item.mediaUrl && <p className="mt-2 text-xs text-zinc-500">Média : {item.mediaUrl}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "events" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <CalendarDays style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">Ajouter un événement</h2>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <select value={selectedAthleteId} onChange={(e) => setSelectedAthleteId(e.target.value)} className="rounded-2xl border border-zinc-200 p-3">
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
                      ))}
                    </select>
                    <select
                      value={newEvent.participationId}
                      onChange={(e) => setNewEvent({ ...newEvent, participationId: e.target.value })}
                      className="rounded-2xl border border-zinc-200 p-3"
                    >
                      <option value="">Campagne liée</option>
                      {selectedAthleteParticipations.map((participation) => (
                        <option key={participation.id} value={participation.id}>
                          {participation.campaignTitle || campaignTitle(campaigns, participation.campaignId)}
                        </option>
                      ))}
                    </select>
                    <input value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Titre de l’événement" className="rounded-2xl border border-zinc-200 p-3" />
                    <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                    <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Description" className="min-h-32 rounded-2xl border border-zinc-200 p-3" />
                    <input type="number" value={newEvent.goal} onChange={(e) => setNewEvent({ ...newEvent, goal: e.target.value })} placeholder="Objectif de l’événement" className="rounded-2xl border border-zinc-200 p-3" />
                    <input type="number" value={newEvent.amountRaised} onChange={(e) => setNewEvent({ ...newEvent, amountRaised: e.target.value })} placeholder="Montant réellement récolté" className="rounded-2xl border border-zinc-200 p-3" />
                    <button type="button" onClick={createFundingEvent} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white">
                      <Plus size={18} />
                      Soumettre pour validation
                    </button>
                  </div>
                </div>
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">Événements envoyés</h2>
                  <div className="mt-5 space-y-3">
                    {fundingEvents.length === 0 && <p className="text-zinc-500">Aucun événement envoyé pour cet athlète.</p>}
                    {fundingEvents.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-zinc-950">{item.title}</p>
                          <StatusBadge status={item.status || "en_attente"} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">{item.description}</p>
                        <p className="mt-2 text-sm text-zinc-500">Date : {item.date || "À confirmer"}</p>
                        <p className="mt-1 text-sm text-zinc-500">Objectif : {money(item.goal || 0)}</p>
                        <p className="mt-1 text-sm font-black text-emerald-700">Récolté : {money(item.raised || item.amountRaised || 0)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
