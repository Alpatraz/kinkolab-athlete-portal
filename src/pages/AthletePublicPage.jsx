import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  Plane,
  Share2,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { cn, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

function CampaignStep({ step, index }) {
  const done = step.status === "completed";
  const inProgress = step.status === "in_progress";

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
            done && "border-emerald-500 bg-emerald-500 text-black",
            inProgress && "border-amber-400 bg-amber-400 text-black",
            !done && !inProgress && "border-zinc-700 bg-black text-zinc-500"
          )}
        >
          {done ? <CheckCircle2 size={18} /> : index + 1}
        </div>
        <div className="h-full min-h-12 w-px bg-zinc-800" />
      </div>

      <div className="pb-5">
        <p className="font-black text-white">{step.label}</p>
        <p className="mt-1 text-sm text-zinc-400">{step.note}</p>
        <p className="mt-2 text-xs font-bold uppercase text-zinc-600">
          {done ? "Complété" : inProgress ? "En cours" : "À venir"}
        </p>
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

  const raised = totalRaised(athlete);
  const sponsorship = Number(athlete.raisedSponsorship || 0);
  const remaining = Math.max(Number(athlete.goal || 0) - raised, 0);
  const needs = athlete.needs || [];

  function submitMessage() {
    if (!message.name.trim() || !message.message.trim()) return;

    setWallMessages([
      {
        id: Date.now(),
        athleteId: athlete.id,
        name: message.name,
        message: message.message,
        status: "en_attente",
      },
      ...wallMessages,
    ]);

    setMessage({ name: "", message: "" });
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

        <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[0.95fr_1.1fr] lg:items-center">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black">
                {athlete.photoUrl ? (
                  <img
                    src={athlete.photoUrl}
                    alt={athlete.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl">
                    {athlete.avatar}
                  </div>
                )}
              </div>

              <div className="absolute left-4 top-4 rounded-full bg-black/75 px-4 py-2 text-sm font-black backdrop-blur">
                {athlete.countryFlag || "🇨🇦"} Canada
              </div>

              <div
                className="absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm font-black text-black"
                style={{ background: gold }}
              >
                {athlete.campaignBadge || athlete.program}
              </div>
            </div>

            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.3em]"
                style={{ color: gold }}
              >
                Page athlète publique
              </p>

              <h1 className="mt-4 text-5xl font-black md:text-7xl">
                {athlete.name}
              </h1>

              <p className="mt-3 text-2xl font-black text-white">
                {athlete.athleteLabel || "Athlète Kinko"} — {athlete.campaignBadge || athlete.program}
              </p>

              <p className="mt-2 text-lg text-zinc-300">
                Dojo {athlete.dojo}
              </p>

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

              <div className="mt-8 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <Share2 size={18} /> Partager cette page
                </button>

                <a
                  href={athlete.shopifyUrl}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 font-black text-black"
                  style={{ background: gold }}
                >
                  <Store size={18} /> Acheter supporter
                </a>

                <a
                  href={athlete.sponsorUrl}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"
                >
                  <HeartHandshake size={18} /> Commandite
                </a>

                <button
                  onClick={() => onOpenCampaign(athlete.campaignId)}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"
                >
                  <Megaphone size={18} /> Voir campagne
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <Sparkles style={{ color: gold }} />
              <h2 className="text-2xl font-black">Objectif financier</h2>
            </div>

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
                <p className="mt-1 text-3xl font-black" style={{ color: gold }}>
                  {money(remaining)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar value={progressOf(athlete)} />
              <p className="mt-2 text-sm text-zinc-400">{progressOf(athlete)} % de l’objectif atteint</p>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-zinc-300">
              <div className="flex justify-between rounded-2xl bg-black p-4">
                <span>Ventes boutique</span>
                <b>{money(athlete.raisedShop)}</b>
              </div>

              <div className="flex justify-between rounded-2xl bg-black p-4">
                <span>Dons / activités</span>
                <b>{money(athlete.raisedOffline)}</b>
              </div>

              <div className="flex justify-between rounded-2xl bg-black p-4">
                <span>Commandites</span>
                <b>{money(sponsorship)}</b>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-bold leading-6" style={{ color: gold }}>
                {athlete.profitNote || `100 % des profits des ventes associées à ${athlete.name} sont remis à ${athlete.name}.`}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <Target style={{ color: gold }} />
              <h2 className="text-2xl font-black">À quoi servira le financement ?</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Le détail ci-dessous permet de comprendre concrètement ce que le soutien finance.
            </p>

            <div className="mt-6 grid gap-3">
              {needs.map((item) => (
                <NeedRow key={item.label} item={item} />
              ))}
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
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>
              Shopify
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Collection supporter — {athlete.name}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              La page raconte l’histoire. Shopify vend les produits et commandites.
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <CalendarDays style={{ color: gold }} />
              <h2 className="text-2xl font-black">Étapes</h2>
            </div>

            <div className="mt-6">
              {athlete.steps.map((step, index) => (
                <CampaignStep key={`${step.label}-${index}`} step={step} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-zinc-950 p-6 lg:col-span-2">
            <h2 className="text-2xl font-black">Nouvelles et activités</h2>

            <div className="mt-5 space-y-4">
              {approvedUpdates.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-black p-5">
                  <p className="text-xs font-bold uppercase" style={{ color: gold }}>
                    {item.type}
                  </p>
                  <h3 className="mt-1 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.content}</p>
                </div>
              ))}

              {approvedUpdates.length === 0 && (
                <p className="text-zinc-500">Aucune nouvelle publiée pour le moment.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-950 p-6">
            <h2 className="text-2xl font-black">Commanditaires</h2>

            <div className="mt-5 space-y-3">
              {athlete.sponsors.map((sponsor) => (
                <div key={sponsor} className="rounded-2xl bg-black p-4 text-zinc-300">
                  {sponsor}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <div className="flex items-center gap-3">
              <MessageCircle style={{ color: gold }} />
              <h2 className="text-2xl font-black">Mur d’encouragement</h2>
            </div>

            <div className="mt-5 space-y-3">
              {approvedMessages.map((item) => (
                <div key={item.id} className="rounded-2xl bg-black p-4">
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-zinc-950">
            <h2 className="text-2xl font-black">Ajouter un message</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Le message sera publié après validation admin.
            </p>

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
      </div>
    </main>
  );
}
