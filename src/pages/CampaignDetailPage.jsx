import { ArrowLeft, ExternalLink, ShoppingBag, UserPlus } from "lucide-react";
import { gold, money, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import AthleteCard from "../components/AthleteCard";

const DEFAULT_CAMPAIGN_BANNER =
  "/images/kinkolab-campaign-default-banner.png";

function getCampaignProducts(campaign) {
  if (Array.isArray(campaign?.products)) return campaign.products;

  return [];
}

function productImage(product) {
  return product.imageUrl || product.image || product.featuredImage || "";
}

function productUrl(product) {
  return product.shopifyUrl || product.url || product.productUrl || "";
}

function productPrice(product) {
  if (product.price === undefined || product.price === null || product.price === "") {
    return "";
  }

  return money(Number(product.price || 0));
}

function productReservedAmount(product) {
  const value =
    product.reservedAmount ??
    product.amountReserved ??
    product.kinkoReservedAmount ??
    product.supportAmount ??
    20;

  return money(Number(value || 0));
}

export default function CampaignDetailPage({
  campaign,
  athletes = [],
  participations = [],
  contributions = [],
  goBack,
  onOpenAthlete,
  openSignup,
}) {
  const linkedAthletes = athletes.filter((athlete) => {
    const directMatch = athlete.campaignId === campaign.id;

    const participationMatch = (participations || []).some(
      (participation) =>
        participation.athleteId === athlete.id &&
        participation.campaignId === campaign.id &&
        participation.status !== "archivée" &&
        participation.status !== "archivé" &&
        participation.status !== "archive" &&
        participation.status !== "suspendue" &&
        participation.status !== "suspendu"
    );

    return directMatch || participationMatch;
  });

  const campaignParticipations = (participations || []).filter(
    (participation) =>
      participation.campaignId === campaign.id &&
      participation.status !== "archivée" &&
      participation.status !== "archivé" &&
      participation.status !== "archive" &&
      participation.status !== "suspendue" &&
      participation.status !== "suspendu"
  );

  const raisedFromContributions = (contributions || [])
  .filter(
    (contribution) =>
      isActiveContribution(contribution) &&
      contribution.campaignId === campaign.id
  )
  .reduce(
    (sum, contribution) =>
      sum + contributionAmount(contribution),
    0
  );

const raisedManual = campaignParticipations.reduce(
  (sum, participation) =>
    sum +
    Number(participation.raisedOffline || 0) +
    Number(participation.raisedSponsorship || 0),
  0
);

  const goalFromParticipations = campaignParticipations.reduce(
    (sum, participation) => sum + Number(participation.goal || 0),
    0
  );

  const raised = raisedFromContributions + raisedManual;

  const goal =
    goalFromParticipations ||
    linkedAthletes.reduce((sum, athlete) => sum + Number(athlete.goal || 0), 0);

  const progress = goal ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
  const products = getCampaignProducts(campaign);

  const shopifyUrl =
    campaign.shopifyCollectionUrl ||
    (campaign.collectionHandle
      ? `https://kinkolab.com/collections/${campaign.collectionHandle}`
      : "");

  const bannerUrl =
    campaign.bannerImageUrl ||
    campaign.heroImageUrl ||
    campaign.imageUrl ||
    DEFAULT_CAMPAIGN_BANNER;

  return (
    <main className="min-h-screen bg-black text-white">
      <section
        className="relative min-h-[420px] border-b border-yellow-700/40 bg-black"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.78) 48%, rgba(0,0,0,0.22) 100%), url(${bannerUrl})`,
          backgroundPosition: "center right",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[420px] max-w-7xl flex-col justify-center px-4 py-10 md:px-8">
          <button
            type="button"
            onClick={goBack}
            className="mb-8 flex w-fit items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={17} />
            Retour aux campagnes
          </button>

          <p
            className="text-sm font-black uppercase tracking-[0.35em]"
            style={{ color: gold }}
          >
            Page campagne
          </p>

          <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-tight md:text-7xl">
            {campaign.title}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200">
            {campaign.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {shopifyUrl && (
              <a
                href={shopifyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-black"
                style={{ background: gold }}
              >
                <ShoppingBag size={18} />
                Voir la collection Shopify
              </a>
            )}

            <button
              type="button"
              onClick={openSignup}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900"
            >
              <UserPlus size={18} />
              Demander à participer
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
            <h2 className="text-2xl font-black">Résumé campagne</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-black p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Athlètes
                </p>
                <p className="mt-2 text-3xl font-black">{linkedAthletes.length}</p>
              </div>

              <div className="rounded-2xl bg-black p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Fonds suivis
                </p>
                <p className="mt-2 text-3xl font-black">{money(raised)}</p>
              </div>

              <div className="rounded-2xl bg-black p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                  Objectif cumulé
                </p>
                <p className="mt-2 text-3xl font-black" style={{ color: gold }}>
                  {money(goal)}
                </p>
              </div>
            </div>

            <div className="mt-7">
              <ProgressBar value={progress} />
            </div>

            <p className="mt-3 text-sm text-zinc-400">
              {money(raised)} suivis sur {money(goal)} d’objectifs cumulés.
            </p>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p
                  className="text-sm font-black uppercase tracking-[0.3em]"
                  style={{ color: gold }}
                >
                  Boutique supporters
                </p>
                <h2 className="mt-2 text-4xl font-black uppercase">
                  Produits de la campagne
                </h2>
              </div>

              {shopifyUrl && (
                <a
                  href={shopifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900"
                >
                  Ouvrir Shopify
                  <ExternalLink size={17} />
                </a>
              )}
            </div>

            {products.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
                Aucun produit n’est encore lié à cette campagne.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => {
                  const image = productImage(product);
                  const url = productUrl(product);

                  return (
                    <article
                      key={product.id || product.handle || product.title || index}
                      className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950"
                    >
                      <div className="flex h-64 items-center justify-center bg-black">
                        {image ? (
                          <img
                            src={image}
                            alt={product.title || "Produit KinkoLab"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBag size={56} style={{ color: gold }} />
                        )}
                      </div>

                      <div className="p-5">
                        <p
                          className="text-xs font-black uppercase tracking-[0.22em]"
                          style={{ color: gold }}
                        >
                          Produit supporter
                        </p>

                        <h3 className="mt-2 text-2xl font-black">
                          {product.title || "Produit KinkoLab"}
                        </h3>

                        {product.description && (
                          <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-black p-4">
                            <p className="text-xs uppercase text-zinc-500">Prix</p>
                            <p className="mt-1 text-xl font-black">
                              {productPrice(product) || "Voir Shopify"}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-black p-4">
                            <p className="text-xs uppercase text-zinc-500">
                              Remis
                            </p>
                            <p className="mt-1 text-xl font-black" style={{ color: gold }}>
                              {productReservedAmount(product)}
                            </p>
                          </div>
                        </div>

                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black text-black"
                            style={{ background: gold }}
                          >
                            Voir le produit
                            <ExternalLink size={17} />
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-3xl font-black">Athlètes reliés à cette campagne</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {linkedAthletes.length === 0 && (
                <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-zinc-400 md:col-span-3">
                  Aucun athlète public n’est encore relié à cette campagne.
                </div>
              )}

              {linkedAthletes.map((athlete) => (
                <AthleteCard
                  key={athlete.id}
                  athlete={athlete}
                  campaigns={[campaign]}
                  onOpen={onOpenAthlete}
                  onOpenCampaign={() => {}}
                />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
