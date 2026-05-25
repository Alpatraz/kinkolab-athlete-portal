import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  Megaphone,
  MessageCircle,
  PencilLine,
  Users,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Archive,
  Shield,
  UserPlus2,
  Save,
  Trash2,
} from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp,
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

export default function AdminView({
  athletes = [],
  campaigns = [],
  wallMessages = [],
  setWallMessages,
  goBack,
  onOpenAthlete,
}) {
  const [families, setFamilies] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [familyEmail, setFamilyEmail] = useState("");
  const [familyContact, setFamilyContact] = useState("");

  const pendingMessages = (wallMessages || []).filter(
    (message) => message.status === "en_attente"
  );

  async function loadFamilies() {
    try {
      const snap = await getDocs(collection(db, "families"));

      const data = snap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setFamilies(data);
    } catch (error) {
      console.error("Erreur chargement familles :", error);
    }
  }

  useEffect(() => {
    loadFamilies();
  }, []);

  async function createFamily() {
    if (!familyName || !familyEmail) {
      alert("Nom de famille et courriel obligatoires.");
      return;
    }

    try {
      await addDoc(collection(db, "families"), {
        name: familyName,
        contactEmail: familyEmail,
        contactName: familyContact,
        athleteIds: [],
        createdAt: serverTimestamp(),
      });

      setFamilyName("");
      setFamilyEmail("");
      setFamilyContact("");

      loadFamilies();

      alert("Famille créée.");
    } catch (error) {
      console.error(error);
      alert("Erreur création famille.");
    }
  }

  async function addAthleteToFamily(athleteId, family) {
    try {
      const athleteRef = doc(db, "athletes", athleteId);

      const updatedIds = [...(family.athleteIds || []), athleteId];

      await updateDoc(athleteRef, {
        familyId: family.id,
        familyName: family.name,
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: updatedIds,
      });

      loadFamilies();

      alert("Athlète ajouté à la famille.");
    } catch (error) {
      console.error(error);
      alert("Erreur ajout famille.");
    }
  }

  async function removeAthleteFromFamily(athleteId, family) {
    try {
      const athleteRef = doc(db, "athletes", athleteId);

      const updatedIds = (family.athleteIds || []).filter(
        (id) => id !== athleteId
      );

      await updateDoc(athleteRef, {
        familyId: null,
        familyName: null,
      });

      await updateDoc(doc(db, "families", family.id), {
        athleteIds: updatedIds,
      });

      loadFamilies();

      alert("Athlète retiré.");
    } catch (error) {
      console.error(error);
      alert("Erreur suppression famille.");
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

  const athletesWithoutFamily = useMemo(() => {
    return (athletes || []).filter((athlete) => !athlete.familyId);
  }, [athletes]);

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
            Gestion des candidatures, familles, campagnes et profils athlètes.
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
            label="Fonds suivis"
            value={money(
              athletes.reduce(
                (sum, athlete) => sum + totalRaised(athlete),
                0
              )
            )}
            sub="Total plateforme"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Shield style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">
                Familles
              </h2>
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-100 p-4">
              <h3 className="text-lg font-black">Créer une famille</h3>

              <div className="mt-4 grid gap-3">
                <input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Nom de famille"
                  className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />

                <input
                  value={familyContact}
                  onChange={(e) => setFamilyContact(e.target.value)}
                  placeholder="Parent responsable"
                  className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />

                <input
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  placeholder="Courriel principal"
                  className="rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
                />

                <button
                  onClick={createFamily}
                  className="rounded-xl bg-black px-4 py-3 font-black text-white"
                >
                  Créer la famille
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {families.map((family) => {
                const familyAthletes = (athletes || []).filter(
                  (athlete) => athlete.familyId === family.id
                );

                return (
                  <div
                    key={family.id}
                    className="rounded-2xl border border-zinc-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black">
                          {family.name}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {family.contactName || "Aucun responsable"}
                        </p>

                        <p className="text-sm text-zinc-500">
                          {family.contactEmail}
                        </p>
                      </div>

                      <div
                        className="rounded-xl px-3 py-2 text-sm font-black text-black"
                        style={{ background: gold }}
                      >
                        {familyAthletes.length} athlète(s)
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {familyAthletes.length === 0 && (
                        <p className="text-sm text-zinc-400">
                          Aucun athlète dans cette famille.
                        </p>
                      )}

                      {familyAthletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3"
                        >
                          <div>
                            <p className="font-black">
                              {athlete.avatar} {athlete.name}
                            </p>

                            <p className="text-sm text-zinc-500">
                              {athlete.dojo}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              removeAthleteFromFamily(
                                athlete.id,
                                family
                              )
                            }
                            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-black text-white"
                          >
                            Retirer
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-sm font-black text-zinc-700">
                        Ajouter un athlète
                      </label>

                      <div className="space-y-2">
                        {athletesWithoutFamily.map((athlete) => (
                          <button
                            key={athlete.id}
                            onClick={() =>
                              addAthleteToFamily(
                                athlete.id,
                                family
                              )
                            }
                            className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 hover:bg-zinc-100"
                          >
                            <span>
                              {athlete.avatar} {athlete.name}
                            </span>

                            <UserPlus2 size={18} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Camera style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">
                Messages en attente
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {pendingMessages.length === 0 && (
                <p className="text-zinc-500">
                  Aucun message à valider.
                </p>
              )}

              {pendingMessages.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 p-4"
                >
                  <p className="font-black text-zinc-950">
                    {item.name}
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {item.message}
                  </p>

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
