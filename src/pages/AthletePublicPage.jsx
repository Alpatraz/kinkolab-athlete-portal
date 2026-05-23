import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, HeartHandshake, Megaphone, MessageCircle, Share2, Sparkles, Store } from "lucide-react";
import { cn, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

function CampaignStep({ step, index }) {
  const done = step.status === "completed";
  const inProgress = step.status === "in_progress";

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn(
          "z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
          done && "border-emerald-500 bg-emerald-500 text-black",
          inProgress && "border-amber-400 bg-amber-400 text-black",
          !done && !inProgress && "border-zinc-700 bg-black text-zinc-500"
        )}>
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

export default function AthletePublicPage({ athlete, updates, wallMessages, setWallMessages, goBack, onOpenCampaign }) {
  const approvedUpdates = updates.filter((item) => item.athleteId === athlete.id);
  const approvedMessages = wallMessages.filter((item) => item.athleteId === athlete.id && item.status === "approuvé");
  const [message, setMessage] = useState({ name: "", message: "" });

  function submitMessage() {
    if (!message.name.trim() || !message.message.trim()) return;

    setWallMessages([
      { id: Date.now(), athleteId: athlete.id, name: message.name, message: message.message, status: "en_attente" },
      ...wallMessages,
    ]);

    setMessage({ name: "", message: "" });
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={17} /> Retour aux athlètes
        </button>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="text-7xl">{athlete.avatar}</div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
                Page athlète publique
              </p>

              <h1 className="mt-4 text-4xl font-black md:text-6xl">
                Soutenir {athlete.name}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                {athlete.bio}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[athlete.program, athlete.dojo, athlete.province, athlete.discipline, `Ceinture ${athlete.belt}`].map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-900 px-4 py-2 text-sm">{tag}</span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <Share2 size={18} /> Partager
                </button>
                <a href={athlete.shopifyUrl} className="flex items-center gap-2 rounded-2xl px-4 py-3 font-black text-black" style={{ background: gold }}>
                  <Store size={18} /> Acheter supporter
                </a>
                <a href={athlete.sponsorUrl} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <HeartHandshake size={18} /> Commandite
                </a>
                <button onClick={() => onOpenCampaign(athlete.campaignId)} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900">
                  <Megaphone size={18} /> Voir campagne
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] bg-zinc-900 p-6">
              <div className="flex items-center gap-3">
                <Sparkles style={{ color: gold }} />
                <h2 className="text-2xl font-black">Objectif financier</h2>
              </div>

              <p className="mt-5 text-5xl font-black">{money(totalRaised(athlete))}</p>
              <p className="mt-1 text-zinc-400">amassés sur {money(athlete.goal)}</p>

              <div className="mt-5">
                <ProgressBar value={progressOf(athlete)} />
              </div>

              <div className="mt-6 grid gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl bg-black p-4">Boutique : <b>{money(athlete.raisedShop)}</b></div>
                <div className="rounded-2xl bg-black p-4">Hors boutique : <b>{money(athlete.raisedOffline)}</b></div>
                <div className="rounded-2xl bg-black p-4">Temps restant : <b>{athlete.daysLeft} jours</b></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>Shopify</p>
            <h2 className="mt-2 text-2xl font-black">Collection supporter — {athlete.name}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">La page raconte l’histoire. Shopify vend les produits et commandites.</p>
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
                  <p className="text-xs font-bold uppercase" style={{ color: gold }}>{item.type}</p>
                  <h3 className="mt-1 text-xl font-black">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.content}</p>
                </div>
              ))}

              {approvedUpdates.length === 0 && <p className="text-zinc-500">Aucune nouvelle publiée pour le moment.</p>}
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
      </div>
    </main>
  );
}
