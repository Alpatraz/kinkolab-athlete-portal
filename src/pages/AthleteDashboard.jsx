import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  ImageIcon,
  Megaphone,
  Plus,
  Save,
  Target,
  UserRound,
  Users,
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

function sumRaised(participation) {
  return (
    Number(participation?.raisedShop || 0) +
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
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

function StatBox({ label, value, sub }) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
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
    } catch (error) {
      alert("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  }

  async function publishUpdate() {
    if (!selectedAthlete?.id) return;
    if (!newUpdate.title.trim()) return;

    try {
      await addDoc(collection(db, "athleteUpdates"), {
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,

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
    if (!newEvent.title.trim()) return;

    try {
      await addDoc(collection(db, "fundraisingEvents"), {
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,

        title: newEvent.title,
        date: newEvent.date,
        description: newEvent.description,
        goal: Number(newEvent.goal || 0),

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

  const familyGoal = familyFundingGroups.reduce(
    (sum, group) => sum + group.goal,
    0
  );

  const familyRaised = familyFundingGroups.reduce(
    (sum, group) => sum + group.raised,
    0
  );

  const familyRemaining = Math.max(
    familyGoal - familyRaised,
    0
  );

  const familyPercent =
    familyGoal > 0
      ? Math.min(
          Math.round((familyRaised / familyGoal) * 100),
          100
        )
      : 0;

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
            Gérez vos profils, vos campagnes, vos nouvelles et vos événements.
          </p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatBox
            label="Athlètes"
            value={athletes.length}
            sub="Membres actifs"
          />

          <StatBox
            label="Campagnes"
            value={familyFundingGroups.length}
            sub="Participations"
          />

          <StatBox
            label="Objectif"
            value={money(familyGoal)}
            sub="Total famille"
          />

          <StatBox
            label="Récolté"
            value={money(familyRaised)}
            sub={`${familyPercent}% atteint`}
          />
        </section>

        <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-black text-zinc-950">
            Progression familiale
          </h2>

          <div className="mt-5">
            <ProgressBar value={familyPercent} />
          </div>

          <p className="mt-3 text-sm text-zinc-500">
            {money(familyRaised)} récoltés sur {money(familyGoal)}
          </p>
        </section>

        <section className="mt-8 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
          >
            Résumé
          </TabButton>

          <TabButton
            active={activeTab === "athletes"}
            onClick={() => setActiveTab("athletes")}
          >
            Athlètes
          </TabButton>

          <TabButton
            active={activeTab === "campaigns"}
            onClick={() => setActiveTab("campaigns")}
          >
            Campagnes
          </TabButton>

          <TabButton
            active={activeTab === "updates"}
            onClick={() => setActiveTab("updates")}
          >
            Nouvelles
          </TabButton>

          <TabButton
            active={activeTab === "events"}
            onClick={() => setActiveTab("events")}
          >
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
                        <img
                          src={athlete.photoUrl}
                          alt={athlete.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        athlete.avatar || "🥋"
                      )}
                    </div>

                    <div>
                      <p className="font-black text-zinc-950">
                        {athlete.name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {athlete.discipline || "Discipline à confirmer"} ·{" "}
                        {athlete.dojo || "Dojo à confirmer"}
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

              <div className="mt-5 space-y-3">
                {familyFundingGroups.length === 0 && (
                  <p className="text-zinc-500">
                    Aucune campagne active pour cette famille.
                  </p>
                )}

                {familyFundingGroups.map((group) => {
                  const percent =
                    group.goal > 0
                      ? Math.min(
                          Math.round((group.raised / group.goal) * 100),
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={group.fundingGroupId}
                      className="rounded-2xl border border-zinc-200 p-5"
                    >
                      <p
                        className="text-xs font-black uppercase tracking-[0.2em]"
                        style={{ color: gold }}
                      >
                        {group.fundingMode === "family"
                          ? "Fonds commun familial"
                          : "Financement individuel"}
                      </p>

                      <h3 className="mt-2 text-xl font-black text-zinc-950">
                        {group.campaignTitle}
                      </h3>

                      <p className="mt-1 text-sm text-zinc-500">
                        Participants :{" "}
                        {group.participations
                          .map((participation) => participation.athleteName)
                          .join(", ")}
                      </p>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl bg-zinc-100 p-4">
                          <p className="text-xs uppercase text-zinc-500">
                            Objectif
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {money(group.goal)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-zinc-100 p-4">
                          <p className="text-xs uppercase text-zinc-500">
                            Récolté
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {money(group.raised)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-zinc-100 p-4">
                          <p className="text-xs uppercase text-zinc-500">
                            Progression
                          </p>
                          <p className="mt-1 text-xl font-black">
                            {percent} %
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <ProgressBar value={percent} />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <button
                    key={athlete.id}
                    onClick={() => setSelectedAthleteId(athlete.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left ${
                      selectedAthlete?.id === athlete.id
                        ? "bg-black text-white"
                        : "bg-zinc-100 text-zinc-950"
                    }`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-zinc-200 text-2xl">
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

                    <div>
                      <p className="font-black">{athlete.name}</p>
                      <p className="text-sm opacity-70">
                        {athlete.discipline || "Discipline à confirmer"}
                      </p>
                    </div>
                  </button>
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

              {!selectedAthlete && (
                <p className="mt-5 text-zinc-500">
                  Sélectionnez un athlète.
                </p>
              )}

              {selectedAthlete && (
                <div className="mt-5 grid gap-4">
                  <input
                    value={form.photoUrl}
                    onChange={(event) =>
                      setForm({ ...form, photoUrl: event.target.value })
                    }
                    placeholder="URL de la photo"
                    className="rounded-2xl border border-zinc-200 p-3"
                  />

                  <textarea
                    value={form.bio}
                    onChange={(event) =>
                      setForm({ ...form, bio: event.target.value })
                    }
                    placeholder="Biographie / histoire de l’athlète"
                    className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                  />

                  <input
                    value={form.dojo}
                    onChange={(event) =>
                      setForm({ ...form, dojo: event.target.value })
                    }
                    placeholder="Dojo"
                    className="rounded-2xl border border-zinc-200 p-3"
                  />

                  <input
                    value={form.discipline}
                    onChange={(event) =>
                      setForm({ ...form, discipline: event.target.value })
                    }
                    placeholder="Discipline"
                    className="rounded-2xl border border-zinc-200 p-3"
                  />

                  <input
                    value={form.belt}
                    onChange={(event) =>
                      setForm({ ...form, belt: event.target.value })
                    }
                    placeholder="Ceinture / niveau"
                    className="rounded-2xl border border-zinc-200 p-3"
                  />

                  <input
                    value={form.athleteSocials}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        athleteSocials: event.target.value,
                      })
                    }
                    placeholder="Réseaux sociaux"
                    className="rounded-2xl border border-zinc-200 p-3"
                  />

                  <button
                    onClick={saveAthleteProfile}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-black px-5 py-4 font-black text-white disabled:opacity-60"
                  >
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
          <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Target style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">
                Campagnes et participations
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {familyParticipations.length === 0 && (
                <p className="text-zinc-500">
                  Aucune participation active.
                </p>
              )}

              {familyParticipations.map((participation) => (
                <div
                  key={participation.id}
                  className="rounded-2xl border border-zinc-200 p-5"
                >
                  <p
                    className="text-xs font-black uppercase tracking-[0.2em]"
                    style={{ color: gold }}
                  >
                    {participation.fundingMode === "family"
                      ? "Fonds commun familial"
                      : "Financement individuel"}
                  </p>

                  <h3 className="mt-2 text-xl font-black text-zinc-950">
                    {campaignTitle(campaigns, participation.campaignId)}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    Athlète : {participation.athleteName}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Objectif : {money(participation.goal || 0)}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    Groupe : {participation.fundingGroupId}
                  </p>
                </div>
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
                <input
                  value={newUpdate.title}
                  onChange={(event) =>
                    setNewUpdate({
                      ...newUpdate,
                      title: event.target.value,
                    })
                  }
                  placeholder="Titre"
                  className="rounded-2xl border border-zinc-200 p-3"
                />

                <textarea
                  value={newUpdate.content}
                  onChange={(event) =>
                    setNewUpdate({
                      ...newUpdate,
                      content: event.target.value,
                    })
                  }
                  placeholder="Texte"
                  className="min-h-32 rounded-2xl border border-zinc-200 p-3"
                />

                <input
                  value={newUpdate.mediaUrl}
                  onChange={(event) =>
                    setNewUpdate({
                      ...newUpdate,
                      mediaUrl: event.target.value,
                    })
                  }
                  placeholder="URL image ou média"
                  className="rounded-2xl border border-zinc-200 p-3"
                />

                <button
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
                    <p className="font-black text-zinc-950">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {item.content}
                    </p>
                    <p className="mt-2 text-xs font-black uppercase text-zinc-400">
                      Statut : {item.status || "en_attente"}
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
                    setNewEvent({
                      ...newEvent,
                      description: event.target.value,
                    })
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
                    <p className="font-black text-zinc-950">{item.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs font-black uppercase text-zinc-400">
                      Statut : {item.status || "en_attente"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
