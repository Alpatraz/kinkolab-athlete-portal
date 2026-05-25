import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Save, UserRound } from "lucide-react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { campaignTitle, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

export default function AthleteDashboard({ currentUser, campaigns = [], goHome, onOpenAthlete }) {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) || athletes[0] || null;
  }, [athletes, selectedAthleteId]);

  const [form, setForm] = useState({
    bio: "",
    goal: "",
    photoUrl: "",
    athleteSocials: "",
    shopifyUrl: "",
    sponsorUrl: "",
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    const field = currentUser.familyId ? "familyId" : "userId";
    const value = currentUser.familyId || currentUser.uid;

    const q = query(collection(db, "athletes"), where(field, "==", value));

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
  }, [currentUser, selectedAthleteId]);

  useEffect(() => {
    if (!selectedAthlete) return;

    setForm({
      bio: selectedAthlete.bio || "",
      goal: selectedAthlete.goal || "",
      photoUrl: selectedAthlete.photoUrl || "",
      athleteSocials: selectedAthlete.athleteSocials || "",
      shopifyUrl: selectedAthlete.shopifyUrl || "",
      sponsorUrl: selectedAthlete.sponsorUrl || "",
    });
  }, [selectedAthlete]);

  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveAthlete() {
    if (!selectedAthlete?.id) return;

    setSaving(true);
    setSaved(false);

    try {
      await updateDoc(doc(db, "athletes", selectedAthlete.id), {
        bio: form.bio,
        goal: Number(form.goal || 0),
        photoUrl: form.photoUrl,
        athleteSocials: form.athleteSocials,
        shopifyUrl: form.shopifyUrl,
        sponsorUrl: form.sponsorUrl,
        updatedAt: serverTimestamp(),
      });

      setSaved(true);
    } catch (error) {
      console.error("Erreur sauvegarde athlète:", error);
      alert("Impossible de sauvegarder les modifications.");
    } finally {
      setSaving(false);
    }
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-4xl rounded-3xl bg-zinc-950 p-8">
          <h1 className="text-3xl font-black">Connexion requise</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={goHome}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"
        >
          <ArrowLeft size={17} />
          Retour à l’accueil
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Espace privé
          </p>

          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">
            Tableau de bord athlète
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Gérez votre profil public, vos informations de campagne et vos liens de soutien.
          </p>
        </section>

        {athletes.length === 0 && (
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-black text-zinc-950">Aucun profil rattaché</h2>
            <p className="mt-2 text-zinc-600">
              Aucun profil athlète n’est encore associé à ce compte.
            </p>
          </section>
        )}

        {athletes.length > 0 && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-3">
              {athletes.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  className={`rounded-[2rem] border p-5 text-left shadow-xl ${
                    selectedAthlete?.id === athlete.id
                      ? "border-black bg-black text-white"
                      : "border-zinc-200 bg-white text-zinc-950"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-black"
                      style={{ background: gold }}
                    >
                      <UserRound size={26} />
                    </div>

                    <div>
                      <h3 className="text-xl font-black">{athlete.name}</h3>
                      <p className="text-sm opacity-70">{athlete.dojo}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ProgressBar value={progressOf(athlete)} />
                    <p className="mt-2 text-sm opacity-70">
                      {money(totalRaised(athlete))} / {money(athlete.goal || 0)}
                    </p>
                  </div>
                </button>
              ))}
            </section>

            {selectedAthlete && (
              <section className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">
                    Résumé du profil
                  </h2>

                  <div className="mt-5 overflow-hidden rounded-2xl bg-zinc-100">
                    {selectedAthlete.photoUrl ? (
                      <img
                        src={selectedAthlete.photoUrl}
                        alt={selectedAthlete.name}
                        className="h-72 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-72 w-full items-center justify-center text-7xl">
                        {selectedAthlete.avatar || "🥋"}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-zinc-700">
                    <p>
                      <b>Nom :</b> {selectedAthlete.name}
                    </p>
                    <p>
                      <b>Dojo :</b> {selectedAthlete.dojo}
                    </p>
                    <p>
                      <b>Campagne :</b>{" "}
                      {campaignTitle(campaigns, selectedAthlete.campaignId)}
                    </p>
                    <p>
                      <b>Statut :</b> {selectedAthlete.status || "actif"}
                    </p>
                    <p>
                      <b>Objectif :</b> {money(selectedAthlete.goal || 0)}
                    </p>
                    <p>
                      <b>Fonds suivis :</b> {money(totalRaised(selectedAthlete))}
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenAthlete(selectedAthlete.id)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white"
                  >
                    <Eye size={18} />
                    Voir ma page publique
                  </button>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                  <h2 className="text-2xl font-black text-zinc-950">
                    Modifier ma page
                  </h2>

                  <div className="mt-5 grid gap-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Photo / image principale
                      </span>
                      <input
                        value={form.photoUrl}
                        onChange={(event) => update("photoUrl", event.target.value)}
                        placeholder="URL de la photo"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Biographie / histoire
                      </span>
                      <textarea
                        value={form.bio}
                        onChange={(event) => update("bio", event.target.value)}
                        className="min-h-36 w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Objectif financier
                      </span>
                      <input
                        type="number"
                        value={form.goal}
                        onChange={(event) => update("goal", event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Réseaux sociaux
                      </span>
                      <input
                        value={form.athleteSocials}
                        onChange={(event) => update("athleteSocials", event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Lien boutique Shopify
                      </span>
                      <input
                        value={form.shopifyUrl}
                        onChange={(event) => update("shopifyUrl", event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-black text-zinc-700">
                        Lien commandite / don
                      </span>
                      <input
                        value={form.sponsorUrl}
                        onChange={(event) => update("sponsorUrl", event.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />
                    </label>

                    {saved && (
                      <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                        Modifications sauvegardées.
                      </div>
                    )}

                    <button
                      onClick={saveAthlete}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60"
                    >
                      <Save size={18} />
                      {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>
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
