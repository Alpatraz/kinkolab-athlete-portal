import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  MapPin,
  Medal,
  PlayCircle,
  ShoppingBag,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { gold, money, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import AthleteCard from "../components/AthleteCard";
import CampaignCountdown from "../components/CampaignCountdown";
import { useLanguage } from "../context/LanguageContext";
import { localizedField } from "../utils/localizedContent";
import RichText from "../components/RichText";
import {
  listFromField,
  safeExternalUrl,
  videoEmbedUrl,
  withCampaignDefaults,
} from "../utils/campaignDetails";

const DEFAULT_CAMPAIGN_BANNER =
  "/images/kinkolab-campaign-default-banner.png";

function contributionAmount(contribution) {
  return Number(
    contribution?.amountReserved ||
    contribution?.reservedAmount ||
    0
  );
}

function isActiveContribution(contribution) {
  const status = String(
    contribution?.status || "reserved"
  ).toLowerCase();

  return ![
    "cancelled",
    "annulé",
    "annule",
    "refunded",
    "remboursé",
    "rembourse",
  ].includes(status);
}

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

function CampaignFact({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black">
        <Icon size={20} style={{ color: gold }} />
      </div>
      <div>
        <dt className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
        <dd className="mt-1 leading-6 text-white">{value}</dd>
      </div>
    </div>
  );
}

export default function CampaignDetailPage({
  campaign,
  campaigns = [],
  athletes = [],
  participations = [],
  contributions = [],
  goBack,
  onOpenAthlete,
  openSignup,
  onOpenCampaign,
}) {
  const { language } = useLanguage();
  const signupButtonRef = useRef(null);
  const [showStickySignup, setShowStickySignup] = useState(false);
  campaign = withCampaignDefaults(campaign);

  const pageCopy = language === "en" ? {
    about: "About the event",
    details: "Event details",
    dates: "Dates",
    campaignPeriod: "Fundraising period",
    location: "Location",
    venue: "Venue",
    audience: "Who this campaign is for",
    disciplines: "Disciplines",
    federation: "Federation / organization",
    usefulLinks: "Official links and social media",
    website: "Official website",
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    media: "Images and videos",
    video: "Campaign video",
    gallery: "Photo gallery",
    joinCampaign: "Apply to this campaign",
    editions: "Previous editions and results",
    results: "Results",
    officialResults: "View official results",
    calendar: "View in the KinkoLab competition calendar",
    registration: "Official competition registration",
  } : {
    about: "Comprendre l’événement",
    details: "Informations sur l’événement",
    dates: "Dates",
    campaignPeriod: "Période de campagne",
    location: "Lieu",
    venue: "Site de compétition",
    audience: "Qui est concerné",
    disciplines: "Disciplines",
    federation: "Fédération / organisation",
    usefulLinks: "Liens officiels et réseaux sociaux",
    website: "Site officiel",
    facebook: "Facebook",
    instagram: "Instagram",
    youtube: "YouTube",
    media: "Images et vidéos",
    video: "Vidéo de la campagne",
    gallery: "Galerie photos",
    joinCampaign: "S’inscrire à cette campagne",
    editions: "Éditions précédentes et résultats",
    results: "Résultats",
    officialResults: "Voir les résultats officiels",
    calendar: "Voir dans le calendrier des compétitions KinkoLab",
    registration: "Inscription officielle à la compétition",
  };

  useEffect(() => {
    const button = signupButtonRef.current;
    if (!button) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickySignup(!entry.isIntersecting),
      { threshold: 0.2 }
    );

    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const campaignTitle = localizedField(campaign, "title", language);
  const campaignDescription = localizedField(campaign, "description", language);
  const overview = localizedField(campaign, "overview", language);
  const audience = localizedField(campaign, "audience", language);
  const disciplines = localizedField(campaign, "disciplines", language);
  const country = language === "en" ? campaign.countryEn || campaign.country : campaign.country;
  const location = [campaign.city, country].filter(Boolean).join(", ");
  const dates = campaign.eventStartDate && campaign.eventEndDate
    ? `${campaign.eventStartDate} — ${campaign.eventEndDate}`
    : campaign.eventDate || campaign.eventStartDate || "—";
  const campaignPeriod = campaign.startDate && campaign.endDate
    ? `${campaign.startDate} — ${campaign.endDate}`
    : campaign.startDate || "";
  const galleryImages = listFromField(campaign.galleryImageUrls)
    .map(safeExternalUrl)
    .filter(Boolean);
  const embedUrl = videoEmbedUrl(campaign.videoUrl);
  const socialLinks = [
    { label: pageCopy.calendar, url: campaign.calendarUrl, icon: CalendarDays },
    { label: pageCopy.registration, url: campaign.registrationUrl, icon: ExternalLink },
    { label: pageCopy.website, url: campaign.websiteUrl, icon: Globe2 },
    { label: pageCopy.facebook, url: campaign.facebookUrl, icon: ExternalLink },
    { label: pageCopy.instagram, url: campaign.instagramUrl, icon: ExternalLink },
    { label: pageCopy.youtube, url: campaign.youtubeUrl, icon: PlayCircle },
  ].filter((item) => safeExternalUrl(item.url));
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
  const seriesId = campaign.seriesId || "";
  const seriesEditions = campaigns
    .filter((item) => seriesId && item.seriesId === seriesId)
    .sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  const resultsSummary = language === "en"
    ? campaign.resultsSummaryEn || campaign.resultsSummaryFr
    : campaign.resultsSummaryFr || campaign.resultsSummaryEn;

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
            {campaignTitle}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200">
            {campaignDescription}
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
              ref={signupButtonRef}
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
          <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]" data-i18n-managed>
            <article className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
              <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: gold }}>
                {pageCopy.about}
              </p>
              <h2 className="mt-3 text-3xl font-black md:text-4xl">{campaignTitle}</h2>
              <div className="mt-6 space-y-5 text-lg leading-8 text-zinc-300">
                <RichText value={overview || campaignDescription} className="space-y-5" paragraphClassName="leading-8" />
                {audience && (
                  <div className="rounded-2xl border border-yellow-700/40 bg-yellow-950/20 p-5">
                    <h3 className="font-black text-white">{pageCopy.audience}</h3>
                    <RichText value={audience} className="mt-2 space-y-3 text-base text-yellow-100" paragraphClassName="leading-7" />
                  </div>
                )}
              </div>
            </article>

            <aside className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-8">
              <h2 className="text-2xl font-black">{pageCopy.details}</h2>
              <div className="mt-4"><CampaignCountdown endDate={campaign.endDate} /></div>
              <dl className="mt-6 space-y-5">
                <CampaignFact icon={CalendarDays} label={pageCopy.dates} value={dates} />
                {campaignPeriod && <CampaignFact icon={CalendarDays} label={pageCopy.campaignPeriod} value={campaignPeriod} />}
                <CampaignFact icon={MapPin} label={pageCopy.location} value={location || "—"} />
                <CampaignFact icon={Building2} label={pageCopy.venue} value={campaign.venueName || "—"} />
                <CampaignFact icon={Medal} label={pageCopy.disciplines} value={disciplines || "—"} />
                <CampaignFact icon={Users} label={pageCopy.federation} value={campaign.federation || campaign.organizer || "—"} />
              </dl>
            </aside>
          </section>

          {socialLinks.length > 0 && (
            <section className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-8" data-i18n-managed>
              <h2 className="text-2xl font-black">{pageCopy.usefulLinks}</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map(({ label, url, icon: Icon }) => (
                  <a key={label} href={safeExternalUrl(url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-black px-5 py-3 font-black hover:border-yellow-700">
                    <Icon size={19} style={{ color: gold }} />
                    {label}
                    <ExternalLink size={15} className="text-zinc-500" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {(embedUrl || galleryImages.length > 0) && (
            <section className="mt-10" data-i18n-managed>
              <p className="text-sm font-black uppercase tracking-[0.3em]" style={{ color: gold }}>{pageCopy.media}</p>
              {embedUrl && (
                <div className="mt-5 overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-3 border-b border-zinc-800 p-5"><PlayCircle style={{ color: gold }} /><h2 className="text-xl font-black">{pageCopy.video}</h2></div>
                  <div className="aspect-video">
                    <iframe className="h-full w-full" src={embedUrl} title={pageCopy.video} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                </div>
              )}
              {galleryImages.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-3"><ImageIcon style={{ color: gold }} /><h2 className="text-2xl font-black">{pageCopy.gallery}</h2></div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {galleryImages.map((imageUrl, index) => <img key={imageUrl} src={imageUrl} alt={`${campaignTitle} — ${index + 1}`} loading="lazy" className="h-64 w-full rounded-2xl border border-zinc-800 object-cover" />)}
                  </div>
                </div>
              )}
            </section>
          )}

          {(seriesEditions.length > 1 || campaign.resultsPublished) && (
            <section className="mt-10 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-8" data-i18n-managed>
              <div className="flex items-center gap-3"><Trophy style={{ color: gold }} /><h2 className="text-2xl font-black">{pageCopy.editions}</h2></div>
              {seriesEditions.length > 1 && <div className="mt-5 flex flex-wrap gap-3">{seriesEditions.map((edition) => <button key={edition.id} type="button" onClick={() => onOpenCampaign?.(edition.id)} className={`rounded-2xl px-5 py-3 font-black ${edition.id === campaign.id ? "text-black" : "border border-zinc-700 bg-black text-white"}`} style={edition.id === campaign.id ? { background: gold } : undefined}>{edition.year || edition.title}{edition.resultsPublished ? " · ✓" : ""}</button>)}</div>}
              {campaign.resultsPublished && <div id="results" className="mt-7 scroll-mt-28 rounded-2xl border border-yellow-700/40 bg-black p-5"><h3 className="text-xl font-black">{pageCopy.results} {campaign.year}</h3>{resultsSummary && <p className="mt-3 whitespace-pre-line leading-7 text-zinc-300">{resultsSummary}</p>}{safeExternalUrl(campaign.resultsUrl) && <a href={safeExternalUrl(campaign.resultsUrl)} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-3 font-black text-black" style={{ background: gold }}>{pageCopy.officialResults}<ExternalLink size={16} /></a>}</div>}
            </section>
          )}

          <section className="mt-10 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
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
  participation={campaignParticipations.find((item) => item.athleteId === athlete.id) || (athlete.campaignId === campaign.id ? { campaignId: campaign.id, goal: athlete.goal } : null)}
  contributions={contributions}
  onOpen={onOpenAthlete}
  onOpenCampaign={() => {}}
/>
              ))}
            </div>
          </section>
        </div>
      </section>

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-yellow-700/50 bg-black/95 p-3 shadow-[0_-12px_35px_rgba(0,0,0,0.65)] backdrop-blur transition duration-200 md:left-auto md:right-6 md:bottom-6 md:w-auto md:rounded-2xl md:border ${showStickySignup ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0 md:translate-y-4"}`}
        aria-hidden={!showStickySignup}
        data-i18n-managed
      >
        <button
          type="button"
          onClick={openSignup}
          tabIndex={showStickySignup ? 0 : -1}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-black text-black md:w-auto"
          style={{ background: gold }}
        >
          <UserPlus size={19} />
          {pageCopy.joinCampaign}
        </button>
      </div>
    </main>
  );
}
