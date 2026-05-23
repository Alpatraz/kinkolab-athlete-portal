import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Eye,
  Flame,
  HeartHandshake,
  LogIn,
  MapPin,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  Star,
  Store,
  Trophy,
  Users,
  UserPlus,
  Megaphone,
  ShoppingBag,
  Filter,
  Medal,
  ShieldCheck,
  PencilLine,
  Camera,
  LockKeyhole,
} from "lucide-react";

const gold = "#D7B46A";

const campaignsSeed = [
  {
    id: "world-2026",
    title: "Championnats du monde 2026",
    subtitle: "Campagne internationale",
    location: "Espagne",
    date: "Octobre 2026",
    status: "Campagne active",
    description:
      "Campagne dédiée aux athlètes qualifiés pour les Championnats du monde 2026. Elle regroupe les pages athlètes, la collection Shopify et les objectifs de financement.",
    shopifyCollectionUrl: "https://kinkolab.com/collections/championnats-du-monde-2026",
  },
  {
    id: "wako-italy-2026",
    title: "WAKO Italie 2026",
    subtitle: "Campagne compétition",
    location: "Italie",
    date: "2026",
    status: "Ouvert aux inscriptions",
    description:
      "Campagne pour aider les athlètes sélectionnés à financer déplacement, inscription, équipement et préparation.",
    shopifyCollectionUrl: "https://kinkolab.com/collections/wako-italie-2026",
  },
  {
    id: "season-2026",
    title: "Saison compétitive 2026",
    subtitle: "Fonds saisonnier",
    location: "Québec / Canada",
    date: "Saison 2026",
    status: "Campagne continue",
    description:
      "Campagne flexible pour soutenir les athlètes sur plusieurs compétitions de la saison.",
    shopifyCollectionUrl: "https://kinkolab.com/collections/saison-competitive-2026",
  },
];

const athletesSeed = [
  {
    id: "noah-martin",
    name: "Noah Martin",
    campaignId: "world-2026",
    program: "Championnats du monde 2026",
    province: "Québec",
    discipline: "Karaté combat",
    dojo: "Sunfuki Terrebonne",
    belt: "Noire",
    status: "accepté",
    goal: 2500,
    raisedShop: 840,
    raisedOffline: 300,
    views: 1284,
    daysLeft: 12,
    featured: true,
    recentlyAdded: false,
    avatar: "🥋",
    category: "Fin bientôt",
    shopifyUrl: "https://kinkolab.com/collections/supporter-noah-martin",
    sponsorUrl: "https://kinkolab.com/products/commandite-noah-martin",
    bio:
      "Noah représente fièrement son dojo et prépare sa participation aux Championnats du monde 2026. Sa page permet de suivre son parcours et de le soutenir concrètement.",
    sponsors: ["Restaurant local", "Clinique sportive ABC"],
    steps: [
      { label: "Qualification", status: "completed", note: "Place confirmée dans l’équipe" },
      { label: "Enregistrement", status: "completed", note: "Dossier athlète créé" },
      { label: "Billets d’avion", status: "in_progress", note: "Recherche et réservation à venir" },
      { label: "Hôtel", status: "pending", note: "Budget à confirmer" },
      { label: "Équipement", status: "in_progress", note: "Produits supporters et équipement officiel" },
      { label: "Départ", status: "pending", note: "Préparation finale" },
    ],
  },
  {
    id: "emma-roy",
    name: "Emma Roy",
    campaignId: "wako-italy-2026",
    program: "WAKO Italie 2026",
    province: "Québec",
    discipline: "Point fighting",
    dojo: "Sunfuki Laval",
    belt: "Brune",
    status: "accepté",
    goal: 2000,
    raisedShop: 520,
    raisedOffline: 150,
    views: 742,
    daysLeft: 46,
    featured: true,
    recentlyAdded: true,
    avatar: "🏆",
    category: "Récemment ajouté",
    shopifyUrl: "https://kinkolab.com/collections/supporter-emma-roy",
    sponsorUrl: "https://kinkolab.com/products/commandite-emma-roy",
    bio:
      "Emma finance sa saison compétitive avec une campagne personnalisée reliée aux produits supporters KinkoLab.",
    sponsors: ["Famille & amis"],
    steps: [
      { label: "Qualification", status: "completed", note: "Sélection confirmée" },
      { label: "Enregistrement", status: "in_progress", note: "Documents en cours" },
      { label: "Billets d’avion", status: "pending", note: "À planifier" },
      { label: "Hôtel", status: "pending", note: "À réserver" },
      { label: "Équipement", status: "in_progress", note: "Campagne ouverte" },
      { label: "Départ", status: "pending", note: "À venir" },
    ],
  },
  {
    id: "liam-gagnon",
    name: "Liam Gagnon",
    campaignId: "season-2026",
    program: "Saison compétitive 2026",
    province: "Québec",
    discipline: "Kata",
    dojo: "Sunfuki Mascouche",
    belt: "Bleue",
    status: "accepté",
    goal: 1500,
    raisedShop: 310,
    raisedOffline: 90,
    views: 1540,
    daysLeft: 30,
    featured: false,
    recentlyAdded: false,
    avatar: "🔥",
    category: "Les plus vus",
    shopifyUrl: "https://kinkolab.com/collections/supporter-liam-gagnon",
    sponsorUrl: "https://kinkolab.com/products/commandite-liam-gagnon",
    bio:
      "Liam prépare plusieurs compétitions cette saison. Sa campagne finance une partie des frais grâce à la boutique et aux actions locales.",
    sponsors: ["Famille Gagnon"],
    steps: [
      { label: "Qualification", status: "completed", note: "Objectif de saison confirmé" },
      { label: "Enregistrement", status: "completed", note: "Profil public créé" },
      { label: "Transport", status: "pending", note: "Selon calendrier" },
      { label: "Hôtel", status: "pending", note: "Selon compétitions" },
      { label: "Équipement", status: "in_progress", note: "Produits disponibles" },
      { label: "Compétitions", status: "pending", note: "Calendrier à suivre" },
    ],
  },
];

