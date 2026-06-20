import { Search, UserRound, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { campaignTitle, gold, money, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

function isVisibleAthlete(athlete) {
  return (
    athlete &&
    athlete.isPublic !== false &&
    athlete.status !== "suspendu" &&
    athlete.status !== "archivé"
  );
}

function contributionAmount(contribution) {
  return Number(contribution?.amountReserved || contribution?.reservedAmount || 0);
}

export default function AthletesPage({
  athletes = [],
  campaigns = [],
  contributions = [],
  onOpenAthlete,
  onOpenCampaign,
}) {
  const [search, setSearch] = useState("");

  function raisedForAthlete(athlete) {
    const shopTotal = (contributions || [])
      .filter((contribution) => {
        const directAthlete = contribution.athleteId === athlete.id;

        const familyContribution =
          athlete.familyId &&
          contribution.fundingMode === "family" &&
          contribution.familyId === athlete.familyId;

        return directAthlete || familyContribution;
      })
      .reduce((sum, contribution) => sum + contributionAmount(contribution), 0);

    return Math.max(totalRaised(athlete), shopTotal);
  }

  function progressForAthlete(athlete, raised) {
    const goal = Number(athlete.goal || 0);
    if (!goal) return 0;
    return Math.min(Math.round((raised / goal) * 100), 100);
  }

  const visibleAthletes = useMemo(() => {
    return (athletes || [])
      .filter(isVisibleAthlete)
      .filter((athlete) => {
        const text = [
          athlete.name,
          athlete.firstName,
          athlete.lastName,
          athlete.dojo,
          athlete.city,
          athlete.province,
          athlete.discipline,
          athlete.belt,
          campaignTitle(campaigns || [], athlete.campaignId),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(search.toLowerCase());
      });
  }, [athletes, campaigns, search]);

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Athlètes
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Athlètes soutenus par KinkoLab
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">
            Découvrez les athlètes actifs, leurs objectifs et leurs campagnes de financement.
          </p>

          <div className="relative mt-8 max-w-xl">
            <Search className="absolute left-4 top-4 text-zinc-500" size={20} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un athlète, dojo, ville, discipline..."
              className="w-full rounded-2xl border border-zinc-800 bg-black py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-600"
            />
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleAthletes.length === 0 && (
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-zinc-400 md:col-span-2 lg:col-span-3">
              Aucun athlète actif à afficher pour le moment.
            </div>
          )}

          {visibleAthletes.map((athlete) => {
            const raised = raisedForAthlete(athlete);
            const progress = progressForAthlete(athlete, raised);
            const campaignName = campaignTitle(campaigns || [], athlete.campaignId);

            return (
              <article key={athlete.id} className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-xl">
                <div className="h-56 bg-gradient-to-br from-zinc-900 to-black">
                  {athlete.photoUrl ? (
                    <img src={athlete.photoUrl} alt={athlete.name || "Athlète"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-7xl">
                      {athlete.avatar || "🥋"}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        {athlete.name || "Athlète Kinko"}
                      </h2>

                      <p className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                        <MapPin size={15} />
                        {athlete.dojo || "Dojo à confirmer"}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-black" style={{ background: gold }}>
                      <UserRound size={24} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-300">
                      {athlete.discipline || "Arts martiaux"}
                    </span>

                    <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-300">
                      {athlete.belt || "Niveau à confirmer"}
                    </span>

                    {campaignName && (
                      <button
                        onClick={() => onOpenCampaign?.(athlete.campaignId)}
                        className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-800"
                      >
                        {campaignName}
                      </button>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-400">
                    {athlete.bio || athlete.fundingPurpose || "Cet athlète prépare sa campagne de financement avec KinkoLab."}
                  </p>

                  <div className="mt-5 rounded-2xl bg-black p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase text-zinc-500">Fonds suivis</p>
                        <p className="mt-1 text-2xl font-black text-white">{money(raised)}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase text-zinc-500">Objectif</p>
                        <p className="mt-1 font-black" style={{ color: gold }}>
                          {money(athlete.goal || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <ProgressBar value={progress} />
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      {progress}% de l’objectif atteint
                    </p>
                  </div>

                  <button
                    onClick={() => onOpenAthlete?.(athlete.id)}
                    className="mt-5 w-full rounded-2xl px-5 py-4 font-black text-black"
                    style={{ background: gold }}
                  >
                    Voir la page athlète
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
