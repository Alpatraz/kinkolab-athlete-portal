import { useState } from "react";
import { ArrowLeft, CheckCircle2, HeartHandshake, ShieldCheck, Users } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { campaignTitle, cn, gold } from "../utils/format";
import { campaignsSeed } from "../data/demoData";
import { db } from "../firebase";

function FormInput({ label, value, onChange, type = "text", required = true }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      />
    </label>
  );
}

function FormTextarea({ label, value, onChange, required = true }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, options, required = true }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950"
      >
        {options.map((option) => {
          const valueToUse = typeof option === "string" ? option : option.value;
          const labelToUse = typeof option === "string" ? option : option.label;
          return <option key={valueToUse} value={valueToUse}>{labelToUse}</option>;
        })}
      </select>
    </label>
  );
}

export default function SignupView({ goBack }) {
  const [type, setType] = useState("individuel");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    familyName: "",
  });

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const selectedCampaignTitle = campaignTitle(campaignsSeed, form.campaignId);

  async function submitApplication(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, "applications"), {
        type,
        status: "en_attente",
        ...form,
        athleteName: `${form.firstName} ${form.lastName}`.trim(),
        campaignTitle: selectedCampaignTitle,
        desiredGoal: Number(form.desiredGoal || 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’envoi de la demande.");
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
          <p className="mt-3 text-zinc-600">La demande apparaîtra maintenant dans l’admin global.</p>
          <button onClick={goBack} className="mt-6 rounded-2xl bg-black px-6 py-4 font-black text-white">
            Retour
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

        <form onSubmit={submitApplication} className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="bg-black p-6 text-white md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>Formulaire d’inscription</p>
            <h1 className="mt-2 text-4xl font-black">Demander une page athlète</h1>
            <p className="mt-3 max-w-3xl text-zinc-300">Tous les champs sont obligatoires pour créer une page complète et crédible.</p>
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
              <FormInput label="Lien photo obligatoire" type="url" value={form.photo} onChange={(value) => update("photo", value)} />
              <FormInput label="Courriel de l’athlète" type="email" value={form.email} onChange={(value) => update("email", value)} />
              <FormInput label="Téléphone de l’athlète" value={form.phone} onChange={(value) => update("phone", value)} />
              <FormInput label="Nom du parent / responsable" value={form.parentName} onChange={(value) => update("parentName", value)} />
              <FormInput label="Courriel du parent" type="email" value={form.parentEmail} onChange={(value) => update("parentEmail", value)} />
              <FormInput label="Téléphone du parent" value={form.parentPhone} onChange={(value) => update("parentPhone", value)} />
              <FormInput label="Ville" value={form.city} onChange={(value) => update("city", value)} />
              <FormInput label="Dojo" value={form.dojo} onChange={(value) => update("dojo", value)} />
              <FormInput label="Coach" value={form.coach} onChange={(value) => update("coach", value)} />
              <FormSelect label="Province" value={form.province} onChange={(value) => update("province", value)} options={["Québec", "Ontario", "Nouveau-Brunswick", "Autre"]} />
              <FormSelect label="Discipline" value={form.discipline} onChange={(value) => update("discipline", value)} options={["Karaté combat", "Point fighting", "Kata", "Kobudo", "Autre"]} />
              <FormInput label="Ceinture" value={form.belt} onChange={(value) => update("belt", value)} />
              <FormSelect label="Campagne souhaitée" value={form.campaignId} onChange={(value) => update("campaignId", value)} options={campaignsSeed.map((campaign) => ({ value: campaign.id, label: campaign.title }))} />
              <FormInput label="Objectif financier souhaité" type="number" value={form.desiredGoal} onChange={(value) => update("desiredGoal", value)} />
              <FormInput label="Liens réseaux sociaux" value={form.athleteSocials} onChange={(value) => update("athleteSocials", value)} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormTextarea label="Pourquoi cette campagne ?" value={form.campaignReason} onChange={(value) => update("campaignReason", value)} />
              <FormTextarea label="Motivation / histoire de l’athlète" value={form.motivation} onChange={(value) => update("motivation", value)} />
            </div>

            <FormInput label="Nom de famille / groupe familial" value={form.familyName} onChange={(value) => update("familyName", value)} />

            <div className="mt-8 rounded-3xl bg-zinc-100 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1" style={{ color: gold }} />
                <p className="text-sm leading-6 text-zinc-600">
                  Après soumission, la demande sera validée par l’admin avant publication.
                </p>
              </div>
            </div>

            <button disabled={submitting} type="submit" className="mt-8 w-full rounded-2xl bg-black px-6 py-4 font-black text-white hover:bg-zinc-800 disabled:opacity-60">
              {submitting ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
