import { ArrowLeft, Camera, DollarSign, Megaphone, MessageCircle, PencilLine, Users } from "lucide-react";
import { campaignTitle, gold, money, progressOf, totalRaised } from "../utils/format";
import StatCard from "../components/StatCard";

export default function AdminView({ athletes, campaigns, wallMessages, setWallMessages, goBack, onOpenAthlete }) {
  const pendingMessages = wallMessages.filter((message) => message.status === "en_attente");

  function approveMessage(id) {
    setWallMessages(wallMessages.map((message) => message.id === id ? { ...message, status: "approuvé" } : message));
  }

  function refuseMessage(id) {
    setWallMessages(wallMessages.map((message) => message.id === id ? { ...message, status: "refusé" } : message));
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950">
          <ArrowLeft size={17} /> Retour
        </button>

        <section className="rounded-[2rem] bg-white p-6 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>Admin privé</p>
          <h1 className="mt-4 text-4xl font-black text-zinc-950 md:text-6xl">Gestion Programme Athlètes</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">Espace de test : validation des messages, suivi des athlètes et des campagnes.</p>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard light icon={Users} label="Athlètes" value={athletes.length} sub="Profils actifs" />
          <StatCard light icon={Megaphone} label="Campagnes" value={campaigns.length} sub="Campagnes ouvertes" />
          <StatCard light icon={MessageCircle} label="Messages à valider" value={pendingMessages.length} sub="Mur d’encouragement" />
          <StatCard light icon={DollarSign} label="Fonds suivis" value={money(athletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0))} sub="Total démo" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <PencilLine style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Athlètes</h2>
            </div>

            <div className="mt-5 space-y-3">
              {athletes.map((athlete) => (
                <button key={athlete.id} onClick={() => onOpenAthlete(athlete.id)} className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 p-4 text-left hover:bg-zinc-200">
                  <span>
                    <b>{athlete.avatar} {athlete.name}</b>
                    <br />
                    <small className="text-zinc-500">{athlete.dojo} · {campaignTitle(campaigns, athlete.campaignId)}</small>
                  </span>
                  <span className="text-sm font-black">{progressOf(athlete)}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Camera style={{ color: gold }} />
              <h2 className="text-2xl font-black text-zinc-950">Messages en attente</h2>
            </div>

            <div className="mt-5 space-y-3">
              {pendingMessages.length === 0 && <p className="text-zinc-500">Aucun message à valider.</p>}

              {pendingMessages.map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-200 p-4">
                  <p className="font-black text-zinc-950">{item.name}</p>
                  <p className="mt-1 text-sm text-zinc-600">{item.message}</p>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => approveMessage(item.id)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Approuver</button>
                    <button onClick={() => refuseMessage(item.id)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">Refuser</button>
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
