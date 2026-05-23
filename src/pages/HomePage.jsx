import { DollarSign, Flame, Megaphone, Users } from "lucide-react";
import { gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";

export default function HomePage({ athletes, campaigns, openAthletes, openCampaigns, openSignup, onOpenAthlete }) {
  const featured = athletes.filter((athlete) => athlete.featured);
  const raised = athletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>
              Portail de financement sportif
            </p>

            <h1 className="mt-5 text-4xl font-black leading-tight md:text-7xl">
              Un espace clair pour suivre, soutenir et financer les athlètes.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              V1 testable : accueil, répertoire athlètes, campagnes, pages athlètes, formulaire et admin privé.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={openAthletes} className="rounded-2xl px-6 py-4 font-black text-black" style={{ background: gold }}>
                Trouver un athlète
              </button>
              <button onClick={openCampaigns} className="rounded-2xl border border-zinc-700 px-6 py-4 font-black text-white hover:bg-zinc-900">
                Voir les campagnes
              </button>
              <button onClick={openSignup} className="rounded-2xl border border-zinc-700 px-6 py-4 font-black text-white hover:bg-zinc-900">
                Demander une page
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard icon={Users} label="Athlètes" value={athletes.length} sub="Profils fictifs" />
              <StatCard icon={Megaphone} label="Campagnes" value={campaigns.length} sub="Pages séparées" />
              <StatCard icon={DollarSign} label="Fonds suivis" value={money(raised)} sub="Boutique + hors boutique" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <Flame style={{ color: gold }} />
              <h2 className="text-2xl font-black">Athlètes en vedette</h2>
            </div>

            <div className="mt-5 space-y-4">
              {featured.map((athlete) => (
                <button
                  key={athlete.id}
                  onClick={() => onOpenAthlete(athlete.id)}
                  className="w-full rounded-2xl bg-black p-4 text-left hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{athlete.avatar}</div>

                    <div className="flex-1">
                      <p className="font-black">{athlete.name}</p>
                      <p className="text-xs text-zinc-400">{athlete.program}</p>

                      <div className="mt-2">
                        <ProgressBar value={progressOf(athlete)} />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
