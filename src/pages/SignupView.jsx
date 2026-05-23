import { useState } from "react";
import { ArrowLeft, CheckCircle2, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { campaignTitle, cn, gold } from "../utils/format";
import { campaignsSeed } from "../data/demoData";
import { db } from "../firebase";

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      />
    </label>
  );
}

function FormTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      >
        {options.map((option) => {
          const valueToUse = typeof option === "string" ? option : option.value;
          const labelToUse = typeof option === "string" ? option : option.label;
          return (
            <option key={valueToUse} value={valueToUse}>
              {labelToUse}
            </option>
          );
        })}
      </select>
    </label>
  );
}

export default function SignupView({ goBack }) {
  const [type, setType] = useState("individuel");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    photo: "",
    email: "",
    phone: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    province: "Québec",
    city: "",
    dojo: "",
    coach: "",
    discipline: "Karaté combat",
    belt: "",
    campaignId: "world-2026",
    desiredGoal: "",
    campaignReason: "",
    motivation: "",
    athleteSocials: "",
    familyName: ""
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectedCampaignTitle = campaignTitle(campaignsSeed, form.campaignId);

  async function submitApplication() {
    setErrorMessage("");

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setErrorMessage("Merci de remplir au minimum le prénom, le nom et le courriel.");
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, "applications"), {
        type,
        status: "en_attente",

        firstName: form.firstName,
        lastName: form.lastName,
        athleteName: `${form.firstName} ${form.lastName}`.trim(),
        birthDate: form.birthDate,
        photo: form.photo,

        email: form.email,
        phone: form.phone,

        parentName: form.parentName,
        parentEmail: form.parentEmail,
        parentPhone: form.parentPhone,

        province: form.province,
        city: form.city,
        dojo: form.dojo,
        coach: form.coach,
        discipline: form.discipline,
        belt: form.belt,

        campaignId: form.campaignId,
        campaignTitle: selectedCampaignTitle,
        desiredGoal: Number(form.desiredGoal || 0),

        campaignReason: form.campaignReason,
        motivation: form.motivation,
        athleteSocials: form.athleteSocials,
        familyName: form.familyName,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Erreur Firestore:", error);
      setErrorMessage("Erreur lors de l’envoi de la demande. Vérifie la configuration Firebase.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-black" style={{ background: gold }}>
            <CheckCircle2 size={34} />
          </div>

          <h1 className="mt-5 text-4xl font-black text-zinc-950">Demande envoyée</h1>
          <p className="mt-3 text-zinc-600">La demande est maintenant enregistrée dans Firestore et apparaîtra dans l’admin global.</p>

          <div className="mt-6 grid gap-3 rounded-3xl bg-zinc-100 p-5 text-left text-sm text-zinc-700 md:grid-cols-2">
            <p><b>Athlète :</b> {form.firstName} {form.lastName}</p>
            <p><b>Campagne :</b> {selectedCampaignTitle}</p>
            <p><b>Discipline :</b> {form.discipline}</p>
            <p><b>Dojo :</b> {form.dojo || "À confirmer"}</p>
            <p><b>Objectif demandé :</b> {form.desiredGoal || "À confirmer"} $</p>
            <p><b>Ville / province :</b> {form.city || "À confirmer"}, {form.province}</p>
          </div>

          <button onClick={goBack} className="mt-6 rounded-2xl bg-black px-6 py-4 font-black text-white">
            Retour à l’accueil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950">
          <ArrowLeft size={17} /> Retour
        </button>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="bg-black p-6 text-white md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>
              Formulaire d’inscription
            </p>
            <h1 className="mt-2 text-4xl font-black">Demander une page athlète</h1>
            <p className="mt-3 max-w-3xl text-zinc-300">
              Ce formulaire collecte les informations nécessaires pour créer une page athlète claire, crédible et reliée à une campagne KinkoLab.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid gap-3 md:grid-cols-2">
              <button type="button" onClick={() => setType("individuel")} className={cn("rounded-3xl border p-5 text-left", type === "individuel" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950")}>
                <Users className="mb-3" style={{ color: gold }} />
                <b>Inscription individuelle</b>
                <p className="mt-1 text-sm opacity-70">Un athlète veut rejoindre une campagne existante.</p>
              </button>

              <button type="button" onClick={() => setType("famille")} className={cn("rounded-3xl border p-5 text-left", type === "famille" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950")}>
                <HeartHandshake className="mb-3" style={{ color: gold }} />
                <b>Demande famille / parent</b>
                <p className="mt-1 text-sm opacity-70">Un parent fait la demande pour un jeune athlète.</p>
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <FormInput label="Prénom de l’athlète" value={form.firstName} onChange={(value) => update("firstName", value)} />
              <FormInput label="Nom de l’athlète" value={form.lastName} onChange={(value) => update("lastName", value)} />
              <FormInput label="Date de naissance" type="date" value={form.birthDate} onChange={(value) => update("birthDate", value)} />
              <FormInput label="Courriel" type="email" value={form.email} onChange={(value) => update("email", value)} />
              <FormInput label="Téléphone" value={form.phone} onChange={(value) => update("phone", value)} />
              <FormInput label="Ville" value={form.city} onChange={(value) => update("city", value)} />
              <FormInput label="Dojo" value={form.dojo} onChange={(value) => update("dojo", value)} />
              <FormInput label="Coach" value={form.coach} onChange={(value) => update("coach", value)} />
              <FormSelect label="Province" value={form.province} onChange={(value) => update("province", value)} options={["Québec", "Ontario", "Nouveau-Brunswick", "Autre"]} />
              <FormSelect label="Discipline" value={form.discipline} onChange={(value) => update("discipline", value)} options={["Karaté combat", "Point fighting", "Kata", "Kobudo", "Autre"]} />
              <FormInput label="Ceinture" value={form.belt} onChange={(value) => update("belt", value)} />
              <FormSelect label="Campagne souhaitée" value={form.campaignId} onChange={(value) => update("campaignId", value)} options={campaignsSeed.map((campaign) => ({ value: campaign.id, label: campaign.title }))} />
              <FormInput label="Objectif financier souhaité" type="number" value={form.desiredGoal} onChange={(value) => update("desiredGoal", value)} />
              <FormInput label="Lien photo / média" value={form.photo} onChange={(value) => update("photo", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormTextarea label="Pourquoi cette campagne ?" value={form.campaignReason} onChange={(value) => update("campaignReason", value)} />
              <FormTextarea label="Motivation / histoire de l’athlète" value={form.motivation} onChange={(value) => update("motivation", value)} />
            </div>

            <div className="mt-8 rounded-3xl bg-zinc-100 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1" style={{ color: gold }} />
                <div>
                  <h3 className="font-black text-zinc-950">Validation avant publication</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    La demande sera reçue dans l’admin global. Après validation, le profil public pourra être créé et relié à Shopify.
                  </p>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            <button
              onClick={submitApplication}
              disabled={submitting}
              className="mt-8 w-full rounded-2xl bg-black px-6 py-4 font-black text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting ? "Envoi en cours..." : "Envoyer la demande"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