const updatesSeed = [
  { id: 1, athleteId: "noah-martin", type: "Nouvelle", title: "Qualification confirmée", content: "Noah a confirmé sa place dans l’équipe pour la compétition internationale." },
  { id: 2, athleteId: "emma-roy", type: "Activité", title: "Campagne ouverte", content: "La page de financement d’Emma est maintenant disponible." },
];

const wallSeed = [
  { id: 1, athleteId: "noah-martin", name: "Famille Tremblay", message: "Bravo Noah, toute l’équipe est derrière toi !", status: "approuvé" },
  { id: 2, athleteId: "emma-roy", name: "Coach Marc", message: "Continue ton excellent travail Emma !", status: "approuvé" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function money(value) {
  return `${Number(value || 0).toLocaleString("fr-CA")} $`;
}

function totalRaised(athlete) {
  return Number(athlete.raisedShop || 0) + Number(athlete.raisedOffline || 0);
}

function progressOf(athlete) {
  return Math.round((totalRaised(athlete) / Number(athlete.goal || 1)) * 100);
}

function campaignTitle(campaigns, id) {
  return campaigns.find((campaign) => campaign.id === id)?.title || "Campagne inconnue";
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(Number(value || 0), 100));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
      <div className="h-full rounded-full transition-all" style={{ width: `${safeValue}%`, background: gold }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    accepté: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    approuvé: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    en_attente: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    refusé: "border-red-500/30 bg-red-500/15 text-red-300",
    auto: "border-blue-500/30 bg-blue-500/15 text-blue-300",
  };
  return (
    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", styles[status] || styles.auto)}>
      {String(status || "auto").replace("_", " ")}
    </span>
  );
}

function Header({ currentUser, setCurrentUser, goHome, openLogin, openSignup, openCampaigns, openAthletes, openAdmin }) {
  const isAdmin = currentUser?.role === "admin";
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/90 px-4 py-3 text-white backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button onClick={goHome} className="flex items-center gap-3 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl font-black text-black" style={{ background: gold }}>K</div>
          <div>
            <p className="text-lg font-black tracking-wide">KinkoLab</p>
            <p className="text-xs text-zinc-400">Programme Athlètes</p>
          </div>
        </button>
        <div className="hidden items-center gap-2 lg:flex">
          <button onClick={goHome} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">Accueil</button>
          <button onClick={openAthletes} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">Athlètes</button>
          <button onClick={openCampaigns} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">Campagnes</button>
          <button onClick={openSignup} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">Inscription</button>
          {isAdmin && <button onClick={openAdmin} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">Admin</button>}
        </div>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <button onClick={() => setCurrentUser(null)} className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800">Déconnexion</button>
          ) : (
            <button onClick={openLogin} className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-black" style={{ background: gold }}>
              <LogIn size={17} /> Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, sub, light = false }) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-lg", light ? "border-zinc-200 bg-white" : "border-zinc-800 bg-zinc-950")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm", light ? "text-zinc-500" : "text-zinc-400")}>{label}</p>
          <p className={cn("mt-1 text-2xl font-bold", light ? "text-zinc-950" : "text-white")}>{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2", light ? "bg-zinc-100" : "bg-zinc-900")} style={{ color: gold }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function AthleteCard({ athlete, campaigns, onOpen, onOpenCampaign }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 text-left text-white shadow-xl transition hover:border-zinc-600">
      <button onClick={() => onOpen(athlete.id)} className="block w-full text-left">
        <div className="relative h-36 bg-gradient-to-br from-zinc-800 to-black p-5">
          <div className="absolute right-5 top-5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-zinc-300">{athlete.category}</div>
          <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-black text-5xl shadow-lg">{athlete.avatar}</div>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">{athlete.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{athlete.dojo}</p>
            </div>
            {athlete.featured && <Star size={19} style={{ color: gold }} fill={gold} />}
          </div>
          <p className="mt-2 text-xs font-bold uppercase text-zinc-500">{athlete.province} · {athlete.discipline}</p>
          <p className="mt-2 text-xs text-zinc-500">{campaignTitle(campaigns, athlete.campaignId)}</p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{athlete.bio}</p>
          <div className="mt-4"><ProgressBar value={progressOf(athlete)} /></div>
          <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
            <span><b className="text-white">{money(totalRaised(athlete))}</b> / {money(athlete.goal)}</span>
            <span>{progressOf(athlete)}%</span>
          </div>
        </div>
      </button>
      <div className="flex border-t border-zinc-800 p-3 text-xs font-bold text-zinc-400">
        <button onClick={() => onOpen(athlete.id)} className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white"><Eye size={14} /> Page athlète</button>
        <button onClick={() => onOpenCampaign(athlete.campaignId)} className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white"><Megaphone size={14} /> Campagne</button>
      </div>
    </motion.div>
  );
}

