import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Image,
  Megaphone,
  Plus,
  Save,
  Target,
  UserRound,
} from "lucide-react";
import {
  addDoc,
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

export default function AthleteDashboard({
  currentUser,
  campaigns = [],
  participations = [],
  goHome,
  onOpenAthlete,
}) {
  const [athletes, setAthletes] = useState([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [updates, setUpdates] = useState([]);
  const [fundingEvents, setFundingEvents] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    photoUrl: "",
    dojo: "",
    discipline: "",
    belt: "",
    athleteSocials: "",
    shopifyUrl: "",
    sponsorUrl: "",
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

  const selectedAthlete = useMemo(() => {
    return athletes.find((athlete) => athlete.id === selectedAthleteId) || athletes[0] || null;
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
      shopifyUrl: selectedAthlete.shopifyUrl || "",
      sponsorUrl: selectedAthlete.sponsorUrl || "",
    });
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

  const athleteParticipations = useMemo(() => {
    if (!selectedAthlete?.id) return [];

    return (participations || []).filter(
      (participation) =>
        participation.athleteId === selectedAthlete.id &&
        participation.status !== "archivée" &&
        participation.status !== "suspendue"
    );
  }, [participations, selectedAthlete]);

  function updateForm(field, value) {
    setSaved(false);
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
        photoUrl: form.photoUrl,
        dojo: form.dojo,
        discipline: form.discipline,
        belt: form.belt,
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

  async function addUpdate() {
    if (!selectedAthlete?.id || !newUpdate.title.trim() || !newUpdate.content.trim()) {
      alert("Titre et contenu obligatoires.");
      return;
    }

    await addDoc(collection(db, "athleteUpdates"), {
      athleteId: selectedAthlete.id,
      athleteName: selectedAthlete.name,
      title: newUpdate.title,
      content: newUpdate.content,
      type: newUpdate.type,
      mediaUrl: newUpdate.mediaUrl,
      status: "en_attente",
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setNewUpdate({
      title: "",
      content: "",
      type: "Nouvelle",
      mediaUrl: "",
    });

    alert("Nouvelle envoyée pour validation.");
  }

  async function addFundingEvent() {
    if (!selectedAthlete?.id || !newEvent.title.trim()) {
      alert("Titre obligatoire.");
      return;
    }

    await addDoc(collection(db, "fundraisingEvents"), {
      athleteId: selectedAthlete.id,
      athleteName: selectedAthlete.name,
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description,
      goal: Number(newEvent.goal || 0),
      status: "en_attente",
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setNewEvent({
      title: "",
      date: "",
      description: "",
      goal: "",
    });

    alert("Événement envoyé pour validation.");
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
            Tableau de bord athlète / famille
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Gérez votre profil public, vos campagnes, vos nouvelles et vos événements de financement.
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
              <>
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
                      <p><b>Nom :</b> {selectedAthlete.name}</p>
                      <p><b>Famille :</b> {selectedAthlete.familyName || "Aucune"}</p>
                      <p><b>Dojo :</b> {selectedAthlete.dojo}</p>
                      <p><b>Statut :</b> {selectedAthlete.status || "actif"}</p>
                      <p><b>Objectif :</b> {money(selectedAthlete.goal || 0)}</p>
                      <p><b>Fonds suivis :</b> {money(totalRaised(selectedAthlete))}</p>
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
                      Modifier ma page publique
                    </h2>

                    <div className="mt-5 grid gap-4">
                      <input
                        value={form.photoUrl}
                        onChange={(event) => updateForm("photoUrl", event.target.value)}
                        placeholder="URL de la photo"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={form.bio}
                        onChange={(event) => updateForm("bio", event.target.value)}
                        placeholder="Biographie / histoire"
                        className="min-h-36 w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.dojo}
                        onChange={(event) => updateForm("dojo", event.target.value)}
                        placeholder="Dojo"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.discipline}
                        onChange={(event) => updateForm("discipline", event.target.value)}
                        placeholder="Discipline"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.belt}
                        onChange={(event) => updateForm("belt", event.target.value)}
                        placeholder="Ceinture / niveau"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.athleteSocials}
                        onChange={(event) => updateForm("athleteSocials", event.target.value)}
                        placeholder="Réseaux sociaux"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.shopifyUrl}
                        onChange={(event) => updateForm("shopifyUrl", event.target.value)}
                        placeholder="Lien boutique Shopify"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={form.sponsorUrl}
                        onChange={(event) => updateForm("sponsorUrl", event.target.value)}
                        placeholder="Lien commandite / don"
                        className="w-full rounded-2xl border border-zinc-200 p-3"
                      />

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

                <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
                  <div className="flex items-center gap-3">
                    <Target style={{ color: gold }} />
                    <h2 className="text-2xl font-black text-zinc-950">
                      Mes campagnes / participations
                    </h2>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {athleteParticipations.length === 0 && (
                      <p className="text-zinc-500">
                        Aucune participation active pour ce profil.
                      </p>
                    )}

                    {athleteParticipations.map((participation) => (
                      <div
                        key={participation.id}
                        className="rounded-2xl border border-zinc-200 p-5"
                      >
                        <p className="text-sm font-black uppercase" style={{ color: gold }}>
                          {participation.fundingMode === "family"
                            ? "Fonds commun famille"
                            : "Financement individuel"}
                        </p>

                        <h3 className="mt-2 text-xl font-black text-zinc-950">
                          {campaignTitle(campaigns, participation.campaignId)}
                        </h3>

                        <p className="mt-2 text-sm text-zinc-600">
                          Objectif : <b>{money(participation.goal || 0)}</b>
                        </p>

                        <p className="mt-1 text-sm text-zinc-600">
                          Groupe de financement : {participation.fundingGroupId}
                        </p>

                        <p className="mt-3 rounded-2xl bg-zinc-100 p-3 text-sm text-zinc-600">
                          Les objectifs officiels, le mode individuel/famille et le rattachement aux campagnes sont gérés par l’admin.
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                    <div className="flex items-center gap-3">
                      <Megaphone style={{ color: gold }} />
                      <h2 className="text-2xl font-black text-zinc-950">
                        Ajouter une nouvelle
                      </h2>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <input
                        value={newUpdate.title}
                        onChange={(event) =>
                          setNewUpdate({ ...newUpdate, title: event.target.value })
                        }
                        placeholder="Titre de la nouvelle"
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={newUpdate.content}
                        onChange={(event) =>
                          setNewUpdate({ ...newUpdate, content: event.target.value })
                        }
                        placeholder="Texte de la nouvelle"
                        className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        value={newUpdate.mediaUrl}
                        onChange={(event) =>
                          setNewUpdate({ ...newUpdate, mediaUrl: event.target.value })
                        }
                        placeholder="URL image ou média"
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <button
                        onClick={addUpdate}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white"
                      >
                        <Plus size={18} />
                        Envoyer pour validation
                      </button>
                    </div>

                    <div className="mt-6 space-y-3">
                      {updates.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-zinc-100 p-4">
                          <p className="font-black">{item.title}</p>
                          <p className="mt-1 text-sm text-zinc-600">{item.content}</p>
                          <p className="mt-2 text-xs font-bold uppercase text-zinc-400">
                            Statut : {item.status || "en_attente"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] bg-white p-6 shadow-xl">
                    <div className="flex items-center gap-3">
                      <CalendarDays style={{ color: gold }} />
                      <h2 className="text-2xl font-black text-zinc-950">
                        Ajouter un événement de financement
                      </h2>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <input
                        value={newEvent.title}
                        onChange={(event) =>
                          setNewEvent({ ...newEvent, title: event.target.value })
                        }
                        placeholder="Titre de l’événement"
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(event) =>
                          setNewEvent({ ...newEvent, date: event.target.value })
                        }
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <textarea
                        value={newEvent.description}
                        onChange={(event) =>
                          setNewEvent({ ...newEvent, description: event.target.value })
                        }
                        placeholder="Description"
                        className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                      />

                      <input
                        type="number"
                        value={newEvent.goal}
                        onChange={(event) =>
                          setNewEvent({ ...newEvent, goal: event.target.value })
                        }
                        placeholder="Objectif de l’événement"
                        className="rounded-2xl border border-zinc-200 p-3"
                      />

                      <button
                        onClick={addFundingEvent}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white"
                      >
                        <Plus size={18} />
                        Envoyer pour validation
                      </button>
                    </div>

                    <div className="mt-6 space-y-3">
                      {fundingEvents.map((event) => (
                        <div key={event.id} className="rounded-2xl bg-zinc-100 p-4">
                          <p className="font-black">{event.title}</p>
                          <p className="mt-1 text-sm text-zinc-600">{event.description}</p>
                          <p className="mt-2 text-xs font-bold uppercase text-zinc-400">
                            Statut : {event.status || "en_attente"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
