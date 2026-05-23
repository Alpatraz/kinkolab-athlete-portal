import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  DollarSign,
  Megaphone,
  MessageCircle,
  PencilLine,
  Users,
  XCircle,
} from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { campaignTitle, gold, money, progressOf, totalRaised } from "../utils/format";
import StatCard from "../components/StatCard";
import { db } from "../firebase";

function slugify(value) {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAthleteFromApplication(application, campaigns) {
  const athleteName =
    application.athleteName ||
    `${application.firstName || ""} ${application.lastName || ""}`.trim();

  const athleteId = slugify(athleteName || `athlete-${application.id}`);

  const campaignName =
    application.campaignTitle ||
    campaignTitle(campaigns, application.campaignId);

  return {
    id: athleteId,
    name: athleteName,
    firstName: application.firstName || "",
    lastName: application.lastName || "",
    email: application.email || "",
    phone: application.phone || "",

    status: "accepté",
    avatar: "🥋",
    photoUrl: application.photo || "",

    countryFlag: "🇨🇦",
    province: application.province || "Québec",
    city: application.city || "",
    dojo: application.dojo || "À confirmer",
    coach: application.coach || "",
    discipline: application.discipline || "Arts martiaux",
    belt: application.belt || "À confirmer",

    campaignId: application.campaignId || "",
    program: campaignName,
    campaignBadge: campaignName,
    athleteLabel: "Athlète Kinko",

    goal: Number(application.desiredGoal || 0),
    raisedShop: 0,
    raisedOffline: 0,
    raisedSponsorship: 0,

    shopifyUrl: "https://kinkolab.com",
    sponsorUrl: "https://kinkolab.com",

    fundingPurpose:
      application.campaignReason ||
      "financer sa participation, son déplacement, son hébergement et son équipement",

    bio:
      application.motivation ||
      `${athleteName} rejoint le Programme Athlètes KinkoLab afin de financer sa préparation et sa participation à la campagne ${campaignName}.`,

    profitNote: `100 % des profits des ventes associées à ${athleteName} sont remis à ${athleteName}.`,

    supportSteps: [
      "Acheter un produit supporter",
      "Faire un don ou une commandite",
      "Partager la page",
      "Laisser un message d’encouragement",
    ],

    needs: [
      { label: "Déplacement / transport", amount: 0 },
      { label: "Hébergement", amount: 0 },
      { label: "Inscription compétition", amount: 0 },
      { label: "Équipement", amount: 0 },
    ],

    steps: [
      {
        label: "Candidature acceptée",
        status: "completed",
        note: "Le profil athlète est créé dans le portail KinkoLab.",
        date: new Date().toISOString().slice(0, 10),
        amount: null,
      },
      {
        label: "Campagne ouverte",
        status: "in_progress",
        note: "La page publique peut maintenant être partagée.",
        date: "",
        amount: null,
      },
      {
        label: "Produits supporters",
        status: "pending",
        note: "La liaison Shopify sera ajoutée à l’étape suivante.",
        date: "",
        amount: null,
      },
      {
        label: "Préparation compétition",
        status: "pending",
        note: "Les étapes de préparation seront mises à jour par l’athlète.",
        date: "",
        amount: null,
      },
    ],

    sponsors: [],
    fundingEvents: [],

    sourceApplicationId: application.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export default function AdminView({
  athletes,
  campaigns,
  wallMessages,
  setWallMessages,
  goBack,
  onOpenAthlete,
}) {
  const pendingMessages = wallMessages.filter((message) => message.status === "en_attente");
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");

  useEffect(() => {
    const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setApplications(data);
        setApplicationsLoading(false);
      },
      (error) => {
        console.error("Erreur lecture applications:", error);
        setApplicationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const pendingApplications = applications.filter(
    (application) => (application.status || "en_attente") === "en_attente"
  );

  async function acceptApplication(application) {
    setActionLoadingId(application.id);

    try {
      const athlete = buildAthleteFromApplication(application, campaigns);

      await setDoc(doc(db, "athletes", athlete.id), athlete);

      await updateDoc(doc(db, "applications", application.id), {
        status: "accepté",
        acceptedAt: serverTimestamp(),
        athleteId: athlete.id,
        updatedAt: serverTimestamp(),
      });

      onOpenAthlete(athlete.id);
    } catch (error) {
      console.error("Erreur acceptation candidature:", error);
      alert("Erreur lors de l’acceptation de la candidature.");
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
    } catch (error) {
      console.error("Erreur refus candidature:", error);
      alert("Erreur lors du refus de la candidature.");
    } finally {
      setActionLoadingId("");
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
        <button
          onClick={goBack}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={17} /> Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Admin privé
          </p>
          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            Gestion Programme Athlètes
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Validation des candidatures, messages, suivi des athlètes et campagnes.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard light icon={Users} label="Athlètes" value={athletes.length} sub="Profils actifs" />
          <StatCard light icon={Megaphone} label="Campagnes" value={campaigns.length} sub="Campagnes ouvertes" />
          <StatCard light icon={MessageCircle} label="Messages à valider" value={pendingMessages.length} sub="Mur d’encouragement" />
          <StatCard light icon={DollarSign} label="Demandes en attente" value={pendingApplications.length} sub="Firestore" />
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <PencilLine style={{ color: gold }} />
            <h2 className="text-2xl font-black text-zinc-950">Demandes en attente</h2>
          </div>

          <div className="mt-5 space-y-3">
            {applicationsLoading && <p className="text-zinc-500">Chargement des demandes...</p>}

            {!applicationsLoading && pendingApplications.length === 0 && (
              <p className="text-zinc-500">Aucune demande en attente.</p>
            )}

            {pendingApplications.map((application) => {
              const athleteName =
                application.athleteName ||
                `${application.firstName || ""} ${application.lastName || ""}`.trim();

              return (
                <div key={application.id} className="rounded-2xl border border-zinc-200 p-5">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase text-zinc-500">
                        {application.type === "famille" ? "Demande famille / parent" : "Inscription individuelle"}
                      </p>

                      <h3 className="mt-1 text-xl font-black text-zinc-950">
                        {athleteName || "Nom à confirmer"}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-600">
                        {application.city || "Ville à confirmer"}, {application.province || "Province à confirmer"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Dojo : <b>{application.dojo || "À confirmer"}</b>
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Campagne : <b>{application.campaignTitle || campaignTitle(campaigns, application.campaignId)}</b>
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Objectif demandé : <b>{money(Number(application.desiredGoal || 0))}</b>
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        Contact : {application.email || "courriel absent"} {application.phone ? `· ${application.phone}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => acceptApplication(application)}
                        disabled={actionLoadingId === application.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                      >
                        <CheckCircle2 size={17} />
                        {actionLoadingId === application.id ? "Traitement..." : "Accepter"}
                      </button>

                      <button
                        onClick={() => refuseApplication(application)}
                        disabled={actionLoadingId === application.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
                      >
                        <XCircle size={17} />
                        Refuser
                      </button>
                    </div>
                  </div>

                  {application.motivation && (
                    <div className="mt-4 rounded-2xl bg-zinc-100 p-4">
                      <p className="text-xs font-bold uppercase text-zinc-500">Motivation</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-700">{application.motivation}</p>
                    </div>
                  )}

                  {application.campaignReason && (
                    <div className="mt-3 rounded-2xl bg-zinc-100 p-4">
                      <p className="text-xs font-bold uppercase text-zinc-500">Pourquoi cette campagne ?</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-700">{application.campaignReason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <PencilLine style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Athlètes</h2>
            </div>

            <div className="mt-5 space-y-3">
              {athletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => onOpenAthlete(athlete.id)}
                  className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 p-4 text-left hover:bg-zinc-200"
                >
                  <span>
                    <b>{athlete.avatar} {athlete.name}</b>
                    <br />
                    <small className="text-zinc-500">
                      {athlete.dojo} · {campaignTitle(campaigns, athlete.campaignId)}
                    </small>
                  </span>
                  <span className="text-sm font-black">{progressOf(athlete)}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Camera style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Messages en attente</h2>
            </div>

            <div className="mt-5 space-y-3">
              {pendingMessages.length === 0 && (
                <p className="text-zinc-500">Aucun message à valider.</p>
              )}

              {pendingMessages.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="font-black text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => approveMessage(item.id)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => refuseMessage(item.id)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
