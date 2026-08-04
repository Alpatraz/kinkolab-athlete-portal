import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  HeartHandshake,
  Medal,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { campaignTitle, cn, gold } from "../utils/format";
import { campaignsSeed } from "../data/demoData";
import { db } from "../firebase";
import { useLanguage } from "../context/LanguageContext";
import { DEFAULT_DISCIPLINES, PROGRAM_ROLES, normalizeDisciplines } from "../config/programOptions";
import RichTextEditor from "../components/RichTextEditor";

const DEFAULT_HERO_IMAGE_URL = "/images/kinkolab-athlete-application-hero.png";
const HOODIE_SUPPORT_AMOUNT = 20;

const PROVINCES = [
  "Alberta",
  "Colombie-Britannique",
  "Île-du-Prince-Édouard",
  "Manitoba",
  "Nouveau-Brunswick",
  "Nouvelle-Écosse",
  "Nunavut",
  "Ontario",
  "Québec",
  "Saskatchewan",
  "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest",
  "Yukon",
  "Autre",
];

function minorFromBirthDate(value) {
  if (!value) return false;
  const birthDate = new Date(`${value}T12:00:00`);
  if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return false;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return age < 18;
}

function SectionTitle({ children }) {
  return (
    <h2
      className="mb-8 text-2xl font-medium uppercase tracking-wide"
      style={{ color: gold }}
    >
      {children}
    </h2>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-black text-white">
        {label} {required && <span style={{ color: gold }}>*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-zinc-700 bg-zinc-900/80 px-4 py-4 text-white outline-none transition focus:border-yellow-600"
      />
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  required = true,
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-black text-white">
        {label} {required && <span style={{ color: gold }}>*</span>}
      </span>
      <RichTextEditor required={required} value={value} placeholder={placeholder} onChange={onChange} dark />
    </label>
  );
}

function FormSelect({ label, value, onChange, options, required = true }) {
  return (
    <label className="block">
      <span className="mb-3 block text-sm font-black text-white">
        {label} {required && <span style={{ color: gold }}>*</span>}
      </span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-zinc-700 bg-zinc-900/80 px-4 py-4 text-white outline-none transition focus:border-yellow-600"
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

function ConsentCheckbox({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-start gap-4 text-sm leading-6 text-zinc-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        className="mt-1 h-4 w-4 accent-yellow-600"
      />
      <span>{children}</span>
    </label>
  );
}

function HeroIcon({ icon: Icon, title, text }) {
  return (
    <div className="flex items-center gap-4 border-yellow-700/60 md:border-r md:px-6 md:last:border-r-0">
      <Icon size={42} strokeWidth={1.7} style={{ color: gold }} />
      <div>
        <p className="text-sm font-black uppercase text-white">{title}</p>
        <p className="text-sm leading-5 text-zinc-300">{text}</p>
      </div>
    </div>
  );
}

export default function SignupView({ goBack, openEligibility, campaigns = campaignsSeed }) {
  const { language } = useLanguage();
  const [type, setType] = useState("individuel");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageSettings, setPageSettings] = useState({
    heroImageUrl: DEFAULT_HERO_IMAGE_URL,
  });
  const [disciplines, setDisciplines] = useState(DEFAULT_DISCIPLINES);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    isParaAthlete: "non",
    paraClassification: "",
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
    athleteStatus: "Athlète",
    campaignId: "world-2026",
    desiredGoal: "",
    campaignReasonFr: "", campaignReasonEn: "",
    motivationFr: "", motivationEn: "",
    sportGoalsFr: "", sportGoalsEn: "",
    targetedCompetitionsFr: "", targetedCompetitionsEn: "",
    athleteSocials: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
    website: "",
    photo: "",
    videoUrl: "",
    familyName: "",
    publicDisplayName: "",
  });

  const [consents, setConsents] = useState({
    rules: false,
    noGuarantee: false,
    imageUse: false,
    legalParent: false,
    revocation: false,
    marketingCommunications: false,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "siteSettings", "applicationPage"),
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data();

        setPageSettings((current) => ({
          ...current,
          ...data,
          heroImageUrl: data.heroImageUrl || current.heroImageUrl,
        }));
      },
      (error) => {
        console.error("Erreur chargement paramètres applicationPage:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => onSnapshot(
    doc(db, "siteSettings", "programOptions"),
    (snapshot) => {
      const nextDisciplines = normalizeDisciplines(snapshot.data()?.disciplines);
      setDisciplines(nextDisciplines);
      setForm((current) => nextDisciplines.some((item) => item.labelFr === current.discipline)
        ? current
        : { ...current, discipline: nextDisciplines[0]?.labelFr || "" });
    },
    (error) => console.error("Erreur chargement disciplines:", error)
  ), []);

  useEffect(() => {
    const requestedCampaign = new URLSearchParams(window.location.search).get("campaign");
    if (requestedCampaign && campaigns.some((campaign) => campaign.id === requestedCampaign)) {
      setForm((current) => ({ ...current, campaignId: requestedCampaign }));
    } else if (campaigns.length && !campaigns.some((campaign) => campaign.id === form.campaignId)) {
      setForm((current) => ({ ...current, campaignId: campaigns[0].id }));
    }
  }, [campaigns]);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateConsent = (field, value) => {
    setConsents((current) => ({ ...current, [field]: value }));
  };

  const selectedCampaignTitle = campaignTitle(campaigns, form.campaignId);
  const heroImageUrl = pageSettings.heroImageUrl || DEFAULT_HERO_IMAGE_URL;
  const isMinor = minorFromBirthDate(form.birthDate);

  function handleOpenEligibility() {
    if (typeof openEligibility === "function") {
      openEligibility();
      return;
    }

    console.warn("openEligibility n'a pas été fourni à SignupView.");
  }

  async function submitApplication(event) {
    event.preventDefault();
    const selectedCampaign = campaigns.find((campaign) => campaign.id === form.campaignId);
    if (!selectedCampaign) {
      alert("Choisissez une campagne active avant d’envoyer votre candidature.");
      return;
    }
    if (!(form.motivationFr.trim() || form.motivationEn.trim()) || !(form.campaignReasonFr.trim() || form.campaignReasonEn.trim())) {
      alert("Présentez-vous et expliquez votre campagne dans au moins une langue.");
      return;
    }
    setSubmitting(true);

    try {
      const emailPreferenceToken = crypto.randomUUID();
      const applicationRef = await addDoc(collection(db, "applications"), {
        type,
        status: "en_attente",
        ...form,
        parentName: isMinor ? form.parentName : "",
        parentEmail: isMinor ? form.parentEmail : "",
        parentPhone: isMinor ? form.parentPhone : "",
        motivation: form.motivationFr || form.motivationEn,
        campaignReason: form.campaignReasonFr || form.campaignReasonEn,
        sportGoals: form.sportGoalsFr || form.sportGoalsEn,
        targetedCompetitions: form.targetedCompetitionsFr || form.targetedCompetitionsEn,
        consents: { ...consents, legalParent: isMinor ? consents.legalParent : false },
        communicationConsent: {
          operational: true,
          marketing: Boolean(consents.marketingCommunications),
          policyVersion: "2026-08-03",
          source: "athlete_application",
          emailPreferenceToken,
          recordedAt: new Date().toISOString(),
        },
        preferredLanguage: language,
        athleteName: `${form.firstName} ${form.lastName}`.trim(),
        campaignTitle: selectedCampaignTitle,
        desiredGoal: Number(form.desiredGoal || 0),
        hoodieSupportAmount: HOODIE_SUPPORT_AMOUNT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      fetch("/api/program-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "application_received", recordId: applicationRef.id }),
      }).catch((error) => console.error("Erreur courriel de confirmation:", error));

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Erreur Firestore:", error);
      alert("Erreur lors de l’envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-black p-4 text-white md:p-8">
        <div className="mx-auto max-w-4xl border border-yellow-700/50 bg-zinc-950 p-8 text-center shadow-xl">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-black"
            style={{ background: gold }}
          >
            <CheckCircle2 size={34} />
          </div>

          <h1 className="mt-6 text-5xl font-black uppercase text-white">
            Demande reçue
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-300">
            Votre candidature va être examinée par l’équipe KinkoLab. Vous
            recevrez une réponse par courriel après validation.
          </p>

          <p className="mx-auto mt-3 max-w-2xl leading-7 text-zinc-400">
            Si votre candidature est acceptée, vos identifiants de connexion vous
            seront transmis afin d’accéder à votre espace athlète privé.
          </p>

          <button
            onClick={goBack}
            className="mt-8 inline-flex items-center gap-2 px-7 py-4 font-black uppercase text-black"
            style={{ background: gold }}
          >
            Retour à l’accueil <ArrowRight size={18} />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        className="relative min-h-[560px] border-b border-yellow-700/60 bg-black"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 48%, rgba(0,0,0,0.15) 100%), url(${heroImageUrl})`,
          backgroundPosition: "center right",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[560px] max-w-7xl flex-col justify-center px-4 py-10 md:px-8">
          <button
            onClick={goBack}
            className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={17} />
            Retour
          </button>

          <p
            className="text-2xl font-black uppercase tracking-wide"
            style={{ color: gold }}
          >
            Programme Athlètes
          </p>

          <h1 className="mt-3 max-w-4xl text-5xl font-black uppercase leading-[0.95] md:text-8xl">
            Demande d’inscription
            <span className="block italic" style={{ color: gold }}>
              ouverte
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-8 text-zinc-100">
            Rejoignez une campagne de financement KinkoLab Supporters et
            représentez le Canada sur la scène internationale.
          </p>

          <div className="mt-9 grid max-w-5xl gap-5 md:grid-cols-4">
            <HeroIcon icon={ShieldCheck} title="Soutenir" text="votre parcours" />
            <HeroIcon icon={Users} title="Une communauté" text="de supporters engagés" />
            <HeroIcon icon={Medal} title="Atteindre" text="vos objectifs" />
            <HeroIcon icon={BarChart3} title="Financer" text="vos ambitions" />
          </div>

          <div className="mt-9 grid max-w-7xl gap-4 border border-yellow-700/70 bg-black/70 p-4 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div className="flex items-center gap-4">
              <CalendarDays size={44} style={{ color: gold }} />
              <p className="text-2xl font-black uppercase">
                Postulez dès maintenant
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Check size={44} style={{ color: gold }} />
              <p className="text-xl font-black uppercase">
                Évaluation des candidatures{" "}
                <span style={{ color: gold }}>selon les critères du programme</span>
              </p>
            </div>

            <a
              href="#formulaire"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 font-black uppercase text-black"
              style={{ background: gold }}
            >
              Soumettre ma candidature <ArrowRight size={22} />
            </a>
          </div>
        </div>
      </section>

      <section id="formulaire" className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="text-6xl font-black uppercase text-zinc-900 md:text-7xl">
              Demande
            </p>
            <h2
              className="-mt-4 text-4xl font-black uppercase italic md:text-5xl"
              style={{ color: gold }}
            >
              Programme Athlètes
            </h2>

            <p className="mt-6 max-w-4xl leading-8 text-zinc-200">
              Présentez votre candidature afin de rejoindre une campagne de
              financement KinkoLab Supporters. Les candidatures sont analysées
              selon les critères du programme, les ressources disponibles, les
              places disponibles et les objectifs du programme.
            </p>

            <div className="mt-8 border-l-4 border-yellow-600 bg-zinc-950 p-6 text-sm leading-7 text-zinc-300">
              <strong style={{ color: gold }}>Important :</strong> Le dépôt
              d’une demande ne garantit pas automatiquement l’acceptation au
              programme ni l’obtention d’un soutien financier. Les montants
              attribués peuvent varier selon les ventes réalisées, les critères
              d’évaluation et les modalités du programme.
            </div>

            <div className="mt-6 border border-yellow-700/40 bg-black p-5 text-sm leading-7 text-zinc-300">
              <p>
                Avant de soumettre votre demande, vous pouvez consulter les
                critères d’admissibilité et les conditions générales du programme.
              </p>

              <button
                type="button"
                onClick={handleOpenEligibility}
                className="mt-3 font-black uppercase tracking-[0.12em] hover:underline"
                style={{ color: gold }}
              >
                Consulter les critères d’admissibilité →
              </button>
            </div>
          </div>

          <form onSubmit={submitApplication} className="space-y-10">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setType("individuel")}
                className={cn(
                  "border p-6 text-left",
                  type === "individuel"
                    ? "border-yellow-700 bg-zinc-950 text-white"
                    : "border-zinc-800 bg-black text-zinc-300"
                )}
              >
                <Users className="mb-4" style={{ color: gold }} />
                <b className="text-lg">Inscription individuelle</b>
                <p className="mt-2 text-sm opacity-70">
                  Un athlète veut rejoindre une campagne existante.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType("famille")}
                className={cn(
                  "border p-6 text-left",
                  type === "famille"
                    ? "border-yellow-700 bg-zinc-950 text-white"
                    : "border-zinc-800 bg-black text-zinc-300"
                )}
              >
                <HeartHandshake className="mb-4" style={{ color: gold }} />
                <b className="text-lg">Demande famille / parent</b>
                <p className="mt-2 text-sm opacity-70">
                  Un parent fait la demande pour un jeune athlète.
                </p>
              </button>
            </div>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Informations athlète</SectionTitle>

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Prénom"
                  value={form.firstName}
                  onChange={(value) => update("firstName", value)}
                />
                <FormInput
                  label="Nom"
                  value={form.lastName}
                  onChange={(value) => update("lastName", value)}
                />
                <FormInput
                  label="Date de naissance"
                  type="date"
                  value={form.birthDate}
                  onChange={(value) => update("birthDate", value)}
                />
                <FormSelect label="Sexe / genre" value={form.gender} onChange={(value) => update("gender", value)} options={["Femme", "Homme", "Non binaire", "Préfère ne pas répondre"]} />
                <FormSelect label="Athlète handisport" value={form.isParaAthlete} onChange={(value) => update("isParaAthlete", value)} options={["non", "oui", "préfère ne pas répondre"]} />
                {form.isParaAthlete === "oui" && (
                  <FormInput label="Classification handisport (facultatif)" value={form.paraClassification} onChange={(value) => update("paraClassification", value)} />
                )}
                <FormInput
                  label="Courriel"
                  type="email"
                  value={form.email}
                  onChange={(value) => update("email", value)}
                />
                <FormInput
                  label="Téléphone"
                  value={form.phone}
                  onChange={(value) => update("phone", value)}
                />
                <FormInput
                  label="Ville"
                  value={form.city}
                  onChange={(value) => update("city", value)}
                />
                <FormSelect
                  label="Province"
                  value={form.province}
                  onChange={(value) => update("province", value)}
                  options={PROVINCES}
                />
                {isMinor && <>
                  <div className="md:col-span-2 border-l-4 border-yellow-600 bg-black p-4 text-sm text-zinc-300">Le participant est mineur. Les coordonnées de son parent ou tuteur légal sont obligatoires.</div>
                  <FormInput label="Nom du parent / responsable" value={form.parentName} onChange={(value) => update("parentName", value)} />
                  <FormInput label="Courriel du parent" type="email" value={form.parentEmail} onChange={(value) => update("parentEmail", value)} />
                  <FormInput label="Téléphone du parent" value={form.parentPhone} onChange={(value) => update("parentPhone", value)} />
                </>}
              </div>
            </section>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Informations sportives</SectionTitle>

              <div className="grid gap-5 md:grid-cols-2">
                <FormSelect
                  label="Discipline"
                  value={form.discipline}
                  onChange={(value) => update("discipline", value)}
                  options={disciplines.map((discipline) => ({ value: discipline.labelFr, label: language === "en" ? discipline.labelEn : discipline.labelFr }))}
                />
                <FormInput
                  label="Club / Dojo"
                  value={form.dojo}
                  onChange={(value) => update("dojo", value)}
                />
                <FormInput
                  label="Coach"
                  value={form.coach}
                  onChange={(value) => update("coach", value)}
                />
                <FormInput
                  label="Ceinture / niveau"
                  value={form.belt}
                  onChange={(value) => update("belt", value)}
                />
                <FormSelect
                  label="Programme demandé"
                  value={form.campaignId}
                  onChange={(value) => update("campaignId", value)}
                  options={campaigns.map((campaign) => ({
                    value: campaign.id,
                    label: campaign.title,
                  }))}
                />
                <FormSelect
                  label="Statut"
                  value={form.athleteStatus}
                  onChange={(value) => update("athleteStatus", value)}
                  options={PROGRAM_ROLES}
                />
              </div>
            </section>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Présentation</SectionTitle>

              <p className="mb-2 text-sm text-zinc-400">Vous pouvez répondre en français, en anglais ou dans les deux langues.</p>
              <p className="mb-5 max-w-4xl text-sm leading-6 text-zinc-300">{language === "en" ? "The more complete and detailed your presentation is, the more visible your profile will be and the more credible your athletic project will appear to potential supporters." : "Plus votre présentation sera complète et détaillée, plus votre profil sera visible et votre projet sportif paraîtra crédible auprès des personnes susceptibles de vous soutenir."}</p>
              <div className="grid gap-5 md:grid-cols-2">
                <FormTextarea
                  label="Présentez-vous — Français"
                  value={form.motivationFr}
                  onChange={(value) => update("motivationFr", value)}
                  required={false}
                  placeholder="Parlez de votre parcours, de votre discipline et de ce qui vous motive."
                />
                <FormTextarea
                  label="Introduce yourself — English"
                  value={form.motivationEn}
                  onChange={(value) => update("motivationEn", value)}
                  required={false}
                  placeholder="Tell us about your journey, discipline and motivation."
                />
                <FormTextarea
                  label="Pourquoi rejoindre le programme ? — Français"
                  value={form.campaignReasonFr}
                  onChange={(value) => update("campaignReasonFr", value)}
                  required={false}
                  placeholder="Expliquez pourquoi cette campagne est importante pour vous."
                />
                <FormTextarea
                  label="Why join the program? — English"
                  value={form.campaignReasonEn}
                  onChange={(value) => update("campaignReasonEn", value)}
                  required={false}
                  placeholder="Explain why this campaign matters to you."
                />
                <FormTextarea
                  label="Objectifs sportifs — Français"
                  value={form.sportGoalsFr}
                  onChange={(value) => update("sportGoalsFr", value)}
                  required={false}
                  placeholder="Vos objectifs pour la saison ou la compétition visée."
                />
                <FormTextarea
                  label="Athletic goals — English"
                  value={form.sportGoalsEn}
                  onChange={(value) => update("sportGoalsEn", value)}
                  required={false}
                  placeholder="Your goals for the season or target competition."
                />
                <FormTextarea
                  label="Compétitions visées — Français"
                  value={form.targetedCompetitionsFr}
                  onChange={(value) => update("targetedCompetitionsFr", value)}
                  required={false}
                  placeholder="Ex. WKC Spain 2026, WAKO Italie 2026, championnats provinciaux..."
                />
                <FormTextarea label="Target competitions — English" value={form.targetedCompetitionsEn} onChange={(value) => update("targetedCompetitionsEn", value)} required={false} placeholder="E.g. WKC Spain 2026, WAKO Italy 2026, provincial championships..." />
              </div>
            </section>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Soutien à votre campagne</SectionTitle>

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Objectif financier souhaité"
                  type="number"
                  value={form.desiredGoal}
                  onChange={(value) => update("desiredGoal", value)}
                />
                <FormInput
                  label="Nom affiché publiquement"
                  value={form.publicDisplayName}
                  onChange={(value) => update("publicDisplayName", value)}
                  placeholder="Ex. Famille Saint-Étienne ou Anna Saint-Étienne"
                />
                <FormInput
                  label="Nom de famille / groupe familial"
                  value={form.familyName}
                  onChange={(value) => update("familyName", value)}
                />
                <FormInput
                  label="Lien photo ou vidéo de présentation"
                  type="url"
                  value={form.photo}
                  onChange={(value) => update("photo", value)}
                  required={false}
                />
              </div>

              <div className="mt-6 border-l-4 border-yellow-600 bg-black p-5 text-sm leading-7 text-zinc-300">
                Chaque hoodie supporter vendu via votre campagne attribue
                actuellement{" "}
                <strong className="text-white">
                  {HOODIE_SUPPORT_AMOUNT} $ CAD
                </strong>{" "}
                à l’athlète ou à la famille sélectionné(e). Les produits ne sont
                pas personnalisés pour le moment.
              </div>
            </section>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Réseaux sociaux</SectionTitle>

              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Instagram"
                  value={form.instagram}
                  onChange={(value) => update("instagram", value)}
                  required={false}
                />
                <FormInput
                  label="Facebook"
                  value={form.facebook}
                  onChange={(value) => update("facebook", value)}
                  required={false}
                />
                <FormInput
                  label="TikTok"
                  value={form.tiktok}
                  onChange={(value) => update("tiktok", value)}
                  required={false}
                />
                <FormInput
                  label="YouTube"
                  value={form.youtube}
                  onChange={(value) => update("youtube", value)}
                  required={false}
                />
                <FormInput
                  label="Site web"
                  value={form.website}
                  onChange={(value) => update("website", value)}
                  required={false}
                />
                <FormInput
                  label="Autres liens / réseaux sociaux"
                  value={form.athleteSocials}
                  onChange={(value) => update("athleteSocials", value)}
                  required={false}
                />
              </div>
            </section>

            <section className="border border-yellow-700/40 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Consentements obligatoires</SectionTitle>

              <div className="mb-7 border-l-4 border-yellow-600 bg-black p-5 text-sm leading-7 text-zinc-300">
                <strong className="block text-white">Comment votre versement sera effectué</strong>
                Si votre candidature est acceptée, vous configurerez votre bénéficiaire dans votre espace avec votre nom légal et votre courriel seulement. À la fin de chaque campagne, tout votre solde admissible sera regroupé en un seul versement, normalement préparé 15 jours après la fermeture. KinkoLab prépare le lot dans Wise, puis une personne autorisée distincte doit l’approuver dans Wise avant son financement à partir du solde CAD de KinkoLab. Wise vous enverra ensuite un lien sécurisé, habituellement valide sept jours, afin que vous lui transmettiez directement vos coordonnées bancaires. KinkoLab ne reçoit ni ne conserve ces coordonnées. Pour un participant mineur, le bénéficiaire doit être son parent ou tuteur légal.
              </div>

              <div className="space-y-5">
                <ConsentCheckbox
                  checked={consents.rules}
                  onChange={(value) => updateConsent("rules", value)}
                >
                  J’ai lu et j’accepte les règles, critères, conditions et
                  modalités du Programme Athlètes KinkoLab.
                </ConsentCheckbox>

                <ConsentCheckbox
                  checked={consents.noGuarantee}
                  onChange={(value) => updateConsent("noGuarantee", value)}
                >
                  Je comprends qu’une demande ne garantit pas automatiquement une
                  acceptation ni un financement.
                </ConsentCheckbox>

                <ConsentCheckbox
                  checked={consents.imageUse}
                  onChange={(value) => updateConsent("imageUse", value)}
                >
                  J’autorise KinkoLab à utiliser certaines informations, images
                  ou éléments de présentation liés au programme dans le cadre de
                  ma campagne ou du Programme Athlètes.
                </ConsentCheckbox>

                {isMinor && <ConsentCheckbox
                  checked={consents.legalParent}
                  onChange={(value) => updateConsent("legalParent", value)}
                >
                  Si le participant est mineur, je confirme être le parent ou
                  tuteur légal autorisé.
                </ConsentCheckbox>}

                <ConsentCheckbox
                  checked={consents.revocation}
                  onChange={(value) => updateConsent("revocation", value)}
                >
                  Je comprends que KinkoLab peut suspendre, refuser ou révoquer
                  une participation au programme selon ses règles et valeurs.
                </ConsentCheckbox>
              </div>
            </section>

            <section className="border border-zinc-700 bg-zinc-950/50 p-6 md:p-8">
              <SectionTitle>Communications par courriel</SectionTitle>
              <p className="mb-5 text-sm leading-7 text-zinc-300">
                Les courriels nécessaires au traitement de votre candidature et au suivi de votre campagne peuvent inclure l’acceptation, l’avancement, la fermeture de la campagne et le versement des fonds.
              </p>
              <label className="flex cursor-pointer items-start gap-4 text-sm leading-6 text-zinc-200">
                <input
                  type="checkbox"
                  checked={consents.marketingCommunications}
                  onChange={(event) => updateConsent("marketingCommunications", event.target.checked)}
                  className="mt-1 h-4 w-4 accent-yellow-600"
                />
                <span>
                  J’accepte également de recevoir des nouvelles sur les prochaines campagnes, les nouvelles campagnes ouvertes et les activités ou produits du Programme Athlètes KinkoLab. Ce consentement est facultatif et je peux me désabonner en tout temps.
                </span>
              </label>
            </section>

            <div className="mt-10 text-center">
              <p className="text-sm text-zinc-400">
                En soumettant votre candidature, vous confirmez avoir pris
                connaissance des critères d’admissibilité et des conditions du
                programme.
              </p>

              <button
                type="button"
                onClick={handleOpenEligibility}
                className="mt-3 text-sm font-semibold hover:underline"
                style={{ color: gold }}
              >
                Consulter les critères d’admissibilité →
              </button>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 px-8 py-5 font-black uppercase text-black disabled:opacity-60"
              style={{ background: gold }}
            >
              {submitting ? "Envoi..." : "Soumettre candidature"}
              <ArrowRight size={22} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
