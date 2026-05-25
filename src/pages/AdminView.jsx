import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  Ban,
  CheckCircle2,
  DollarSign,
  Eye,
  FolderKanban,
  Megaphone,
  MessageCircle,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  UserPlus2,
  Users,
  XCircle,
  Link2,
} from "lucide-react";

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase";

import {
  campaignTitle,
  gold,
  money,
  progressOf,
  totalRaised,
} from "../utils/format";

import StatCard from "../components/StatCard";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function StatusPill({ status }) {
  const colors = {
    actif: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accepté: "bg-emerald-50 text-emerald-700 border-emerald-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    suspendu: "bg-amber-50 text-amber-700 border-amber-200",
    suspendue: "bg-amber-50 text-amber-700 border-amber-200",
    terminee: "bg-blue-50 text-blue-700 border-blue-200",
    archivé: "bg-zinc-100 text-zinc-700 border-zinc-300",
    archivée: "bg-zinc-100 text-zinc-700 border-zinc-300",
    en_attente: "bg-amber-50 text-amber-700 border-amber-200",
    refusé: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
        colors[status] || colors.en_attente
      }`}
    >
      {status || "en_attente"}
    </span>
  );
}

function AdminButton({
  children,
  onClick,
  variant = "dark",
  disabled = false,
}) {
  const styles = {
    dark: "bg-black text-white",
    green: "bg-emerald-600 text-white",
    red: "bg-red-600 text-white",
    amber: "bg-amber-500 text-black",
    light: "bg-white text-zinc-950 border border-zinc-300",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

const emptyCampaign = {
  title: "",
  year: "2026",
  type: "event",
  status: "active",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  eventDate: "",
  goal: "",
  shopifyUrl: "",
  sponsorUrl: "",
  description: "",
};

export default function AdminView({
  athletes = [],
  campaigns = [],
  wallMessages = [],
  setWallMessages,
  goBack,
  onOpenAthlete,
}) {
  const [activeTab, setActiveTab] = useState("candidatures");

  const [applications, setApplications] = useState([]);
  const [families, setFamilies] = useState([]);
  const [firestoreCampaigns, setFirestoreCampaigns] = useState([]);
  const [participations, setParticipations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [acceptedAccess, setAcceptedAccess] = useState(null);

  const [newCampaign, setNewCampaign] = useState(emptyCampaign);

  const [editingCampaignId, setEditingCampaignId] = useState("");

  const [editingCampaign, setEditingCampaign] =
    useState(emptyCampaign);

  const [newFamily, setNewFamily] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
  });

  const [newParticipation, setNewParticipation] = useState({
    athleteId: "",
    campaignId: "",
    fundingMode: "individual",
    goal: "",
  });

  useEffect(() => {
    const unsubApps = onSnapshot(
      query(
        collection(db, "applications"),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        setApplications(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );

        setLoading(false);
      }
    );

    const unsubFamilies = onSnapshot(
      collection(db, "families"),
      (snapshot) => {
        setFamilies(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    const unsubCampaigns = onSnapshot(
      collection(db, "campaigns"),
      (snapshot) => {
        setFirestoreCampaigns(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    const unsubParticipations = onSnapshot(
      collection(db, "campaignParticipations"),
      (snapshot) => {
        setParticipations(
          snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );

    return () => {
      unsubApps();
      unsubFamilies();
      unsubCampaigns();
      unsubParticipations();
    };
  }, []);

  const allCampaigns = useMemo(() => {
    const map = new Map();

    campaigns.forEach((campaign) =>
      map.set(campaign.id, campaign)
    );

    firestoreCampaigns.forEach((campaign) =>
      map.set(campaign.id, campaign)
    );

    return Array.from(map.values());
  }, [campaigns, firestoreCampaigns]);

  const pendingApplications = applications.filter(
    (application) =>
      (application.status || "en_attente") === "en_attente"
  );

  const pendingMessages = wallMessages.filter(
    (message) => message.status === "en_attente"
  );

  const athletesWithoutFamily = athletes.filter(
    (athlete) => !athlete.familyId
  );

  async function createParticipation() {
    if (
      !newParticipation.athleteId ||
      !newParticipation.campaignId
    ) {
      alert("Athlète et campagne obligatoires.");
      return;
    }

    const athlete = athletes.find(
      (a) => a.id === newParticipation.athleteId
    );

    const campaign = allCampaigns.find(
      (c) => c.id === newParticipation.campaignId
    );

    if (!athlete || !campaign) {
      alert("Athlète ou campagne introuvable.");
      return;
    }

    let fundingGroupId = "";

    if (newParticipation.fundingMode === "family") {
      if (!athlete.familyId) {
        alert(
          "Cet athlète n’appartient à aucune famille."
        );
        return;
      }

      fundingGroupId = `${athlete.familyId}-${campaign.id}`;
    } else {
      fundingGroupId = `${athlete.id}-${campaign.id}`;
    }

    const participationId = slugify(
      `${athlete.id}-${campaign.id}-${newParticipation.fundingMode}`
    );

    await setDoc(
      doc(
        db,
        "campaignParticipations",
        participationId
      ),
      {
        athleteId: athlete.id,
        athleteName: athlete.name,

        familyId: athlete.familyId || null,
        familyName: athlete.familyName || null,

        campaignId: campaign.id,
        campaignTitle: campaign.title,

        fundingMode: newParticipation.fundingMode,
        fundingGroupId,

        goal: Number(newParticipation.goal || 0),

        raisedShop: 0,
        raisedOffline: 0,
        raisedSponsorship: 0,

        status: "active",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewParticipation({
      athleteId: "",
      campaignId: "",
      fundingMode: "individual",
      goal: "",
    });

    alert("Participation créée.");
  }

  function participationAthleteName(id) {
    return athletes.find((a) => a.id === id)?.name || id;
  }

  function participationCampaignName(id) {
    return (
      allCampaigns.find((c) => c.id === id)?.title || id
    );
  }

  const tabs = [
    ["candidatures", "Candidatures"],
    ["athletes", "Athlètes"],
    ["families", "Familles"],
    ["campaigns", "Campagnes"],
    ["participations", "Participations"],
    ["messages", "Messages"],
  ];
  async function updateApplicationCampaign(applicationId, campaignId) {
    const campaign = allCampaigns.find((item) => item.id === campaignId);

    await updateDoc(doc(db, "applications", applicationId), {
      campaignId,
      campaignTitle: campaign?.title || "",
      updatedAt: serverTimestamp(),
    });
  }

  async function acceptApplication(application) {
    setActionLoadingId(application.id);
    setAcceptedAccess(null);

    try {
      const response = await fetch("/.netlify/functions/accept-athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: application.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l’acceptation.");
      }

      setAcceptedAccess({
        athleteId: data.athleteId,
        email: data.email,
        temporaryPassword: data.temporaryPassword,
      });
    } catch (error) {
      alert(error.message || "Erreur lors de l’acceptation.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function refuseApplication(application) {
    setActionLoadingId(application.id);

    try {
      await updateDoc(doc(db, "applications", application.id), {
        status: "refusé",
        refusedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Erreur lors du refus.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function updateAthleteStatus(athlete, status) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        status,
        isPublic: status !== "suspendu" && status !== "archivé",
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de modifier cet athlète.");
    }
  }

  async function createCampaign() {
    if (!newCampaign.title.trim()) {
      alert("Le titre de la campagne est obligatoire.");
      return;
    }

    const campaignId = slugify(`${newCampaign.title}-${newCampaign.year}`);

    await setDoc(
      doc(db, "campaigns", campaignId),
      {
        ...newCampaign,
        id: campaignId,
        goal: Number(newCampaign.goal || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewCampaign(emptyCampaign);
  }

  function startEditCampaign(campaign) {
    setEditingCampaignId(campaign.id);
    setEditingCampaign({
      title: campaign.title || "",
      year: campaign.year || "2026",
      type: campaign.type || "event",
      status: campaign.status || "active",
      country: campaign.country || "",
      city: campaign.city || "",
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
      eventDate: campaign.eventDate || "",
      goal: campaign.goal || "",
      shopifyUrl: campaign.shopifyUrl || "",
      sponsorUrl: campaign.sponsorUrl || "",
      description: campaign.description || "",
    });
  }

  async function saveEditedCampaign() {
    if (!editingCampaignId) return;

    try {
      await updateDoc(doc(db, "campaigns", editingCampaignId), {
        ...editingCampaign,
        goal: Number(editingCampaign.goal || 0),
        updatedAt: serverTimestamp(),
      });

      setEditingCampaignId("");
      setEditingCampaign(emptyCampaign);
    } catch {
      alert("Impossible de modifier cette campagne.");
    }
  }

  async function updateCampaignStatus(campaign, status) {
    try {
      await updateDoc(doc(db, "campaigns", campaign.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de modifier cette campagne.");
    }
  }

  async function createFamily() {
    if (!newFamily.name.trim() || !newFamily.contactEmail.trim()) {
      alert("Nom de famille et courriel principal obligatoires.");
      return;
    }

    const familyId = slugify(newFamily.name);

    await setDoc(
      doc(db, "families", familyId),
      {
        id: familyId,
        name: newFamily.name,
        contactEmail: newFamily.contactEmail,
        contactName: newFamily.contactName,
        athleteIds: [],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setNewFamily({ name: "", contactName: "", contactEmail: "" });
  }

  async function addAthleteToFamily(athlete, family) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        familyId: family.id,
        familyName: family.name,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: arrayUnion(athlete.id),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible d’ajouter l’athlète à cette famille.");
    }
  }

  async function removeAthleteFromFamily(athlete, family) {
    try {
      await updateDoc(doc(db, "athletes", athlete.id), {
        familyId: null,
        familyName: null,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: arrayRemove(athlete.id),
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de retirer l’athlète de cette famille.");
    }
  }

  async function updateParticipationStatus(participation, status) {
    try {
      await updateDoc(doc(db, "campaignParticipations", participation.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch {
      alert("Impossible de modifier cette participation.");
    }
  }

  function approveMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id ? { ...message, status: "approuvé" } : message
      )
    );
  }

  function refuseMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id ? { ...message, status: "refusé" } : message
      )
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950">
          <ArrowLeft size={17} /> Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Admin privé
          </p>
          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            Dashboard admin Kinko Athletes
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Gestion des candidatures, athlètes, familles, campagnes, participations et validations.
          </p>
        </section>

        {acceptedAccess && (
          <section className="mt-8 rounded-[2rem] border border-emerald-300 bg-emerald-50 p-6 shadow-xl">
            <h2 className="text-2xl font-black text-emerald-900">Compte athlète créé</h2>
            <p className="mt-2 text-sm text-emerald-800">Copie ces accès avant de quitter cette page.</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Athlete ID</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.athleteId}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Courriel</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.email}</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">Mot de passe temporaire</p>
                <p className="mt-1 font-black text-zinc-950">{acceptedAccess.temporaryPassword}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <AdminButton
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Courriel: ${acceptedAccess.email}\nMot de passe temporaire: ${acceptedAccess.temporaryPassword}`
                  );
                }}
              >
                Copier les accès
              </AdminButton>

              <AdminButton variant="light" onClick={() => setAcceptedAccess(null)}>
                J’ai copié les accès
              </AdminButton>

              <AdminButton variant="light" onClick={() => onOpenAthlete(acceptedAccess.athleteId)}>
                <Eye size={16} /> Voir la page publique
              </AdminButton>
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard light icon={Users} label="Athlètes" value={athletes.length} sub="Profils" />
          <StatCard light icon={Megaphone} label="Campagnes" value={allCampaigns.length} sub="Total" />
          <StatCard light icon={Link2} label="Participations" value={participations.length} sub="Campagnes liées" />
          <StatCard light icon={DollarSign} label="Fonds suivis" value={money(athletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0))} sub="Total plateforme" />
        </section>

        <section className="mt-8 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`rounded-2xl px-5 py-3 font-black ${
                activeTab === key ? "bg-black text-white" : "bg-white text-zinc-950"
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        {activeTab === "candidatures" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <PencilLine style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Demandes en attente</h2>
            </div>

            <div className="mt-5 space-y-4">
              {loading && <p className="text-zinc-500">Chargement...</p>}
              {!loading && pendingApplications.length === 0 && <p className="text-zinc-500">Aucune demande en attente.</p>}

              {pendingApplications.map((application) => {
                const athleteName =
                  application.athleteName ||
                  `${application.firstName || ""} ${application.lastName || ""}`.trim();

                return (
                  <div key={application.id} className="rounded-2xl border border-zinc-200 p-5">
                    {application.photo && (
                      <img src={application.photo} alt={athleteName} className="mb-4 h-56 w-full rounded-2xl object-cover" />
                    )}

                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-2xl font-black text-zinc-950">{athleteName || "Nom à confirmer"}</h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {application.city || "Ville inconnue"} · {application.province || "Province inconnue"}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">Dojo : {application.dojo || "À confirmer"}</p>
                        <p className="mt-1 text-sm text-zinc-600">Objectif : {money(Number(application.desiredGoal || 0))}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <AdminButton variant="green" disabled={actionLoadingId === application.id} onClick={() => acceptApplication(application)}>
                          <CheckCircle2 size={17} />
                          {actionLoadingId === application.id ? "Traitement..." : "Accepter"}
                        </AdminButton>

                        <AdminButton variant="red" disabled={actionLoadingId === application.id} onClick={() => refuseApplication(application)}>
                          <XCircle size={17} /> Refuser
                        </AdminButton>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                      <p><b>Courriel athlète :</b> {application.email}</p>
                      <p><b>Parent :</b> {application.parentName}</p>
                      <p><b>Courriel parent :</b> {application.parentEmail}</p>
                      <p><b>Téléphone parent :</b> {application.parentPhone}</p>
                      <p><b>Coach :</b> {application.coach}</p>
                      <p><b>Discipline :</b> {application.discipline}</p>
                      <p><b>Ceinture :</b> {application.belt}</p>
                      <p><b>Famille :</b> {application.familyName}</p>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-black text-zinc-700">Campagne associée</label>
                      <select
                        value={application.campaignId || ""}
                        onChange={(event) => updateApplicationCampaign(application.id, event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950"
                      >
                        {allCampaigns.map((campaign) => (
                          <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                        ))}
                      </select>
                    </div>

                    {application.motivation && (
                      <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700">
                        <b>Motivation :</b>
                        <p className="mt-1">{application.motivation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "athletes" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Gestion des athlètes</h2>

            <div className="mt-5 space-y-3">
              {athletes.map((athlete) => (
                <div key={athlete.id} className="rounded-2xl border border-zinc-200 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-xl font-black text-zinc-950">
                        {athlete.avatar} {athlete.name}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {athlete.dojo} · {campaignTitle(allCampaigns, athlete.campaignId)}
                      </p>
                      <div className="mt-2">
                        <StatusPill status={athlete.status || "actif"} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AdminButton variant="light" onClick={() => onOpenAthlete(athlete.id)}>
                        <Eye size={16} /> Voir
                      </AdminButton>
                      <AdminButton variant="amber" onClick={() => updateAthleteStatus(athlete, "suspendu")}>
                        <Ban size={16} /> Suspendre
                      </AdminButton>
                      <AdminButton variant="green" onClick={() => updateAthleteStatus(athlete, "actif")}>
                        <RotateCcw size={16} /> Réactiver
                      </AdminButton>
                      <AdminButton variant="light" onClick={() => updateAthleteStatus(athlete, "archivé")}>
                        <Archive size={16} /> Archiver
                      </AdminButton>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-zinc-600">
                    Progression : <b>{progressOf(athlete)}%</b> · Objectif : <b>{money(athlete.goal || 0)}</b>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "families" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Shield style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une famille</h2>
              </div>

              <div className="mt-5 grid gap-3">
                <input value={newFamily.name} onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })} placeholder="Nom de famille" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newFamily.contactName} onChange={(e) => setNewFamily({ ...newFamily, contactName: e.target.value })} placeholder="Parent responsable" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newFamily.contactEmail} onChange={(e) => setNewFamily({ ...newFamily, contactEmail: e.target.value })} placeholder="Courriel principal" className="rounded-2xl border border-zinc-200 p-3" />

                <AdminButton onClick={createFamily}>
                  <Save size={16} /> Créer la famille
                </AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Familles existantes</h2>

              <div className="mt-5 space-y-4">
                {families.length === 0 && <p className="text-zinc-500">Aucune famille créée.</p>}

                {families.map((family) => {
                  const familyAthletes = athletes.filter((athlete) => athlete.familyId === family.id);

                  return (
                    <div key={family.id} className="rounded-2xl border border-zinc-200 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-black">{family.name}</h3>
                          <p className="text-sm text-zinc-500">{family.contactName || "Responsable non défini"}</p>
                          <p className="text-sm text-zinc-500">{family.contactEmail}</p>
                        </div>
                        <StatusPill status={family.status || "active"} />
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="text-sm font-black text-zinc-700">Athlètes de la famille</p>
                        {familyAthletes.length === 0 && <p className="text-sm text-zinc-400">Aucun athlète rattaché.</p>}

                        {familyAthletes.map((athlete) => (
                          <div key={athlete.id} className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3">
                            <span className="font-bold">{athlete.avatar} {athlete.name}</span>
                            <AdminButton variant="red" onClick={() => removeAthleteFromFamily(athlete, family)}>
                              <Trash2 size={15} /> Retirer
                            </AdminButton>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 space-y-2">
                        <p className="text-sm font-black text-zinc-700">Ajouter un athlète sans famille</p>
                        {athletesWithoutFamily.length === 0 && <p className="text-sm text-zinc-400">Aucun athlète disponible.</p>}

                        {athletesWithoutFamily.map((athlete) => (
                          <button
                            key={athlete.id}
                            onClick={() => addAthleteToFamily(athlete, family)}
                            className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-100"
                          >
                            <span>{athlete.avatar} {athlete.name}</span>
                            <UserPlus2 size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === "campaigns" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Plus style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une campagne</h2>
              </div>

              <div className="mt-5 grid gap-3">
                <input value={newCampaign.title} onChange={(event) => setNewCampaign({ ...newCampaign, title: event.target.value })} placeholder="Titre" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newCampaign.year} onChange={(event) => setNewCampaign({ ...newCampaign, year: event.target.value })} placeholder="Année" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newCampaign.country} onChange={(event) => setNewCampaign({ ...newCampaign, country: event.target.value })} placeholder="Pays" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newCampaign.city} onChange={(event) => setNewCampaign({ ...newCampaign, city: event.target.value })} placeholder="Ville" className="rounded-2xl border border-zinc-200 p-3" />

                <label className="text-sm font-black text-zinc-700">Date de début</label>
                <input type="date" value={newCampaign.startDate} onChange={(event) => setNewCampaign({ ...newCampaign, startDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />

                <label className="text-sm font-black text-zinc-700">Date de fin</label>
                <input type="date" value={newCampaign.endDate} onChange={(event) => setNewCampaign({ ...newCampaign, endDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />

                <label className="text-sm font-black text-zinc-700">Date de compétition / événement</label>
                <input type="date" value={newCampaign.eventDate} onChange={(event) => setNewCampaign({ ...newCampaign, eventDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />

                <input value={newCampaign.goal} onChange={(event) => setNewCampaign({ ...newCampaign, goal: event.target.value })} type="number" placeholder="Objectif global" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newCampaign.shopifyUrl} onChange={(event) => setNewCampaign({ ...newCampaign, shopifyUrl: event.target.value })} placeholder="Lien Shopify" className="rounded-2xl border border-zinc-200 p-3" />
                <input value={newCampaign.sponsorUrl} onChange={(event) => setNewCampaign({ ...newCampaign, sponsorUrl: event.target.value })} placeholder="Lien commandite" className="rounded-2xl border border-zinc-200 p-3" />
                <textarea value={newCampaign.description} onChange={(event) => setNewCampaign({ ...newCampaign, description: event.target.value })} placeholder="Description" className="min-h-28 rounded-2xl border border-zinc-200 p-3" />

                <AdminButton onClick={createCampaign}>
                  <Save size={16} /> Créer la campagne
                </AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <FolderKanban style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Campagnes existantes</h2>
              </div>

              <div className="mt-5 space-y-3">
                {allCampaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-2xl border border-zinc-200 p-5">
                    {editingCampaignId === campaign.id ? (
                      <div className="grid gap-3">
                        <input value={editingCampaign.title} onChange={(event) => setEditingCampaign({ ...editingCampaign, title: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={editingCampaign.year} onChange={(event) => setEditingCampaign({ ...editingCampaign, year: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={editingCampaign.country} onChange={(event) => setEditingCampaign({ ...editingCampaign, country: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={editingCampaign.city} onChange={(event) => setEditingCampaign({ ...editingCampaign, city: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input type="date" value={editingCampaign.startDate} onChange={(event) => setEditingCampaign({ ...editingCampaign, startDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input type="date" value={editingCampaign.endDate} onChange={(event) => setEditingCampaign({ ...editingCampaign, endDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input type="date" value={editingCampaign.eventDate} onChange={(event) => setEditingCampaign({ ...editingCampaign, eventDate: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input type="number" value={editingCampaign.goal} onChange={(event) => setEditingCampaign({ ...editingCampaign, goal: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={editingCampaign.shopifyUrl} onChange={(event) => setEditingCampaign({ ...editingCampaign, shopifyUrl: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <input value={editingCampaign.sponsorUrl} onChange={(event) => setEditingCampaign({ ...editingCampaign, sponsorUrl: event.target.value })} className="rounded-2xl border border-zinc-200 p-3" />
                        <textarea value={editingCampaign.description} onChange={(event) => setEditingCampaign({ ...editingCampaign, description: event.target.value })} className="min-h-28 rounded-2xl border border-zinc-200 p-3" />

                        <div className="flex gap-2">
                          <AdminButton variant="green" onClick={saveEditedCampaign}>Sauvegarder</AdminButton>
                          <AdminButton variant="light" onClick={() => setEditingCampaignId("")}>Annuler</AdminButton>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-xl font-black text-zinc-950">{campaign.title}</h3>
                        <p className="mt-1 text-sm text-zinc-600">
                          {campaign.year || ""} · {campaign.city || ""} {campaign.country || ""} · Objectif : {money(Number(campaign.goal || 0))}
                        </p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Début : {campaign.startDate || "—"} · Fin : {campaign.endDate || "—"} · Événement : {campaign.eventDate || "—"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <StatusPill status={campaign.status || "active"} />
                          <AdminButton variant="light" onClick={() => startEditCampaign(campaign)}>Modifier</AdminButton>
                          <AdminButton variant="green" onClick={() => updateCampaignStatus(campaign, "active")}>Active</AdminButton>
                          <AdminButton variant="amber" onClick={() => updateCampaignStatus(campaign, "suspendue")}>Suspendre</AdminButton>
                          <AdminButton variant="light" onClick={() => updateCampaignStatus(campaign, "terminee")}>Terminée</AdminButton>
                          <AdminButton variant="light" onClick={() => updateCampaignStatus(campaign, "archivée")}>Archiver</AdminButton>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "participations" && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Link2 style={{ color: gold }} />
                <h2 className="text-2xl font-black text-zinc-950">Créer une participation</h2>
              </div>

              <div className="mt-5 grid gap-3">
                <label className="text-sm font-black text-zinc-700">Athlète</label>
                <select
                  value={newParticipation.athleteId}
                  onChange={(event) =>
                    setNewParticipation({ ...newParticipation, athleteId: event.target.value })
                  }
                  className="rounded-2xl border border-zinc-200 p-3"
                >
                  <option value="">Choisir un athlète</option>
                  {athletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </option>
                  ))}
                </select>

                <label className="text-sm font-black text-zinc-700">Campagne</label>
                <select
                  value={newParticipation.campaignId}
                  onChange={(event) =>
                    setNewParticipation({ ...newParticipation, campaignId: event.target.value })
                  }
                  className="rounded-2xl border border-zinc-200 p-3"
                >
                  <option value="">Choisir une campagne</option>
                  {allCampaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title}
                    </option>
                  ))}
                </select>

                <label className="text-sm font-black text-zinc-700">Mode de financement</label>
                <select
                  value={newParticipation.fundingMode}
                  onChange={(event) =>
                    setNewParticipation({ ...newParticipation, fundingMode: event.target.value })
                  }
                  className="rounded-2xl border border-zinc-200 p-3"
                >
                  <option value="individual">Individuel</option>
                  <option value="family">Famille / fonds commun</option>
                </select>

                <input
                  type="number"
                  value={newParticipation.goal}
                  onChange={(event) =>
                    setNewParticipation({ ...newParticipation, goal: event.target.value })
                  }
                  placeholder="Objectif de participation"
                  className="rounded-2xl border border-zinc-200 p-3"
                />

                <AdminButton onClick={createParticipation}>
                  <Save size={16} /> Créer la participation
                </AdminButton>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-xl">
              <h2 className="text-2xl font-black text-zinc-950">Participations existantes</h2>

              <div className="mt-5 space-y-3">
                {participations.length === 0 && (
                  <p className="text-zinc-500">Aucune participation créée.</p>
                )}

                {participations.map((participation) => (
                  <div key={participation.id} className="rounded-2xl border border-zinc-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black text-zinc-950">
                          {participationAthleteName(participation.athleteId)}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {participationCampaignName(participation.campaignId)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Mode : <b>{participation.fundingMode === "family" ? "Famille" : "Individuel"}</b>
                        </p>
                        <p className="text-sm text-zinc-500">
                          Groupe fonds : {participation.fundingGroupId}
                        </p>
                      </div>

                      <StatusPill status={participation.status || "active"} />
                    </div>

                    <div className="mt-3 text-sm text-zinc-600">
                      Objectif : <b>{money(participation.goal || 0)}</b> · Collecté :{" "}
                      <b>
                        {money(
                          Number(participation.raisedShop || 0) +
                            Number(participation.raisedOffline || 0) +
                            Number(participation.raisedSponsorship || 0)
                        )}
                      </b>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <AdminButton variant="green" onClick={() => updateParticipationStatus(participation, "active")}>
                        Active
                      </AdminButton>
                      <AdminButton variant="amber" onClick={() => updateParticipationStatus(participation, "suspendue")}>
                        Suspendre
                      </AdminButton>
                      <AdminButton variant="light" onClick={() => updateParticipationStatus(participation, "terminee")}>
                        Terminée
                      </AdminButton>
                      <AdminButton variant="light" onClick={() => updateParticipationStatus(participation, "archivée")}>
                        Archiver
                      </AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "messages" && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Messages en attente</h2>

            <div className="mt-5 space-y-3">
              {pendingMessages.length === 0 && <p className="text-zinc-500">Aucun message à valider.</p>}

              {pendingMessages.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="font-black text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>

                  <div className="mt-4 flex gap-2">
                    <AdminButton variant="green" onClick={() => approveMessage(item.id)}>
                      Approuver
                    </AdminButton>

                    <AdminButton variant="red" onClick={() => refuseMessage(item.id)}>
                      Refuser
                    </AdminButton>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
