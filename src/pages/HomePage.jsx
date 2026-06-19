import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  HeartHandshake,
  Leaf,
  ReceiptText,
  Shirt,
  ShoppingBag,
  Store,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { gold, money, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";

const HERO_IMAGE_URL = "/images/kinkolab-programme-athletes-hero.png";
const HOODIE_SUPPORT_AMOUNT = 20;

function isVisibleCampaign(campaign) {
  return (
    campaign &&
    campaign.status !== "suspendue" &&
    campaign.status !== "archivée" &&
    campaign.status !== "archive" &&
    campaign.status !== "archivé"
  );
}

function isVisibleAthlete(athlete) {
  return (
    athlete &&
    athlete.isPublic !== false &&
    athlete.status !== "suspendu" &&
    athlete.status !== "archivé"
  );
}

function participationRaised(participation) {
  return (
    Number(participation?.raisedShop || 0) +
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
}

function campaignStats(campaign, athletes = [], participations = []) {
  const campaignParticipations = (participations || []).filter(
    (participation) =>
      participation.campaignId === campaign.id &&
      participation.status !== "suspendue" &&
      participation.status !== "suspendu" &&
      participation.status !== "archivée" &&
      participation.status !== "archivé"
  );

  if (campaignParticipations.length > 0) {
    const athleteIds = new Set(campaignParticipations.map((item) => item.athleteId));

    return {
      athletesCount: Array.from(athleteIds).length,
      raised: campaignParticipations.reduce((sum, item) => sum + participationRaised(item), 0),
      goal: campaignParticipations.reduce((sum, item) => sum + Number(item.goal || 0), 0),
    };
  }

  const linkedAthletes = (athletes || []).filter(
    (athlete) => athlete.campaignId === campaign.id && isVisibleAthlete(athlete)
  );

  return {
    athletesCount: linkedAthletes.length,
    raised: linkedAthletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0),
    goal: linkedAthletes.reduce((sum, athlete) => sum + Number(athlete.goal || 0), 0),
  };
}

function Pillar({ icon: Icon, title, text }) {
  return (
    <div className="flex gap-4 border-zinc-800 py-5 md:border-r md:px-6 md:last:border-r-0">
      <Icon size={44} strokeWidth={1.7} style={{ color: gold }} />
      <div>
        <h3 className="text-lg font-black uppercase leading-tight text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
      </div>
    </div>
  );
}

function StepCard({ number, icon: Icon, title, children }) {
  return (
    <div className="relative border border-zinc-800 bg-black p-6 text-center md:border-l-0 md:first:border-l">
      <div
        className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg font-black text-black"
        style={{ background: gold }}
      >
        {number}
      </div>

      <div className="mt-8 flex justify-center">
        <Icon size={42} strokeWidth={1.5} style={{ color: gold }} />
      </div>

      <h3 className="mt-5 text-sm font-black uppercase tracking-[0.12em]" style={{ color: gold }}>
        {title}
      </h3>

      <p className="mt-4 text-sm leading-6 text-zinc-300">{children}</p>
    </div>
  );
}

function CampaignCard({ campaign, athletes, participations, onOpenCampaign }) {
  const stats = campaignStats(campaign, athletes, participations);
  const percent = stats.goal ? Math.min(Math.round((stats.raised / stats.goal) * 100), 100) : 0;

  return (
    <article className="overflow-hidden border border-yellow-700/70 bg-black text-white">
      <div className="grid min-h-[420px] md:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col justify-between p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em]" style={{ color: gold }}>
              {campaign.type === "continuous" ? "Fonds annuel" : "Événement"}
            </p>

            <h3 className="mt-3 text-3xl font-black uppercase leading-tight">
              {campaign.title || "Campagne KinkoLab"}
            </h3>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              {campaign.description ||
                "Campagne de financement pour soutenir des athlètes canadiens en arts martiaux."}
            </p>
          </div>

          <div>
            <div className="mt-7 grid grid-cols-2 gap-4 border-y border-yellow-700/40 py-5">
              <div>
                <p className="text-2xl font-black">{stats.athletesCount}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Athlètes</p>
              </div>

              <div>
                <p className="text-2xl font-black">{money(stats.raised)}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">Amassés</p>
              </div>
            </div>

            <p className="mt-5 font-black">Objectif estimé : {money(stats.goal)}</p>

            <div className="mt-4">
              <ProgressBar value={percent} />
            </div>

            <button
              onClick={() => onOpenCampaign?.(campaign.id)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 px-5 py-4 font-black uppercase text-black"
              style={{ background: gold }}
            >
              En savoir plus <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#f4eadb] p-8 text-center text-zinc-950">
          <div>
            <p className="text-5xl font-black">{money(stats.raised)}</p>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em]" style={{ color: "#c9a345" }}>
              Amassés
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-600">
              Chaque hoodie supporter vendu attribue {money(HOODIE_SUPPORT_AMOUNT)} à l’athlète ou à la famille sélectionné(e).
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomePage({
  athletes = [],
  campaigns = [],
  participations = [],
  openCampaigns,
  openSignup,
}) {
  const visibleCampaigns = (campaigns || []).filter(isVisibleCampaign);
  const visibleAthletes = (athletes || []).filter(isVisibleAthlete);

  const totalRaisedFromParticipations = (participations || []).reduce(
    (sum, item) => sum + participationRaised(item),
    0
  );

  const fallbackRaised = visibleAthletes.reduce((sum, athlete) => sum + totalRaised(athlete), 0);
  const raised = totalRaisedFromParticipations || fallbackRaised;

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        className="relative min-h-[680px] overflow-hidden bg-black"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.82) 36%, rgba(0,0,0,0.18) 100%), url(${HERO_IMAGE_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center right",
        }}
      >
        <div className="mx-auto flex min-h-[680px] max-w-7xl items-center px-4 py-16 md:px-8">
          <div className="max-w-3xl">
            <div className="mb-8">
              <p className="text-2xl font-black uppercase tracking-wide">
                Kinko<span style={{ color: gold }}>Lab</span>
              </p>
              <p className="text-xs font-black uppercase tracking-[0.35em]" style={{ color: gold }}>
                Supporters
              </p>
            </div>

            <h1 className="text-5xl font-black uppercase leading-[0.95] md:text-8xl">
              KinkoLab
              <span className="mt-2 block text-5xl italic md:text-7xl" style={{ color: gold }}>
                Programme Athlètes
              </span>
            </h1>

            <h2 className="mt-8 max-w-2xl text-2xl font-black uppercase leading-tight md:text-3xl">
              Soutenir les athlètes canadiens qui pratiquent les arts martiaux.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-200">
              Chaque hoodie supporter acheté attribue {money(HOODIE_SUPPORT_AMOUNT)} à l’athlète ou à la famille sélectionné(e) pour sa campagne.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={openCampaigns}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-4 font-black uppercase text-black"
                style={{ background: gold }}
              >
                Découvrir les campagnes <ArrowRight size={18} />
              </button>

              <a
                href="#fonctionnement"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-500 px-6 py-4 font-black uppercase text-white hover:bg-white hover:text-black"
              >
                Comment ça fonctionne <ArrowRight size={18} />
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="border border-zinc-800 bg-black/60 p-4">
                <p className="text-3xl font-black">{visibleAthletes.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Athlètes</p>
              </div>

              <div className="border border-zinc-800 bg-black/60 p-4">
                <p className="text-3xl font-black">{visibleCampaigns.length}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Campagnes</p>
              </div>

              <div className="border border-zinc-800 bg-black/60 p-4">
                <p className="text-3xl font-black">{money(raised)}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Fonds suivis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-900 bg-black">
        <div className="mx-auto grid max-w-7xl px-4 md:grid-cols-4 md:px-8">
          <Pillar icon={Shirt} title="Des hoodies de qualité" text="Une campagne simple : des hoodies supporters pensés pour les familles, amis, dojos et partenaires." />
          <Pillar icon={HeartHandshake} title="Un impact concret" text={`Chaque hoodie vendu attribue ${money(HOODIE_SUPPORT_AMOUNT)} à l’athlète ou à la famille sélectionné(e).`} />
          <Pillar icon={UsersRound} title="Transparent et équitable" text="Les fonds sont suivis clairement dans le portail, par campagne, athlète et famille." />
          <Pillar icon={Leaf} title="Fier d’être canadien" text="Ensemble, soutenons des athlètes d’ici sur les scènes nationales et internationales." />
        </div>
      </section>

      <section className="bg-black px-4 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-4xl font-black uppercase">
            Nos programmes <span style={{ color: gold }}>en cours</span>
          </h2>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {visibleCampaigns.length === 0 && (
              <div className="border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400 lg:col-span-2">
                Aucune campagne active pour le moment.
              </div>
            )}

            {visibleCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                athletes={visibleAthletes}
                participations={participations}
                onOpenCampaign={openCampaigns}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnement" className="bg-black px-4 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-6xl font-black uppercase text-zinc-900 md:text-7xl">Comment fonctionne</p>
          <h2 className="-mt-4 text-4xl font-black uppercase italic md:text-5xl" style={{ color: gold }}>
            le programme supporters ?
          </h2>

          <div className="mt-14 grid gap-0 md:grid-cols-3 lg:grid-cols-6">
            <StepCard number="1" icon={BadgeCheck} title="Ouverture des campagnes">KinkoLab ouvre des campagnes de soutien pour certaines compétitions ou projets sportifs majeurs.</StepCard>
            <StepCard number="2" icon={ReceiptText} title="Inscription des athlètes">Les athlètes ou leur famille déposent une demande. L’acceptation n’est pas automatique.</StepCard>
            <StepCard number="3" icon={Store} title="Hoodie supporter">Pour le moment, le programme repose sur un hoodie supporter non personnalisé lié à une campagne.</StepCard>
            <StepCard number="4" icon={ShoppingBag} title="Achat des supporters">Le supporter achète un hoodie et sélectionne l’athlète ou la famille qu’il souhaite soutenir.</StepCard>
            <StepCard number="5" icon={WalletCards} title="Attribution des fonds">Chaque vente attribue clairement {money(HOODIE_SUPPORT_AMOUNT)} au profil sélectionné.</StepCard>
            <StepCard number="6" icon={CircleDollarSign} title="Aide aux athlètes">Les montants suivis servent à soutenir les objectifs sportifs, selon les règles et ressources disponibles.</StepCard>
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg bg-[#f4eadb] text-zinc-950">
              <div className="mx-auto w-fit px-12 py-4 text-center font-black uppercase italic text-black" style={{ background: gold }}>
                Produit actuel
              </div>
              <div className="grid gap-6 p-8 text-center md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div><h3 className="text-2xl font-black uppercase">Hoodie supporter</h3><p className="mt-4 leading-7">Un hoodie officiel associé à une campagne, vendu aux familles, amis, dojos et partenaires.</p></div>
                <div className="text-5xl font-black" style={{ color: gold }}>+</div>
                <div><h3 className="text-2xl font-black uppercase">Soutien ciblé</h3><p className="mt-4 leading-7">Au moment de l’achat, le supporter choisit l’athlète ou la famille soutenu(e).</p></div>
              </div>
              <div className="grid bg-[#d1aa4a] text-center text-sm font-black uppercase text-black md:grid-cols-2">
                <div className="p-5">Produit non personnalisé pour le moment</div>
                <div className="p-5">Personnalisation possible plus tard</div>
              </div>
              <p className="p-6 text-sm leading-6 text-zinc-600">Les produits personnalisés pourront être ajoutés dans une prochaine phase. Pour le lancement, le modèle reste volontairement simple : un hoodie supporter, une attribution claire de {money(HOODIE_SUPPORT_AMOUNT)} par vente.</p>
            </div>

            <div className="overflow-hidden rounded-lg bg-[#f4eadb] text-zinc-950">
              <div className="mx-auto w-fit px-12 py-4 text-center font-black uppercase italic text-black" style={{ background: gold }}>
                Exemple de répartition
              </div>
              <div className="grid gap-6 p-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="rounded-lg border border-yellow-700/30 bg-[#fff8ea] p-6 text-center"><h3 className="text-xl font-black uppercase">Ventes de hoodies</h3><p className="mt-4 text-2xl font-black">{money(HOODIE_SUPPORT_AMOUNT)}</p><p className="mt-3 text-sm leading-6 text-zinc-600">attribués par hoodie vendu.</p></div>
                <div className="text-center text-5xl font-black" style={{ color: gold }}>+</div>
                <div className="rounded-lg border border-yellow-700/30 bg-[#fff8ea] p-6 text-center"><h3 className="text-xl font-black uppercase">Profil sélectionné</h3><p className="mt-4 font-black">Athlète ou famille</p><p className="mt-3 text-sm leading-6 text-zinc-600">Le montant est suivi dans le portail de financement.</p></div>
              </div>
              <div className="p-8 text-center"><p className="text-4xl font-black">{money(raised)}</p><p className="mt-2 text-sm font-black uppercase tracking-[0.2em]" style={{ color: gold }}>suivis dans le portail</p></div>
            </div>
          </div>

          <div className="mt-12 grid gap-6 border border-yellow-700/70 p-6 md:grid-cols-4 md:items-center">
            <div><h3 className="text-2xl font-black uppercase" style={{ color: gold }}>Transparence totale</h3><p className="mt-3 text-sm leading-6 text-zinc-300">Nous visons un suivi clair des montants amassés, des règles applicables et des aides attribuées.</p></div>
            <div className="font-black uppercase">Règles claires et publiques</div>
            <div className="font-black uppercase">Suivi des fonds</div>
            <div className="font-black uppercase">Impact réel pour les athlètes</div>
          </div>

          <div className="mt-10 border-l-4 border-yellow-600 bg-zinc-950 p-6 text-sm leading-7 text-zinc-300">
            <strong style={{ color: gold }}>Note importante :</strong> Le Programme Athlètes KinkoLab est un programme privé de soutien associé à la vente de produits supporters. Les achats effectués sont des achats de produits, et non des dons de bienfaisance. Les montants affichés ou amassés ne garantissent pas automatiquement un versement direct à l’athlète. Les aides peuvent être attribuées selon les règles, modalités, ventes réalisées, coûts applicables et ressources disponibles du programme.
          </div>
        </div>
      </section>

      <section className="bg-[#f4eadb] px-4 py-16 text-zinc-950 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em]" style={{ color: "#b48b2c" }}>Rejoindre le programme</p>
            <h2 className="mt-3 text-4xl font-black uppercase">Un athlète ou une famille veut participer ?</h2>
            <p className="mt-4 max-w-3xl leading-7 text-zinc-700">Déposez une demande pour créer une page athlète, rejoindre une campagne active et centraliser votre visibilité, vos nouvelles, vos événements et votre financement.</p>
          </div>
          <button onClick={openSignup} className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-4 font-black uppercase text-black" style={{ background: gold }}>
            Soumettre une candidature <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}
