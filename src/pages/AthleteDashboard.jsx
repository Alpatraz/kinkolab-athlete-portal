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
} from "firebase/firestore";

import { db } from "../firebase";
import { campaignTitle, gold, money } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import {
  contributionTotal,
  subscribeContributionsByFamily,
} from "../services/fundTransactions";

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

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("fr-CA");
  }

  return String(value).slice(0, 10);
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
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${color}`}
    >
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
        active
          ? "bg-black text-white"
          : "bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-zinc-200 text-3xl">
        {athlete.photoUrl ? (
          <img
            src={athlete.photoUrl}
            alt={athlete.name}
            className="h-full w-full object-cover"
          />
        ) : (
          athlete.avatar || "🥋"
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-black">{athlete.name}</p>
        <p className="text-sm opacity-70">
          {athlete.discipline || "Discipline à confirmer"}
        </p>
        <p className="text-xs opacity-60">
          {athlete.belt ? `Ceinture ${athlete.belt}` : "Ceinture à confirmer"}
        </p>
      </div>
    </button>
  );
}

function CampaignGroupCard({ group, campaigns }) {
  const percent = percentOf(group.raised, group.goal);
  const campaign = campaigns.find((item) => item.id === group.campaignId);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: gold }}
          >
            {group.fundingMode === "family"
              ? "Fonds commun familial"
              : "Financement individuel"}
          </p>

          <h3 className="mt-2 text-2xl font-black text-zinc-950">
            {group.campaignTitle || campaign?.title || "Campagne"}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {campaign?.city || ""} {campaign?.country || ""}
            {campaign?.eventDate ? ` · Événement : ${campaign.eventDate}` : ""}
          </p>
        </div>

        <StatusBadge status="active" />
      </div>

      <div className="mt-4 rounded-2xl bg-zinc-100 p-4">
        <p className="text-sm font-black text-zinc-700">Participants</p>
        <p className="mt-1 text-sm text-zinc-600">
          {group.participations.map((item) => item.athleteName).join(", ")}
        </p>
      </div>

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
          <p className="mt-1 text-2xl font-black">
            {money(Math.max(group.goal - group.raised, 0))}
          </p>
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
  const amount = Number(
    contribution.amountReserved || contribution.reservedAmount || 0
  );

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
            {formatDate(contribution.createdAt) ||
              contribution.displayDate ||
              "Date à confirmer"}
          </p>

          <h3 className="mt-2 text-lg font-black text-zinc-950">
            {contribution.productName ||
              contribution.productTitle ||
              "Contribution Shopify"}
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            {contribution.customerName || contribution.customerEmail || "Client Shopify"}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase text-emerald-700">
            Réservé
          </p>
          <p className="text-xl font-black text-emerald-800">
            + {money(amount)}
          </p>
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
            {contribution.supportLabel ||
              contribution.athleteName ||
              contribution.familyName ||
              "—"}
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

  const [form, setForm] = useState({
    bio: "",
    photoUrl: "",
    dojo: "",
    discipline: "",
    belt: "",
    athleteSocials: "",
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
  });

  useEffect(() => {
    if (!currentUser?.familyId) return;

    async function loadFamily() {
      const snap = await getDoc(doc(db, "families", currentUser.familyId));

      if (snap.exists()) {
        setFamily({
          id: snap.id,
          ...snap.data(),
        });
      }
    }

    loadFamily();
  }, [currentUser?.familyId]);

  useEffect(() => {
    if (!currentUser?.familyId) return;

    const q = query(
      collection(db, "athletes"),
      where("familyId", "==", currentUser.familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setAthletes(data);

      if (data.length && !selectedAthleteId) {
        setSelectedAthleteId(data[0].id);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.familyId, selectedAthleteId]);

  useEffect(() => {
    if (!currentUser?.familyId) return;

    const unsubscribe = subscribeContributionsByFamily(
      currentUser.familyId,
      setContributions
    );

    return () => unsubscribe();
  }, [currentUser?.familyId]);

  const selectedAthlete = useMemo(() => {
    return (
      athletes.find((athlete) => athlete.id === selectedAthleteId) ||
      athletes[0] ||
      null
    );
  }, [athletes, selectedAthleteId]);

  useEffect(() => {
    if (!selectedAthlete) return;

    setForm({
      bio: selectedAthlete.bio || "",
      photoUrl: selectedAthlete.photoUrl || "",
      dojo: selectedAthlete.dojo || "",
      discipline: selectedAthlete.discipline || "",
      belt: selectedAthlete.belt || "",
      athleteSocials: selectedAthlete.athleteSocials || "",
    });

    setSaved(false);
  }, [selectedAthlete]);

  useEffect(() => {
    if (!selectedAthlete?.id) return;

    const q = query(
      collection(db, "athleteUpdates"),
      where("athleteId", "==", selectedAthlete.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [selectedAthlete?.id]);

  useEffect(() => {
    if (!selectedAthlete?.id) return;

    const q = query(
      collection(db, "fundraisingEvents"),
      where("athleteId", "==", selectedAthlete.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFundingEvents(
        snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }))
      );
    });

    return () => unsubscribe();
  }, [selectedAthlete?.id]);

  const familyAthleteIds = useMemo(() => {
    return athletes.map((athlete) => athlete.id);
  }, [athletes]);

  const familyParticipations = useMemo(() => {
    return (participations || []).filter(
      (participation) =>
        familyAthleteIds.includes(participation.athleteId) &&
        participation.status !== "archivée" &&
        participation.status !== "suspendue"
    );
  }, [participations, familyAthleteIds]);

  const selectedAthleteParticipations = useMemo(() => {
    if (!selectedAthlete?.id) return [];

    return familyParticipations.filter(
      (participation) => participation.athleteId === selectedAthlete.id
    );
  }, [familyParticipations, selectedAthlete?.id]);

  const familyFundingGroups = useMemo(() => {
    const map = new Map();

    familyParticipations.forEach((participation) => {
      const key = participation.fundingGroupId || participation.id;

      if (!map.has(key)) {
        map.set(key, {
          fundingGroupId: key,
          campaignId: participation.campaignId,
          campaignTitle:
            participation.campaignTitle ||
            campaignTitle(campaigns, participation.campaignId),
          fundingMode: participation.fundingMode,
          participations: [],
          goal: 0,
          raised: 0,
        });
      }

      const group = map.get(key);

      group.participations.push(participation);
      group.goal += Number(participation.goal || 0);
      group.raised += sumRaised(participation);
    });

    return Array.from(map.values());
  }, [familyParticipations, campaigns]);

  const familyGoal = familyFundingGroups.reduce(
    (sum, group) => sum + group.goal,
    0
  );

  const familyRaised = familyFundingGroups.reduce(
    (sum, group) => sum + group.raised,
    0
  );

  const familyRemaining = Math.max(familyGoal - familyRaised, 0);
  const familyPercent = percentOf(familyRaised, familyGoal);

  const totalContributions = contributionTotal(contributions);

  async function saveAthleteProfile() {
    if (!selectedAthlete?.id) return;

    try {
      setSaving(true);

      await updateDoc(doc(db, "athletes", selectedAthlete.id), {
        bio: form.bio,
        photoUrl: form.photoUrl,
        dojo: form.dojo,
        discipline: form.discipline,
        belt: form.belt,
        athleteSocials: form.athleteSocials,
        updatedAt: serverTimestamp(),
      });

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch {
      alert("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
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

      setNewUpdate({
        title: "",
        content: "",
        type: "Nouvelle",
        mediaUrl: "",
      });

      alert("Nouvelle soumise pour validation.");
    } catch {
      alert("Impossible d'ajouter la nouvelle.");
    }
  }

  async function createFundingEvent() {
    if (!selectedAthlete?.id) return;

    if (!newEvent.title.trim()) {
      alert("Le titre de l’événement est obligatoire.");
      return;
    }

    try {
      await addDoc(collection(db, "fundraisingEvents"), {
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        familyId: currentUser?.familyId || null,

        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description,
        goal: Number(newEvent.goal || 0),
        raised: 0,

        status: "en_attente",
        createdAt: serverTimestamp(),
      });

      setNewEvent({
        title: "",
        date: "",
        description: "",
        goal: "",
      });

      alert("Événement soumis pour validation.");
    } catch {
      alert("Impossible de créer l'événement.");
    }
  }
    return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={goHome}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={17} />
          Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: gold }}
          >
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
            <h2 className="text-2xl font-black text-zinc-950">
              Aucun compte famille associé
            </h2>
            <p className="mt-2 text-zinc-600">
              Votre compte n’est pas encore lié à une famille. Contactez l’admin KinkoLab.
            </p>
          </section>
        )}

        {currentUser?.familyId && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-4">
              <StatBox
                icon={Users}
                label="Athlètes"
                value={athletes.length}
                sub="Profils rattachés"
              />

              <StatBox
                icon={Target}
                label="Campagnes"
                value={familyFundingGroups.length}
                sub="Groupes de financement"
              />

              <StatBox
                icon={Wallet}
                label="Objectif"
                value={money(familyGoal)}
                sub={`Reste : ${money(familyRemaining)}`}
              />

              <StatBox
                icon={ReceiptText}
                label="Contributions"
                value={money(totalContributions)}
                sub={`${contributions.length} contribution(s)`}
              />
            </section>

            <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">
                Progression globale
              </h2>

              <div className="mt-5">
                <ProgressBar value={familyPercent} />
              </div>

              <p className="mt-3 text-sm text-zinc-500">
                {money(familyRaised)} récoltés sur {money(familyGoal)}
              </p>
            </section>

            <section className="mt-8 flex flex-wrap gap-2">
              <TabButton active={activeTab === "summary"} onClick={() => setActiveTab("summary")}>
                Résumé
              </TabButton>

              <TabButton active={activeTab === "athletes"} onClick={() => setActiveTab("athletes")}>
                Athlètes
              </TabButton>

              <TabButton active={activeTab === "campaigns"} onClick={() => setActiveTab("campaigns")}>
                Campagnes
              </TabButton>

              <TabButton active={activeTab === "contributions"} onClick={() => setActiveTab("contributions")}>
                Contributions
              </TabButton>

              <TabButton active={activeTab === "updates"} onClick={() => setActiveTab("updates")}>
                Nouvelles
              </TabButton>

              <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>
                Événements
              </TabButton>
            </section>

            {activeTab === "summary" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Users style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">
                      Membres de la famille
                    </h2>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {athletes.length === 0 && (
                      <p className="text-zinc-500">
                        Aucun athlète rattaché à cette famille.
                      </p>
                    )}

                    {athletes.map((athlete) => (
                      <button
                        key={athlete.id}
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
                    <h2 className="text-2xl font-black text-zinc-950">
                      Campagnes actives
                    </h2>
                  </div>

                  <div className="mt-5 space-y-4">
                    {familyFundingGroups.length === 0 && (
                      <p className="text-zinc-500">
                        Aucune campagne active pour cette famille.
                      </p>
                    )}

                    {familyFundingGroups.map((group) => (
                      <CampaignGroupCard key={group.fundingGroupId} group={group} campaigns={campaigns} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "contributions" && (
              <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <ReceiptText style={{ color: gold }} />
                  <h2 className="text-2xl font-black text-zinc-950">
                    Historique des contributions
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <StatBox
                    icon={ReceiptText}
                    label="Total réservé"
                    value={money(totalContributions)}
                    sub="Depuis Shopify"
                  />

                  <StatBox
                    icon={Wallet}
                    label="Transactions"
                    value={contributions.length}
                    sub="Contributions enregistrées"
                  />

                  <StatBox
                    icon={Target}
                    label="Moyenne"
                    value={money(contributions.length ? totalContributions / contributions.length : 0)}
                    sub="Par contribution"
                  />
                </div>

                <div className="mt-6 space-y-4">
                  {contributions.length === 0 && (
                    <p className="rounded-2xl bg-zinc-100 p-5 text-zinc-500">
                      Aucune contribution enregistrée pour le moment.
                    </p>
                  )}

                  {contributions.map((contribution) => (
                    <ContributionCard key={contribution.id} contribution={contribution} />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "athletes" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <UserRound style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">
                      Choisir un athlète
                    </h2>
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
                      <h2 className="text-2xl font-black text-zinc-950">
                        Modifier le profil
                      </h2>
                    </div>

                    {selectedAthlete && (
                      <button
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
                      <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="URL de la photo" className="rounded-2xl border border-zinc-200 p-3" />
                      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biographie / histoire de l’athlète" className="min-h-32 rounded-2xl border border-zinc-200 p-3" />
                      <input value={form.dojo} onChange={(e) => setForm({ ...form, dojo: e.target.value })} placeholder="Dojo" className="rounded-2xl border border-zinc-200 p-3" />
                      <input value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} placeholder="Discipline" className="rounded-2xl border border-zinc-200 p-3" />
                      <input value={form.belt} onChange={(e) => setForm({ ...form, belt: e.target.value })} placeholder="Ceinture / niveau" className="rounded-2xl border border-zinc-200 p-3" />
                      <input value={form.athleteSocials} onChange={(e) => setForm({ ...form, athleteSocials: e.target.value })} placeholder="Réseaux sociaux" className="rounded-2xl border border-zinc-200 p-3" />

                      <button onClick={saveAthleteProfile} disabled={saving} className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60">
                        <Save size={18} />
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                      </button>

                      {saved && (
                        <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                          Profil sauvegardé.
                        </p>
                      )}
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
                    <h2 className="text-2xl font-black text-zinc-950">
                      Campagnes et participations
                    </h2>
                  </div>

                  <div className="mt-5 space-y-4">
                    {familyFundingGroups.length === 0 && (
                      <p className="text-zinc-500">
                        Aucune participation active.
                      </p>
                    )}

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
                        <p
                          className="text-sm font-bold uppercase tracking-[0.2em]"
                          style={{ color: gold }}
                        >
                          Modifier ma participation
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-zinc-950">
                          {editingParticipationGroup.campaignTitle || "Campagne"}
                        </h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          Ces informations pourront ensuite alimenter la page publique de l’athlète et la page campagne.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingParticipationGroup(null)}
                        className="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-black text-zinc-700"
                      >
                        Fermer
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <input
                        type="number"
                        value={participationForm.goal}
                        onChange={(e) =>
                          setParticipationForm({
                            ...participationForm,
                            goal: e.target.value,
                          })
                        }
                        placeholder="Objectif financier"
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={participationForm.fundingNeeds}
                        onChange={(e) =>
                          setParticipationForm({
                            ...participationForm,
                            fundingNeeds: e.target.value,
                          })
                        }
                        placeholder="Besoins de financement : transport, hébergement, inscription, équipement..."
                        className="min-h-28 rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={participationForm.campaignReason}
                        onChange={(e) =>
                          setParticipationForm({
                            ...participationForm,
                            campaignReason: e.target.value,
                          })
                        }
                        placeholder="Pourquoi cette campagne est importante pour l’athlète ?"
                        className="min-h-28 rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={participationForm.publicMessage}
                        onChange={(e) =>
                          setParticipationForm({
                            ...participationForm,
                            publicMessage: e.target.value,
                          })
                        }
                        placeholder="Message public affiché sur la campagne"
                        className="min-h-28 rounded-2xl border border-zinc-200 p-3"
                      />

                      <label className="flex items-center gap-3 rounded-2xl bg-zinc-100 p-4 text-sm font-black text-zinc-700">
                        <input
                          type="checkbox"
                          checked={participationForm.isPublic}
                          onChange={(e) =>
                            setParticipationForm({
                              ...participationForm,
                              isPublic: e.target.checked,
                            })
                          }
                        />
                        Afficher cette participation publiquement
                      </label>

                      <button
                        type="button"
                        onClick={saveParticipationGroup}
                        disabled={savingParticipation}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60"
                      >
                        <Save size={18} />
                        {savingParticipation
                          ? "Sauvegarde..."
                          : "Sauvegarder la participation"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === "contributions" && (
              <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <ReceiptText style={{ color: gold }} />
                  <h2 className="text-2xl font-black text-zinc-950">
                    Historique des contributions
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <StatBox
                    icon={ReceiptText}
                    label="Total réservé"
                    value={money(totalContributions)}
                    sub="Depuis Shopify"
                  />

                  <StatBox
                    icon={Wallet}
                    label="Transactions"
                    value={contributions.length}
                    sub="Contributions enregistrées"
                  />

                  <StatBox
                    icon={Target}
                    label="Moyenne"
                    value={money(
                      contributions.length
                        ? totalContributions / contributions.length
                        : 0
                    )}
                    sub="Par contribution"
                  />
                </div>

                <div className="mt-6 space-y-4">
                  {contributions.length === 0 && (
                    <p className="rounded-2xl bg-zinc-100 p-5 text-zinc-500">
                      Aucune contribution enregistrée pour le moment.
                    </p>
                  )}

                  {contributions.map((contribution) => (
                    <ContributionCard
                      key={contribution.id}
                      contribution={contribution}
                    />
                  ))}
                </div>
              </section>
            )}

            {activeTab === "updates" && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Megaphone style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">
                      Ajouter une nouvelle
                    </h2>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <select
                      value={selectedAthleteId}
                      onChange={(e) => setSelectedAthleteId(e.target.value)}
                      className="rounded-2xl border border-zinc-200 p-3"
                    >
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={newUpdate.title}
                      onChange={(e) =>
                        setNewUpdate({ ...newUpdate, title: e.target.value })
                      }
                      placeholder="Titre"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <textarea
                      value={newUpdate.content}
                      onChange={(e) =>
                        setNewUpdate({ ...newUpdate, content: e.target.value })
                      }
                      placeholder="Texte"
                      className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                    />

                    <input
                      value={newUpdate.mediaUrl}
                      onChange={(e) =>
                        setNewUpdate({ ...newUpdate, mediaUrl: e.target.value })
                      }
                      placeholder="URL image ou média"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <button
                      type="button"
                      onClick={publishUpdate}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white"
                    >
                      <Plus size={18} />
                      Soumettre pour validation
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">
                    Nouvelles envoyées
                  </h2>

                  <div className="mt-5 space-y-3">
                    {updates.length === 0 && (
                      <p className="text-zinc-500">
                        Aucune nouvelle envoyée pour cet athlète.
                      </p>
                    )}

                    {updates.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-zinc-950">
                            {item.title}
                          </p>
                          <StatusBadge status={item.status || "en_attente"} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">
                          {item.content}
                        </p>
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
                    <h2 className="text-2xl font-black text-zinc-950">
                      Ajouter un événement
                    </h2>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <select
                      value={selectedAthleteId}
                      onChange={(e) => setSelectedAthleteId(e.target.value)}
                      className="rounded-2xl border border-zinc-200 p-3"
                    >
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                      placeholder="Titre de l’événement"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, date: e.target.value })
                      }
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <textarea
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                      placeholder="Description"
                      className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                    />

                    <input
                      type="number"
                      value={newEvent.goal}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, goal: e.target.value })
                      }
                      placeholder="Objectif de l’événement"
                      className="rounded-2xl border border-zinc-200 p-3"
                    />

                    <button
                      type="button"
                      onClick={createFundingEvent}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white"
                    >
                      <Plus size={18} />
                      Soumettre pour validation
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">
                    Événements envoyés
                  </h2>

                  <div className="mt-5 space-y-3">
                    {fundingEvents.length === 0 && (
                      <p className="text-zinc-500">
                        Aucun événement envoyé pour cet athlète.
                      </p>
                    )}

                    {fundingEvents.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-zinc-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black text-zinc-950">
                            {item.title}
                          </p>
                          <StatusBadge status={item.status || "en_attente"} />
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">
                          {item.description}
                        </p>
                        <p className="mt-2 text-sm text-zinc-500">
                          Objectif : {money(item.goal || 0)}
                        </p>
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
