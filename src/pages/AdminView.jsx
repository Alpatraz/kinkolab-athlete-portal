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

import {
  campaignTitle,
  gold,
  money,
  progressOf,
  totalRaised,
} from "../utils/format";

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
      "financer sa préparation et sa participation",

    bio:
      application.motivation ||
      `${athleteName} rejoint le Programme Athlètes KinkoLab.`,

    profitNote:
      `100 % des profits des ventes associées à ${athleteName} sont remis à ${athleteName}.`,

    supportSteps: [
      "Acheter un produit supporter",
      "Faire un don",
      "Partager la page",
      "Encourager l’athlète",
    ],

    needs: [
      {
        label: "Transport",
        amount: 0,
      },
      {
        label: "Hébergement",
        amount: 0,
      },
      {
        label: "Inscription",
        amount: 0,
      },
      {
        label: "Équipement",
        amount: 0,
      },
    ],

    steps: [
      {
        label: "Candidature acceptée",
        status: "completed",
        note: "Le profil athlète a été créé.",
        date: new Date().toISOString().slice(0, 10),
      },
      {
        label: "Campagne ouverte",
        status: "in_progress",
        note: "Le profil public est maintenant accessible.",
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
  const pendingMessages = wallMessages.filter(
    (message) => message.status === "en_attente"
  );

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "applications"),
      orderBy("createdAt", "desc")
    );

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
        console.error(error);
        setApplicationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const pendingApplications = applications.filter(
    (application) =>
      (application.status || "en_attente") === "en_attente"
  );

  async function updateApplicationCampaign(applicationId, campaignId) {
    const campaign = campaigns.find(
      (item) => item.id === campaignId
    );

    try {
      await updateDoc(doc(db, "applications", applicationId), {
        campaignId,
        campaignTitle: campaign?.title || "",
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erreur modification campagne:", error);
      alert("Impossible de modifier la campagne.");
    }
  }

  async function acceptApplication(application) {
    setActionLoadingId(application.id);

    try {
      const athlete = buildAthleteFromApplication(
        application,
        campaigns
      );

      await setDoc(
        doc(db, "athletes", athlete.id),
        athlete
      );

      await updateDoc(
        doc(db, "applications", application.id),
        {
          status: "accepté",
          athleteId: athlete.id,
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      onOpenAthlete(athlete.id);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’acceptation.");
    } finally {
      setActionLoadingId("");
    }
  }

  async function refuseApplication(application) {
    setActionLoadingId(application.id);

    try {
      await updateDoc(
        doc(db, "applications", application.id),
        {
          status: "refusé",
          refusedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);
      alert("Erreur lors du refus.");
    } finally {
      setActionLoadingId("");
    }
  }

  function approveMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id
          ? { ...message, status: "approuvé" }
          : message
      )
    );
  }

  function refuseMessage(id) {
    setWallMessages(
      wallMessages.map((message) =>
        message.id === id
          ? { ...message, status: "refusé" }
          : message
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
          <ArrowLeft size={17} />
          Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: gold }}
          >
            Admin privé
          </p>

          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            Gestion Programme Athlètes
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Validation des candidatures, gestion des campagnes et création des profils athlètes.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard
            light
            icon={Users}
            label="Athlètes"
            value={athletes.length}
            sub="Profils actifs"
          />

          <StatCard
            light
            icon={Megaphone}
            label="Campagnes"
            value={campaigns.length}
            sub="Campagnes ouvertes"
          />

          <StatCard
            light
            icon={MessageCircle}
            label="Messages à valider"
            value={pendingMessages.length}
            sub="Mur d’encouragement"
          />

          <StatCard
            light
            icon={DollarSign}
            label="Demandes"
            value={pendingApplications.length}
            sub="En attente"
          />
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <PencilLine style={{ color: gold }} />

            <h2 className="text-2xl font-black text-zinc-950">
              Demandes en attente
            </h2>
          </div>

          <div className="mt-5 space-y-4">

            {applicationsLoading && (
              <p className="text-zinc-500">
                Chargement...
              </p>
            )}

            {!applicationsLoading &&
              pendingApplications.length === 0 && (
                <p className="text-zinc-500">
                  Aucune demande en attente.
                </p>
              )}

            {pendingApplications.map((application) => {
              const athleteName =
                application.athleteName ||
                `${application.firstName || ""} ${application.lastName || ""}`.trim();

              return (
                <div
                  key={application.id}
                  className="rounded-2xl border border-zinc-200 p-5"
                >
                  <div className="flex flex-col gap-5">

                    <div>
                      <h3 className="text-2xl font-black text-zinc-950">
                        {athleteName}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-600">
                        {application.city || "Ville inconnue"} ·{" "}
                        {application.province || "Province inconnue"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Dojo :{" "}
                        <b>{application.dojo || "À confirmer"}</b>
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Discipline :{" "}
                        <b>{application.discipline || "À confirmer"}</b>
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        Objectif :{" "}
                        <b>
                          {money(
                            Number(application.desiredGoal || 0)
                          )}
                        </b>
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-zinc-700">
                        Campagne associée
                      </label>

                      <select
                        value={application.campaignId || ""}
                        onChange={(event) =>
                          updateApplicationCampaign(
                            application.id,
                            event.target.value
                          )
                        }
                        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none"
                      >
                        {campaigns.map((campaign) => (
                          <option
                            key={campaign.id}
                            value={campaign.id}
                          >
                            {campaign.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {application.motivation && (
                      <div className="rounded-2xl bg-zinc-100 p-4">
                        <p className="text-xs font-bold uppercase text-zinc-500">
                          Motivation
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-700">
                          {application.motivation}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">

                      <button
                        onClick={() =>
                          acceptApplication(application)
                        }
                        disabled={
                          actionLoadingId === application.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-50"
                      >
                        <CheckCircle2 size={18} />
                        {actionLoadingId === application.id
                          ? "Traitement..."
                          : "Accepter"}
                      </button>

                      <button
                        onClick={() =>
                          refuseApplication(application)
                        }
                        disabled={
                          actionLoadingId === application.id
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
                      >
                        <XCircle size={18} />
                        Refuser
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
