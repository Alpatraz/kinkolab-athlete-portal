import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Facebook,
  Gift,
  HeartHandshake,
  Instagram,
  Mail,
  Megaphone,
  MessageCircle,
  Plane,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Users,
} from "lucide-react";
import { cn, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

function SectionTitle({ icon: Icon, kicker, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={22} style={{ color: gold }} />}
        <div>
          {kicker && (
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>
              {kicker}
            </p>
          )}
          <h2 className="text-2xl font-black text-white md:text-3xl">{title}</h2>
        </div>
      </div>
      {children && <p className="mt-3 text-sm leading-6 text-zinc-400">{children}</p>}
    </div>
  );
}

function CampaignStep({ step, index }) {
  const done = step.status === "completed";
  const inProgress = step.status === "in_progress";

  return (
    <div className="relative flex gap-4 rounded-2xl bg-black p-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
            done && "border-emerald-500 bg-emerald-500 text-black",
            inProgress && "border-amber-400 bg-amber-400 text-black",
            !done && !inProgress && "border-zinc-700 bg-zinc-950 text-zinc-500"
          )}
        >
          {done ? <CheckCircle2 size={18} /> : index + 1}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-black text-white">{step.label}</p>
            <p className="mt-1 text-sm text-zinc-400">{step.note}</p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase text-zinc-600">
              {done ? "Complété" : inProgress ? "En cours" : "À venir"}
            </p>
            {step.date && <p className="mt-1 text-xs text-zinc-500">{step.date}</p>}
            {step.amount !== null && step.amount !== undefined && (
              <p className="mt-1 text-sm font-black" style={{ color: gold }}>
                {money(step.amount)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedRow({ item }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-black p-4">
      <span className="text-sm font-bold text-zinc-200">{item.label}</span>
      <span className="text-sm font-black" style={{ color: gold }}>
        {money(item.amount)}
      </span>
    </div>
  );
}

function SponsorCard({ sponsor }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-2xl">
          {sponsor.logo ? (
            <img src={sponsor.logo} alt={sponsor.name} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            "🤝"
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold uppercase" style={{ color: gold }}>
            {sponsor.level}
          </p>
          <h3 className="mt-1 text-lg font-black text-white">{sponsor.name}</h3>
          {sponsor.message && <p className="mt-2 text-sm leading-6 text-zinc-400">{sponsor.message}</p>}
          {sponsor.amount !== null && sponsor.amount !== undefined && (
            <p className="mt-2 text-sm font-bold text-zinc-300">Contribution : {money(sponsor.amount)}</p>
          )}
          {sponsor.link && (
            <a href={sponsor.link} className="mt-3 inline-block text-sm font-bold text-zinc-300 hover:text-white">
              Voir le partenaire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AthletePublicPage({
  athlete,
  updates,
  wallMessages,
  setWallMessages,
  goBack,
  onOpenCampaign,
}) {
  const approvedUpdates = updates.filter((item) => item.athleteId === athlete.id);
  const approvedMessages = wallMessages.filter(
    (item) => item.athleteId === athlete.id && item.status === "approuvé"
  );

  const [message, setMessage] = useState({ name: "", message: "" });
  const [messageOpen, setMessageOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const raised = totalRaised(athlete);
  const sponsorship = Number(athlete.raisedSponsorship || 0);
  const remaining = Math.max(Number(athlete.goal || 0) - raised, 0);
  const needs = athlete.needs || [];
  const sponsors = athlete.sponsors || [];
  const fundingEvents = athlete.fundingEvents || [];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  function submitMessage() {
    if (!message.name.trim() || !message.message.trim()) return;

    setWallMessages([
      {
        id: Date.now(),
        athleteId: athlete.id,
        name: message.name,
        message: message.message,
        date: new Date().toISOString().slice(0, 10),
        status: "en_attente",
        hideAmount: true,
      },
      ...wallMessages,
    ]);

    setMessage({ name: "", message: "" });
    setMessageOpen(false);
  }

  function copyShareLink() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={goBack}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={17} /> Retour aux athlètes
        </button>

        {/* 1. HERO ATHLÈTE */}
        <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[0.95fr_1.1fr] lg:items-center">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black">
                {athlete.photoUrl ? (
                  <img src={athlete.photoUrl} alt={athlete.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl">
                    {athlete.avatar}
                  </div>
                )}
              </div>

              <div className="absolute left-4 top-4 rounded-full bg-black/75 px-4 py-2 text-sm font-black backdrop-blur">
                {athlete.countryFlag || "🇨🇦"} Canada
              </div>

              <div className="absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm font-black text-black" style={{ background: gold }}>
                {athlete.campaignBadge || athlete.program}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
                Page athlète publique
              </p>

              <h1 className="mt-4 text-5xl font-black md:text-7xl">{athlete.name}</h1>

              <p className="mt-3 text-2xl font-black text-white">
                {athlete.athleteLabel || "Athlète Kinko"} — {athlete.campaignBadge || athlete.program}
              </p>

              <p className="mt-2 text-lg text-zinc-300">Dojo {athlete.dojo}</p>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                Objectif : {athlete.fundingPurpose || "financer sa participation à la compétition"}.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[athlete.province, athlete.discipline, `Ceinture ${athlete.belt}`].map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-900 px-4 py-2 text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-sm font-bold leading-6" style={{ color: gold }}>
                  Lors de l’achat, sélectionnez {athlete.name} comme athlète supporté.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href={athlete.shopifyUrl} className="flex items-center gap-2 rounded-2xl px-4 py-3 font-black text-black" style={{ background: gold }}>
                  <Store size={18} /> Acheter un t-shirt ou hoodie et soutenir {athlete.name.split(" ")[0]}
                </a>

                <a href={athlete.sponsorUrl} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <HeartHandshake size={18} /> Faire un don / commandite pour {athlete.name.split(" ")[0]}
                </a>

                <button onClick={copyShareLink} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <Share2 size={18} /> {copied ? "Lien copié" : "Partager la page"}
                </button>

                <button onClick={() => onOpenCampaign(athlete.campaignId)} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <Megaphone size={18} /> Voir campagne
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. OBJECTIF FINANCIER */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-zinc-950 p-6">
            <SectionTitle icon={Sparkles} title="Objectif financier" />

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">Objectif total</p>
                <p className="mt-1 text-3xl font-black">{money(athlete.goal)}</p>
              </div>
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">Déjà amassé</p>
                <p className="mt-1 text-3xl font-black">{money(raised)}</p>
              </div>
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">Reste à financer</p>
                <p className="mt-1 text-3xl font-black" style={{ color: gold }}>{money(remaining)}</p>
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar value={progressOf(athlete)} />
              <p className="mt-2 text-sm text-zinc-400">{progressOf(athlete)} % de l’objectif atteint</p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-zinc-300">
              <div className="flex justify-between rounded-2xl bg-black p-4"><span>Ventes boutique</span><b>{money(athlete.raisedShop)}</b></div>
              <div className="flex justify-between rounded-2xl bg-black p-4"><span>Dons / activités</span><b>{money(athlete.raisedOffline)}</b></div>
              <div className="flex justify-between rounded-2xl bg-black p-4"><span>Commandites</span><b>{money(sponsorship)}</b></div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-bold leading-6" style={{ color: gold }}>
                {athlete.profitNote || `100 % des profits des ventes associées à ${athlete.name} sont remis à ${athlete.name}.`}
              </p>
            </div>
          </div>

          {/* 3. COMMENT SOUTENIR */}
          <div className="rounded-[2rem] bg-zinc-950 p-6">
            <SectionTitle icon={Gift} title={`Comment soutenir ${athlete.name.split(" ")[0]} ?`}>
              Plusieurs façons simples permettent d’aider concrètement l’athlète.
            </SectionTitle>

            <div className="mt-6 grid gap-3">
              {(athlete.supportSteps || []).map((step, index) => (
                <div key={step} className="flex items-center gap-4 rounded-2xl bg-black p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full font-black text-black" style={{ background: gold }}>
                    {index + 1}
                  </div>
                  <p className="font-bold text-zinc-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. À QUOI SERVIRA LE FINANCEMENT */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Target} title="À quoi servira le financement ?">
            Le détail ci-dessous permet de comprendre concrètement ce que le soutien finance.
          </SectionTitle>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {needs.map((item) => <NeedRow key={item.label} item={item} />)}
          </div>

          <div className="mt-6 rounded-2xl bg-black p-5">
            <div className="flex items-start gap-3">
              <Plane className="mt-1" size={20} style={{ color: gold }} />
              <div>
                <p className="font-black">Un soutien concret</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Chaque achat supporter, don ou commandite aide directement à réduire les frais de compétition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. BOUTONS SHOPIFY */}
        <section className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
          <SectionTitle icon={Store} title="Soutenir via la boutique KinkoLab">
            Lors de l’achat, sélectionnez {athlete.name} comme athlète supporté.
          </SectionTitle>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={athlete.shopifyUrl} className="rounded-2xl px-5 py-4 font-black text-black" style={{ background: gold }}>
              Acheter un t-shirt ou hoodie et soutenir {athlete.name.split(" ")[0]}
            </a>
            <a href={athlete.sponsorUrl} className="rounded-2xl border border-zinc-700 px-5 py-4 font-black text-white hover:bg-zinc-900">
              Faire un don / commandite pour {athlete.name.split(" ")[0]}
            </a>
            <button onClick={copyShareLink} className="rounded-2xl border border-zinc-700 px-5 py-4 font-black text-white hover:bg-zinc-900">
              {copied ? "Lien copié" : "Partager la page"}
            </button>
          </div>
        </section>

        {/* 6. ÉTAPES */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={CalendarDays} title="Étapes de préparation">
            Chaque étape donne une vision claire du parcours de préparation.
          </SectionTitle>

          <div className="mt-6 grid gap-3">
            {athlete.steps.map((step, index) => (
              <CampaignStep key={`${step.label}-${index}`} step={step} index={index} />
            ))}
          </div>
        </section>

        {/* 7. ACTUALITÉ */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Megaphone} title={`Dernières nouvelles de ${athlete.name.split(" ")[0]}`} />

          <div className="mt-6 grid gap-4">
            {approvedUpdates.map((item) => (
              <article key={item.id} className="rounded-2xl border border-zinc-800 bg-black p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase" style={{ color: gold }}>{item.type}</p>
                  {item.date && <p className="text-xs text-zinc-500">{item.date}</p>}
                </div>
                <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.content}</p>
                {item.mediaUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl">
                    <img src={item.mediaUrl} alt={item.title} className="w-full object-cover" />
                  </div>
                )}
              </article>
            ))}
            {approvedUpdates.length === 0 && <p className="text-zinc-500">Aucune nouvelle publiée pour le moment.</p>}
          </div>
        </section>

        {/* 8. ÉVÉNEMENTS */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Users} title="Événements de financement">
            Activités locales, stages, ventes et initiatives autour de l’athlète.
          </SectionTitle>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {fundingEvents.length === 0 && <p className="text-zinc-500">Aucun événement publié pour le moment.</p>}
            {fundingEvents.map((event) => (
              <div key={`${event.date}-${event.title}`} className="rounded-2xl bg-black p-5">
                <p className="text-xs font-bold uppercase" style={{ color: gold }}>{event.date}</p>
                <h3 className="mt-2 text-xl font-black">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{event.description}</p>
                {event.goal && <p className="mt-3 text-sm font-bold text-zinc-300">Objectif : {money(event.goal)}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* 9. COMMANDITAIRES */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={HeartHandshake} title={`Partenaires de ${athlete.name.split(" ")[0]}`} />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sponsors.map((sponsor) => <SponsorCard key={`${sponsor.level}-${sponsor.name}`} sponsor={sponsor} />)}
          </div>
        </section>

        {/* 10. MUR D'ENCOURAGEMENT */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <SectionTitle icon={MessageCircle} title="Mur d’encouragement">
              Les messages sont publiés après validation afin de protéger l’athlète.
            </SectionTitle>

            <div className="mt-5 space-y-3">
              {approvedMessages.map((item) => (
                <div key={item.id} className="rounded-2xl bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{item.name}</p>
                    {item.date && <p className="text-xs text-zinc-500">{item.date}</p>}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setMessageOpen(!messageOpen)} className="mt-5 rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>
              Laisser un message
            </button>
          </div>

          <div className={cn("rounded-3xl bg-white p-6 text-zinc-950", !messageOpen && "hidden lg:block")}>
            <h2 className="text-2xl font-black">Ajouter un message</h2>
            <p className="mt-1 text-sm text-zinc-500">Le message sera publié après validation admin.</p>

            <div className="mt-5 space-y-3">
              <input
                value={message.name}
                onChange={(event) => setMessage({ ...message, name: event.target.value })}
                placeholder="Votre nom"
                className="w-full rounded-2xl border border-zinc-200 p-3"
              />

              <textarea
                value={message.message}
                onChange={(event) => setMessage({ ...message, message: event.target.value })}
                placeholder="Votre message..."
                className="min-h-28 w-full rounded-2xl border border-zinc-200 p-3"
              />

              <button onClick={submitMessage} className="w-full rounded-2xl bg-black p-3 font-black text-white">
                Soumettre
              </button>
            </div>
          </div>
        </section>

        {/* 11. TRANSPARENCE */}
        <section className="mt-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6">
          <SectionTitle icon={ShieldCheck} title="Transparence">
            Comment les fonds sont attribués ?
          </SectionTitle>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les profits des produits achetés en sélectionnant {athlete.name} sont ajoutés à sa campagne.
            </div>
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les dons et commandites associés à {athlete.name} sont ajoutés à son objectif.
            </div>
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les commandites d’événement sont versées au fonds commun de la campagne.
            </div>
          </div>
        </section>

        {/* 12. PARTAGE */}
        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Share2} title="Partager cette page">
            Aidez {athlete.name.split(" ")[0]} en partageant cette page avec votre famille, vos amis et votre réseau.
          </SectionTitle>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={copyShareLink} className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>
              <Copy size={18} /> {copied ? "Lien copié" : "Copier le lien"}
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Facebook size={18} /> Facebook
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Instagram size={18} /> Instagram
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Send size={18} /> Messenger
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Mail size={18} /> Courriel
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
