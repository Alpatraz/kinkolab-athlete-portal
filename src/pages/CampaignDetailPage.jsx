import { ArrowLeft, ShoppingBag, UserPlus } from "lucide-react";
import { gold, money } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import AthleteCard from "../components/AthleteCard";

function participationRaised(participation) {
  return (
    Number(participation?.raisedShop || 0) +
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
}

export default function CampaignDetailPage({
  campaign,
  athletes = [],
  participations = [],
  goBack,
  onOpenAthlete,
  openSignup,
}) {
  const campaignParticipations = participations.filter(
    (participation) =>
      participation.campaignId === campaign.id &&
      participation.status !== "archivée" &&
      participation.status !== "suspendue"
  );

  const linked = campaignParticipations
    .map((participation) => {
      const athlete = athletes.find((item) => item.id === participation.athleteId);
      if (!athlete) return null;

      return {
        ...athlete,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        goal: Number(participation.goal || athlete.goal || 0),
        raisedShop: Number(participation.raisedShop || 0),
        raisedOffline: Number(participation.raisedOffline || 0),
        raisedSponsorship: Number(participation.raisedSponsorship || 0),
        fundingMode: participation.fundingMode,
        fundingGroupId: participation.fundingGroupId,
      };
    })
    .filter(Boolean);

  const raised = campaignParticipations.reduce(
    (sum, participation) => sum + participationRaised(participation),
    0
  );

  const goal = campaignParticipations.reduce(
    (sum, participation) => sum + Number(participation.goal || 0),
    0
  );

  const collectionUrl =
    campaign.collectionUrl ||
    campaign.shopifyCollectionUrl ||
    (campaign.collectionHandle
      ? `https://kinkolab.com/collections/${campaign.collectionHandle}`
      : campaign.shopifyUrl || "#");

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={goBack}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={17} /> Retour aux campagnes
        </button>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: gold }}
          >
            Page campagne
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            {campaign.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            {campaign.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={collectionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-black"
              style={{ background: gold }}
            >
              <ShoppingBag size={18} /> Voir la collection Shopify
            </a>

            <button
              onClick={openSignup}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900"
            >
              <UserPlus size={18} /> Demander à participer
            </button>
          </div>

          <div className="mt-8 rounded-[2rem] bg-zinc-900 p-6">
            <h2 className="text-2xl font-black">Résumé campagne</h2>

            <div className="mt-5">
              <ProgressBar value={goal ? Math.round((raised / goal) * 100) : 0} />
            </div>

            <p className="mt-3 text-sm text-zinc-400">
              {money(raised)} suivis sur {money(goal)} d’objectifs cumulés.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-3xl font-black">
            Athlètes reliés à cette campagne
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {linked.length === 0 && (
              <p className="text-zinc-400">
                Aucun athlète relié à cette campagne pour le moment.
              </p>
            )}

            {linked.map((athlete) => (
              <AthleteCard
                key={`${athlete.id}-${athlete.fundingGroupId || campaign.id}`}
                athlete={athlete}
                campaigns={[campaign]}
                onOpen={onOpenAthlete}
                onOpenCampaign={() => {}}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
