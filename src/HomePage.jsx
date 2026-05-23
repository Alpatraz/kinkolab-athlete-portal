import { Flame } from "lucide-react";
import { gold, money, totalRaised, progressOf } from "../utils/format";

export default function HomePage({
  athletes,
  campaigns,
  openAthletes,
  openCampaigns,
  openSignup,
}) {
  const raised = athletes.reduce(
    (sum, athlete) => sum + totalRaised(athlete),
    0
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-[0.35em]"
              style={{ color: gold }}
            >
              Portail de financement sportif
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight">
              Un espace clair pour suivre et soutenir les athlètes.
            </h1>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={openAthletes}
                className="rounded-2xl px-6 py-4 font-black text-black"
                style={{ background: gold }}
              >
                Trouver un athlète
              </button>

              <button
                onClick={openCampaigns}
                className="rounded-2xl border border-zinc-700 px-6 py-4 font-black"
              >
                Voir les campagnes
              </button>

              <button
                onClick={openSignup}
                className="rounded-2xl border border-zinc-700 px-6 py-4 font-black"
              >
                Demander une page
              </button>
            </div>

            <div className="mt-8 rounded-3xl bg-zinc-950 p-6">
              <p>Total suivi</p>
              <p className="text-4xl font-black">{money(raised)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center gap-2">
              <Flame style={{ color: gold }} />
              <h2 className="text-2xl font-black">Athlètes vedettes</h2>
            </div>

            <div className="mt-6 space-y-4">
              {athletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className="rounded-2xl bg-black p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{athlete.avatar}</div>

                    <div>
                      <p className="font-black">{athlete.name}</p>
                      <p className="text-sm text-zinc-400">
                        {athlete.program}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {progressOf(athlete)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}