function MiniSection({ title, icon: Icon, athletes, onOpen, subtitle }) {
  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 text-white">
      <div className="flex items-center gap-2"><Icon size={18} style={{ color: gold }} /><h3 className="font-black">{title}</h3></div>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
      <div className="mt-4 space-y-2">
        {athletes.slice(0, 4).map((athlete) => (
          <button key={`${title}-${athlete.id}`} onClick={() => onOpen(athlete.id)} className="flex w-full items-center justify-between rounded-2xl bg-black p-3 text-left hover:bg-zinc-900">
            <span>{athlete.avatar} {athlete.name}</span>
            <span className="text-xs text-zinc-500">Voir</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HomePage({ athletes, campaigns, openAthletes, openCampaigns, openSignup, onOpenAthlete }) {
  const featured = athletes.filter((athlete) => athlete.featured);
  const raised = athletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: gold }}>Portail de financement sportif</p>
            <h1 className="mt-5 text-4xl font-black leading-tight md:text-7xl">Un espace clair pour suivre, soutenir et financer les athlètes.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">V1 testable : accueil, répertoire athlètes, campagnes, pages athlètes, formulaire et admin privé.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={openAthletes} className="rounded-2xl px-6 py-4 font-black text-black" style={{ background: gold }}>Trouver un athlète</button>
              <button onClick={openCampaigns} className="rounded-2xl border border-zinc-700 px-6 py-4 font-black text-white hover:bg-zinc-900">Voir les campagnes</button>
              <button onClick={openSignup} className="rounded-2xl border border-zinc-700 px-6 py-4 font-black text-white hover:bg-zinc-900">Demander une page</button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <StatCard icon={Users} label="Athlètes" value={athletes.length} sub="Profils fictifs" />
              <StatCard icon={Megaphone} label="Campagnes" value={campaigns.length} sub="Pages séparées" />
              <StatCard icon={DollarSign} label="Fonds suivis" value={money(raised)} sub="Boutique + hors boutique" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3"><Flame style={{ color: gold }} /><h2 className="text-2xl font-black">Athlètes en vedette</h2></div>
            <div className="mt-5 space-y-4">
              {featured.map((athlete) => (
                <button key={athlete.id} onClick={() => onOpenAthlete(athlete.id)} className="w-full rounded-2xl bg-black p-4 text-left hover:bg-zinc-900">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{athlete.avatar}</div>
                    <div className="flex-1">
                      <p className="font-black">{athlete.name}</p>
                      <p className="text-xs text-zinc-400">{athlete.program}</p>
                      <div className="mt-2"><ProgressBar value={progressOf(athlete)} /></div>
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

function AthletesPage({ athletes, campaigns, onOpenAthlete, onOpenCampaign }) {
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
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>Répertoire des athlètes</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">Trouver un athlète à soutenir</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">Recherche par nom, dojo, province, discipline ou campagne.</p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <MiniSection title="Plus vus" subtitle="Pages les plus consultées" icon={Eye} athletes={mostViewed} onOpen={onOpenAthlete} />
          <MiniSection title="Plus récoltés" subtitle="Montants les plus élevés" icon={Trophy} athletes={mostRaised} onOpen={onOpenAthlete} />
          <MiniSection title="Presque finis" subtitle="Objectif le plus proche" icon={Medal} athletes={almostDone} onOpen={onOpenAthlete} />
          <MiniSection title="Fin bientôt" subtitle="Campagnes urgentes" icon={Clock3} athletes={endingSoon} onOpen={onOpenAthlete} />
        </section>

        <section className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center gap-2"><Filter size={18} style={{ color: gold }} /><h2 className="text-xl font-black">Filtres</h2></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-zinc-500" size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, dojo, campagne..." className="w-full rounded-2xl border border-zinc-800 bg-black py-3 pl-10 pr-4 text-white outline-none" />
            </div>
            <select value={dojo} onChange={(e) => setDojo(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">{dojos.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={province} onChange={(e) => setProvince(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">{provinces.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">{disciplines.map((value) => <option key={value}>{value}</option>)}</select>
            <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="rounded-2xl border border-zinc-800 bg-black p-3 text-white outline-none">
              <option value="Tous">Toutes les campagnes</option>
              {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.title}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-black">Résultats</h2>
          <p className="mt-1 text-zinc-400">{filtered.length} athlète(s) trouvé(s)</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {filtered.map((athlete) => <AthleteCard key={athlete.id} athlete={athlete} campaigns={campaigns} onOpen={onOpenAthlete} onOpenCampaign={onOpenCampaign} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

function CampaignsPage({ campaigns, athletes, onOpenCampaign, openSignup }) {
  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>Pages campagne</p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">Les campagnes du Programme Athlètes</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">Une campagne regroupe un événement, une collection Shopify et plusieurs athlètes.</p>
          <button onClick={openSignup} className="mt-6 rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>Demander à rejoindre une campagne</button>
        </section>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const linked = athletes.filter((athlete) => athlete.campaignId === campaign.id);
            const raised = linked.reduce((sum, athlete) => sum + totalRaised(athlete), 0);
            return (
              <motion.div key={campaign.id} whileHover={{ y: -4 }} className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6">
                  <StatusBadge status="auto" />
                  <h2 className="mt-5 text-2xl font-black">{campaign.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{campaign.subtitle}</p>
                </div>
                <div className="p-6">
                  <p className="text-sm leading-6 text-zinc-400">{campaign.description}</p>
                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="rounded-2xl bg-black p-4"><MapPin className="mb-2" size={18} style={{ color: gold }} /><b>{campaign.location}</b></div>
                    <div className="rounded-2xl bg-black p-4"><CalendarDays className="mb-2" size={18} style={{ color: gold }} /><b>{campaign.date}</b></div>
                    <div className="rounded-2xl bg-black p-4"><Users className="mb-2" size={18} style={{ color: gold }} /><b>{linked.length}</b> athlète(s)</div>
                  </div>
                  <div className="mt-5 rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Fonds suivis</p><p className="mt-1 text-2xl font-black">{money(raised)}</p></div>
                  <button onClick={() => onOpenCampaign(campaign.id)} className="mt-5 w-full rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>Ouvrir la campagne</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function CampaignDetailPage({ campaign, athletes, goBack, onOpenAthlete, openSignup }) {
  const linked = athletes.filter((athlete) => athlete.campaignId === campaign.id);
  const raised = linked.reduce((sum, athlete) => sum + totalRaised(athlete), 0);
  const goal = linked.reduce((sum, athlete) => sum + athlete.goal, 0);

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={17} /> Retour aux campagnes</button>
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>Page campagne</p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">{campaign.title}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">{campaign.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={campaign.shopifyCollectionUrl} className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}><ShoppingBag size={18} /> Voir la collection Shopify</a>
                <button onClick={openSignup} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900"><UserPlus size={18} /> Demander à participer</button>
              </div>
            </div>
            <div className="rounded-[2rem] bg-zinc-900 p-6">
              <h2 className="text-2xl font-black">Résumé campagne</h2>
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Lieu</p><p className="font-black">{campaign.location}</p></div>
                <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Date</p><p className="font-black">{campaign.date}</p></div>
                <div className="rounded-2xl bg-black p-4"><p className="text-xs uppercase text-zinc-500">Statut</p><p className="font-black">{campaign.status}</p></div>
              </div>
              <div className="mt-5"><ProgressBar value={goal ? Math.round((raised / goal) * 100) : 0} /></div>
              <p className="mt-3 text-sm text-zinc-400">{money(raised)} suivis sur {money(goal)} d’objectifs cumulés.</p>
            </div>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-3xl font-black">Athlètes reliés à cette campagne</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {linked.map((athlete) => <AthleteCard key={athlete.id} athlete={athlete} campaigns={[campaign]} onOpen={onOpenAthlete} onOpenCampaign={() => {}} />)}
          </div>
        </section>
      </div>
    </main>
  );
}

function CampaignStep({ step, index }) {
  const done = step.status === "completed";
  const inProgress = step.status === "in_progress";
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className={cn("z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black", done && "border-emerald-500 bg-emerald-500 text-black", inProgress && "border-amber-400 bg-amber-400 text-black", !done && !inProgress && "border-zinc-700 bg-black text-zinc-500")}>
          {done ? <CheckCircle2 size={18} /> : index + 1}
        </div>
        <div className="h-full min-h-12 w-px bg-zinc-800" />
      </div>
      <div className="pb-5">
        <p className="font-black text-white">{step.label}</p>
        <p className="mt-1 text-sm text-zinc-400">{step.note}</p>
        <p className="mt-2 text-xs font-bold uppercase text-zinc-600">{done ? "Complété" : inProgress ? "En cours" : "À venir"}</p>
      </div>
    </div>
  );
}

function AthletePublicPage({ athlete, updates, wallMessages, setWallMessages, goBack, onOpenCampaign }) {
  const approvedUpdates = updates.filter((item) => item.athleteId === athlete.id);
  const approvedMessages = wallMessages.filter((item) => item.athleteId === athlete.id && item.status === "approuvé");
  const [message, setMessage] = useState({ name: "", message: "" });

  function submitMessage() {
    if (!message.name.trim() || !message.message.trim()) return;
    setWallMessages([{ id: Date.now(), athleteId: athlete.id, name: message.name, message: message.message, status: "en_attente" }, ...wallMessages]);
    setMessage({ name: "", message: "" });
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={17} /> Retour aux athlètes</button>
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="text-7xl">{athlete.avatar}</div>
              <p className="mt-5 text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>Page athlète publique</p>
              <h1 className="mt-4 text-4xl font-black md:text-6xl">Soutenir {athlete.name}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{athlete.bio}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {[athlete.program, athlete.dojo, athlete.province, athlete.discipline, `Ceinture ${athlete.belt}`].map((tag) => <span key={tag} className="rounded-full bg-zinc-900 px-4 py-2 text-sm">{tag}</span>)}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"><Share2 size={18} /> Partager</button>
                <a href={athlete.shopifyUrl} className="flex items-center gap-2 rounded-2xl px-4 py-3 font-black text-black" style={{ background: gold }}><Store size={18} /> Acheter supporter</a>
                <a href={athlete.sponsorUrl} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"><HeartHandshake size={18} /> Commandite</a>
                <button onClick={() => onOpenCampaign(athlete.campaignId)} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"><Megaphone size={18} /> Voir campagne</button>
              </div>
            </div>
            <div className="rounded-[2rem] bg-zinc-900 p-6">
              <div className="flex items-center gap-3"><Sparkles style={{ color: gold }} /><h2 className="text-2xl font-black">Objectif financier</h2></div>
              <p className="mt-5 text-5xl font-black">{money(totalRaised(athlete))}</p>
              <p className="mt-1 text-zinc-400">amassés sur {money(athlete.goal)}</p>
              <div className="mt-5"><ProgressBar value={progressOf(athlete)} /></div>
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
            <div className="flex items-center gap-3"><CalendarDays style={{ color: gold }} /><h2 className="text-2xl font-black">Étapes</h2></div>
            <div className="mt-6">{athlete.steps.map((step, index) => <CampaignStep key={`${step.label}-${index}`} step={step} index={index} />)}</div>
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
            <div className="mt-5 space-y-3">{athlete.sponsors.map((sponsor) => <div key={sponsor} className="rounded-2xl bg-black p-4 text-zinc-300">{sponsor}</div>)}</div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <div className="flex items-center gap-3"><MessageCircle style={{ color: gold }} /><h2 className="text-2xl font-black">Mur d’encouragement</h2></div>
            <div className="mt-5 space-y-3">{approvedMessages.map((item) => <div key={item.id} className="rounded-2xl bg-black p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-zinc-400">{item.message}</p></div>)}</div>
          </div>
          <div className="rounded-3xl bg-white p-6 text-zinc-950">
            <h2 className="text-2xl font-black">Ajouter un message</h2>
            <p className="mt-1 text-sm text-zinc-500">Le message sera publié après validation admin.</p>
            <div className="mt-5 space-y-3">
              <input value={message.name} onChange={(e) => setMessage({ ...message, name: e.target.value })} placeholder="Votre nom" className="w-full rounded-2xl border border-zinc-200 p-3" />
              <textarea value={message.message} onChange={(e) => setMessage({ ...message, message: e.target.value })} placeholder="Votre message..." className="min-h-28 w-full rounded-2xl border border-zinc-200 p-3" />
              <button onClick={submitMessage} className="w-full rounded-2xl bg-black p-3 font-black text-white">Soumettre</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SignupView({ goBack }) {
  const [type, setType] = useState("individuel");
  const [submitted, setSubmitted] = useState(false);
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

  if (submitted) {
    return (
      <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl text-black" style={{ background: gold }}><CheckCircle2 size={34} /></div>
          <h1 className="mt-5 text-4xl font-black text-zinc-950">Demande envoyée</h1>
          <p className="mt-3 text-zinc-600">Dans la vraie version, cette demande apparaîtra dans l’admin global.</p>
          <div className="mt-6 grid gap-3 rounded-3xl bg-zinc-100 p-5 text-left text-sm text-zinc-700 md:grid-cols-2">
            <p><b>Athlète :</b> {form.firstName} {form.lastName}</p>
            <p><b>Campagne :</b> {selectedCampaignTitle}</p>
            <p><b>Discipline :</b> {form.discipline}</p>
            <p><b>Dojo :</b> {form.dojo || "À confirmer"}</p>
            <p><b>Objectif demandé :</b> {form.desiredGoal || "À confirmer"} $</p>
            <p><b>Ville / province :</b> {form.city || "À confirmer"}, {form.province}</p>
          </div>
          <button onClick={goBack} className="mt-6 rounded-2xl bg-black px-6 py-4 font-black text-white">Retour à l’accueil</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"><ArrowLeft size={17} /> Retour</button>
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="bg-black p-6 text-white md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em]" style={{ color: gold }}>Formulaire d’inscription</p>
            <h1 className="mt-2 text-4xl font-black">Demander une page athlète</h1>
            <p className="mt-3 max-w-3xl text-zinc-300">Ce formulaire collecte les informations nécessaires pour créer une page athlète claire, crédible et reliée à une campagne KinkoLab.</p>
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
              <FormInput label="Courriel" type="email" value={form.email} onChange={(value) => update("email", value)} />
              <FormInput label="Téléphone" value={form.phone} onChange={(value) => update("phone", value)} />
              <FormInput label="Ville" value={form.city} onChange={(value) => update("city", value)} />
              <FormInput label="Dojo" value={form.dojo} onChange={(value) => update("dojo", value)} />
              <FormInput label="Coach" value={form.coach} onChange={(value) => update("coach", value)} />
              <FormSelect label="Province" value={form.province} onChange={(value) => update("province", value)} options={["Québec", "Ontario", "Nouveau-Brunswick", "Autre"]} />
              <FormSelect label="Discipline" value={form.discipline} onChange={(value) => update("discipline", value)} options={["Karaté combat", "Point fighting", "Kata", "Kobudo", "Autre"]} />
              <FormInput label="Ceinture" value={form.belt} onChange={(value) => update("belt", value)} />
              <FormSelect label="Campagne souhaitée" value={form.campaignId} onChange={(value) => update("campaignId", value)} options={campaignsSeed.map((campaign) => ({ value: campaign.id, label: campaign.title }))} />
              <FormInput label="Objectif financier souhaité" type="number" value={form.desiredGoal} onChange={(value) => update("desiredGoal", value)} />
              <FormInput label="Lien photo / média" value={form.photo} onChange={(value) => update("photo", value)} />
              {type === "famille" && (
                <>
                  <FormInput label="Nom du parent" value={form.parentName} onChange={(value) => update("parentName", value)} />
                  <FormInput label="Courriel du parent" type="email" value={form.parentEmail} onChange={(value) => update("parentEmail", value)} />
                  <FormInput label="Téléphone du parent" value={form.parentPhone} onChange={(value) => update("parentPhone", value)} />
                  <FormInput label="Nom de famille à afficher" value={form.familyName} onChange={(value) => update("familyName", value)} />
                </>
              )}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormTextarea label="Pourquoi cette campagne ?" value={form.campaignReason} onChange={(value) => update("campaignReason", value)} />
              <FormTextarea label="Motivation / histoire de l’athlète" value={form.motivation} onChange={(value) => update("motivation", value)} />
            </div>

            <div className="mt-8 rounded-3xl bg-zinc-100 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1" style={{ color: gold }} />
                <div>
                  <h3 className="font-black text-zinc-950">Validation avant publication</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">La demande est préparée pour un flux réaliste : réception admin, validation, création du profil public, puis liaison avec Shopify.</p>
                </div>
              </div>
            </div>

            <button onClick={() => setSubmitted(true)} className="mt-8 w-full rounded-2xl bg-black px-6 py-4 font-black text-white hover:bg-zinc-800">Envoyer la demande</button>
          </div>
        </div>
      </div>
    </main>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950" />
    </label>
  );
}

function FormTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-32 w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950" />
    </label>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-950 outline-none focus:border-zinc-950">
        {options.map((option) => {
          const valueToUse = typeof option === "string" ? option : option.value;
          const labelToUse = typeof option === "string" ? option : option.label;
          return <option key={valueToUse} value={valueToUse}>{labelToUse}</option>;
        })}
      </select>
    </label>
  );
}

function LoginView({ goBack, setCurrentUser, openAdmin }) {
  const [role, setRole] = useState("athlete");

  function login() {
    const user = role === "admin" ? { name: "Admin KinkoLab", role: "admin" } : { name: "Athlète démo", role: "athlete" };
    setCurrentUser(user);
    if (role === "admin") openAdmin();
    else goBack();
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
        <button onClick={goBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"><ArrowLeft size={17} /> Retour</button>
        <LockKeyhole size={38} style={{ color: gold }} />
        <h1 className="mt-4 text-4xl font-black">Connexion portail</h1>
        <p className="mt-3 text-zinc-400">Connexion simulée pour tester l’interface.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => setRole("athlete")} className={cn("rounded-2xl border p-4 text-left", role === "athlete" ? "border-yellow-600 bg-black" : "border-zinc-800")}>Athlète</button>
          <button onClick={() => setRole("admin")} className={cn("rounded-2xl border p-4 text-left", role === "admin" ? "border-yellow-600 bg-black" : "border-zinc-800")}>Admin</button>
        </div>
        <button onClick={login} className="mt-6 w-full rounded-2xl px-5 py-4 font-black text-black" style={{ background: gold }}>Se connecter</button>
      </div>
    </main>
  );
}

function AdminView({ athletes, campaigns, wallMessages, setWallMessages, goBack, onOpenAthlete }) {
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
        <button onClick={goBack} className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-zinc-950"><ArrowLeft size={17} /> Retour</button>
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
            <div className="flex items-center gap-3"><PencilLine style={{ color: gold }} /><h2 className="text-2xl font-black text-zinc-950">Athlètes</h2></div>
            <div className="mt-5 space-y-3">
              {athletes.map((athlete) => (
                <button key={athlete.id} onClick={() => onOpenAthlete(athlete.id)} className="flex w-full items-center justify-between rounded-2xl bg-zinc-100 p-4 text-left hover:bg-zinc-200">
                  <span><b>{athlete.avatar} {athlete.name}</b><br /><small className="text-zinc-500">{athlete.dojo} · {campaignTitle(campaigns, athlete.campaignId)}</small></span>
                  <span className="text-sm font-black">{progressOf(athlete)}%</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3"><Camera style={{ color: gold }} /><h2 className="text-2xl font-black text-zinc-950">Messages en attente</h2></div>
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

export default function App() {
  const [page, setPage] = useState({ name: "home" });
  const [currentUser, setCurrentUser] = useState(null);
  const [athletes] = useState(athletesSeed);
  const [campaigns] = useState(campaignsSeed);
  const [wallMessages, setWallMessages] = useState(wallSeed);

  const openAthlete = (id) => setPage({ name: "athlete", id });
  const openCampaign = (id) => setPage({ name: "campaign", id });
  const goHome = () => setPage({ name: "home" });
  const openAthletes = () => setPage({ name: "athletes" });
  const openCampaigns = () => setPage({ name: "campaigns" });
  const openSignup = () => setPage({ name: "signup" });
  const openLogin = () => setPage({ name: "login" });
  const openAdmin = () => setPage({ name: "admin" });

  const selectedAthlete = page.name === "athlete" ? athletes.find((athlete) => athlete.id === page.id) : null;
  const selectedCampaign = page.name === "campaign" ? campaigns.find((campaign) => campaign.id === page.id) : null;

  let content;
  if (page.name === "athletes") {
    content = <AthletesPage athletes={athletes} campaigns={campaigns} onOpenAthlete={openAthlete} onOpenCampaign={openCampaign} />;
  } else if (page.name === "campaigns") {
    content = <CampaignsPage campaigns={campaigns} athletes={athletes} onOpenCampaign={openCampaign} openSignup={openSignup} />;
  } else if (page.name === "campaign" && selectedCampaign) {
    content = <CampaignDetailPage campaign={selectedCampaign} athletes={athletes} goBack={openCampaigns} onOpenAthlete={openAthlete} openSignup={openSignup} />;
  } else if (page.name === "athlete" && selectedAthlete) {
    content = <AthletePublicPage athlete={selectedAthlete} updates={updatesSeed} wallMessages={wallMessages} setWallMessages={setWallMessages} goBack={openAthletes} onOpenCampaign={openCampaign} />;
  } else if (page.name === "signup") {
    content = <SignupView goBack={goHome} />;
  } else if (page.name === "login") {
    content = <LoginView goBack={goHome} setCurrentUser={setCurrentUser} openAdmin={openAdmin} />;
  } else if (page.name === "admin") {
    content = <AdminView athletes={athletes} campaigns={campaigns} wallMessages={wallMessages} setWallMessages={setWallMessages} goBack={goHome} onOpenAthlete={openAthlete} />;
  } else {
    content = <HomePage athletes={athletes} campaigns={campaigns} openAthletes={openAthletes} openCampaigns={openCampaigns} openSignup={openSignup} onOpenAthlete={openAthlete} />;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        goHome={goHome}
        openLogin={openLogin}
        openSignup={openSignup}
        openCampaigns={openCampaigns}
        openAthletes={openAthletes}
        openAdmin={openAdmin}
      />
      {content}
    </div>
  );
}
