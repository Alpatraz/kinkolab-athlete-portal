import { useMemo, useState } from "react";
import { Clock3, Eye, Filter, Medal, Search, Trophy } from "lucide-react";
import { campaignTitle, gold, progressOf, totalRaised } from "../utils/format";
import AthleteCard from "../components/AthleteCard";
import MiniSection from "../components/MiniSection";

export default function AthletesPage({ athletes, campaigns, onOpenAthlete, onOpenCampaign }) {
  const [search, setSearch] = useState("");
  const [dojo, setDojo] = useState("Tous");
  const [province, setProvince] = useState("Tous");
  const [discipline, setDiscipline] = useState("Tous");
  const [campaignId, setCampaignId] = useState("Tous");

  const dojos = useMemo(() => ["Tous", ...new Set(athletes.map((athlete) => athlete.dojo))], [athletes]);
  const provinces = useMemo(() => ["Tous", ...new Set(athletes.map((athlete) => athlete.province))], [athletes]);
  const disciplines = useMemo(() => ["Tous", ...new Set(athletes.map((athlete) => athlete.discipline))], [athletes]);

  const filtered = useMemo(() => {
    return athletes.filter((athlete) => {
      const query = search.trim().toLowerCase();
      const text = `${athlete.name} ${athlete.dojo} ${athlete.province} ${athlete.discipline} ${campaignTitle(campaigns, athlete.campaignId)}`.toLowerCase();

      return (
        (!query || text.includes(query)) &&
        (dojo === "Tous" || athlete.dojo === dojo) &&
        (province === "Tous" || athlete.province === province) &&
        (discipline === "Tous" || athlete.discipline === discipline) &&
        (campaignId === "Tous" || athlete.campaignId === campaignId)
      );
    });
  }, [athletes, campaigns, search, dojo, province, discipline, campaignId]);

  const mostViewed = useMemo(() => [...athletes].sort((a, b) => b.views - a.views), [athletes]);
  const mostRaised = useMemo(() => [...athletes].sort((a, b) => totalRaised(b) - totalRaised(a)), [athletes]);
  const almostDone = useMemo(() => [...athletes].sort((a, b) => progressOf(b) - progressOf(a)), [athletes]);
  const endingSoon = useMemo(() => [...athletes].sort((a, b) => a.daysLeft - b.daysLeft), [athletes]);

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Répertoire des athlètes
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">Trouver un athlète à soutenir</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            Recherche par nom, dojo, province, discipline ou campagne.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <MiniSection title="Plus vus" subtitle="Pages les plus consultées" icon={Eye} athletes={mostViewed} onOpen={onOpenAthlete} />
          <MiniSection title="Plus récoltés" subtitle="Montants les plus élevés" icon={Trophy} athletes={mostRaised} onOpen={onOpenAthlete} />
          <MiniSection title="Presque finis" subtitle="Objectif le plus proche" icon={Medal} athletes={almostDone} onOpen={onOpenAthlete} />
          <MiniSection title="Fin bientôt" subtitle="Campagnes urgentes" icon={Clock3} athletes={endingSoon} onOpen={onOpenAthlete} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center gap-2">
            <Filter size={18} style={{ color: gold }} />
            <h2 className="text-xl font-black">Filtres</h2>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-zinc-500" size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nom, dojo, campagne..."
                className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-10 pr-4 text-white outline-none"
              />
            </div>

            <select value={dojo} onChange={(event) => setDojo(event.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">
              {dojos.map((value) => <option key={value}>{value}</option>)}
            </select>

            <select value={province} onChange={(event) => setProvince(event.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">
              {provinces.map((value) => <option key={value}>{value}</option>)}
            </select>

            <select value={discipline} onChange={(event) => setDiscipline(event.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">
              {disciplines.map((value) => <option key={value}>{value}</option>)}
            </select>

            <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">
              <option value="Tous">Toutes les campagnes</option>
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-black">Résultats</h2>
          <p className="mt-1 text-zinc-400">{filtered.length} athlète(s) trouvé(s)</p>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {filtered.map((athlete) => (
              <AthleteCard
                key={athlete.id}
                athlete={athlete}
                campaigns={campaigns}
                onOpen={onOpenAthlete}
                onOpenCampaign={onOpenCampaign}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
