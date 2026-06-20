import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Gift,
  ReceiptText,
  HeartHandshake,
  Mail,
  Megaphone,
  MessageCircle,
  Plane,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Users,
} from "lucide-react";

import { cn, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "../components/ProgressBar";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";

function SectionTitle({ icon: Icon, kicker, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {Icon && <Icon size={22} style={{ color: gold }} />}
        <div>
          {kicker && (
            <p
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: gold }}
            >
              {kicker}
            </p>
          )}
          <h2 className="text-2xl font-black text-white md:text-3xl">
            {title}
          </h2>
        </div>
      </div>

      {children && (
        <p className="mt-3 text-sm leading-6 text-zinc-400">{children}</p>
      )}
    </div>
  );
}

function CampaignStep({ step, index }) {
  const done = step?.status === "completed";
  const inProgress = step?.status === "in_progress";

  return (
    <div className="relative flex gap-4 rounded-2xl bg-black p-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black",
            done && "border-emerald-500 bg-emerald-500 text-black",
            inProgress && "border-amber-400 bg-amber-400 text-black",
            !done &&
              !inProgress &&
              "border-zinc-700 bg-zinc-950 text-zinc-500"
          )}
        >
          {done ? <CheckCircle2 size={18} /> : index + 1}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-black text-white">{step?.label || "Étape"}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {step?.note || "À compléter"}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase text-zinc-600">
              {done ? "Complété" : inProgress ? "En cours" : "À venir"}
            </p>

            {step?.date && (
              <p className="mt-1 text-xs text-zinc-500">{step.date}</p>
            )}

            {step?.amount !== null && step?.amount !== undefined && (
              <p className="mt-1 text-sm font-black" style={{ color: gold }}>
                {money(step.amount)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NeedRow({ item }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-black p-4">
      <span className="text-sm font-bold text-zinc-200">
        {item?.label || "Besoin"}
      </span>
      <span className="text-sm font-black" style={{ color: gold }}>
        {money(item?.amount || 0)}
      </span>
    </div>
  );
}

function SponsorCard({ sponsor }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-2xl">
          {sponsor?.logo ? (
            <img
              src={sponsor.logo}
              alt={sponsor.name || "Sponsor"}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            "🤝"
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs font-bold uppercase" style={{ color: gold }}>
            {sponsor?.level || "Partenaire"}
          </p>

          <h3 className="mt-1 text-lg font-black text-white">
            {sponsor?.name || "Partenaire"}
          </h3>

          {sponsor?.message && (
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {sponsor.message}
            </p>
          )}

          {sponsor?.amount !== null && sponsor?.amount !== undefined && (
            <p className="mt-2 text-sm font-bold text-zinc-300">
              Contribution : {money(sponsor.amount)}
            </p>
          )}

          {sponsor?.link && (
            <a
              href={sponsor.link}
              className="mt-3 inline-block text-sm font-bold text-zinc-300 hover:text-white"
            >
              Voir le partenaire
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function contributionAmount(contribution) {
  return Number(contribution?.amountReserved || contribution?.reservedAmount || 0);
}

function contributionDate(contribution) {
  const value = contribution?.createdAt;

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("fr-CA");
  }

  if (contribution?.displayDate) return contribution.displayDate;
  if (contribution?.orderCreatedAt) return String(contribution.orderCreatedAt).slice(0, 10);

  return "";
}

function ContributionCard({ contribution }) {
  const amount = contributionAmount(contribution);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: gold }}>
            {contributionDate(contribution) || "Date à confirmer"}
          </p>

          <h3 className="mt-2 text-lg font-black text-white">
            {contribution.productName || contribution.productTitle || "Contribution boutique"}
          </h3>

          <p className="mt-1 text-sm text-zinc-400">
            {contribution.customerName || contribution.customerEmail || "Supporteur"}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-right">
          <p className="text-xs font-black uppercase text-emerald-400">
            Montant remis
          </p>
          <p className="text-2xl font-black text-emerald-300">
            + {money(amount)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-950 p-3">
          <p className="text-xs uppercase text-zinc-500">Campagne</p>
          <p className="mt-1 text-sm font-black text-zinc-200">
            {contribution.campaignTitle || contribution.campaignId || "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-950 p-3">
          <p className="text-xs uppercase text-zinc-500">Soutien</p>
          <p className="mt-1 text-sm font-black text-zinc-200">
            {contribution.supportLabel ||
              contribution.athleteName ||
              contribution.familyName ||
              "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-950 p-3">
          <p className="text-xs uppercase text-zinc-500">Commande</p>
          <p className="mt-1 text-sm font-black text-zinc-200">
            {contribution.orderName || contribution.orderId || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

function isInactiveStatus(status) {
  return ["suspendue", "suspendu", "archivée", "archivé", "archive"].includes(
    String(status || "").toLowerCase()
  );
}

function uniqueById(items = []) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}


export default function AthletePublicPage({
  athlete,
  athletes = [],
  campaigns = [],
  participations = [],
  updates = [],
  wallMessages = [],
  setWallMessages,
  goBack,
  onOpenCampaign,
}) {
  const safeAthlete = athlete || {};

  const approvedUpdates = (updates || []).filter(
    (item) => item?.athleteId === safeAthlete.id
  );

  const approvedMessages = (wallMessages || []).filter(
    (item) =>
      item?.athleteId === safeAthlete.id && item?.status === "approuvé"
  );

  const [message, setMessage] = useState({
    name: "",
    message: "",
  });

  const [messageOpen, setMessageOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contributions, setContributions] = useState([]);

  const needs = safeAthlete.needs || [];
  const sponsors = safeAthlete.sponsors || [];
  const fundingEvents = safeAthlete.fundingEvents || [];
  const steps = safeAthlete.steps || [];
  const supportSteps = safeAthlete.supportSteps || [];

  function isFamilyParticipation(participation) {
    return Boolean(
      participation &&
        safeAthlete.familyId &&
        participation.familyId === safeAthlete.familyId
    );
  }

  const athleteParticipations = uniqueById(
    (participations || []).filter((participation) => {
      if (!participation || isInactiveStatus(participation.status)) return false;

      const directAthlete = participation.athleteId === safeAthlete.id;
      const sameFamily = isFamilyParticipation(participation);

      return directAthlete || sameFamily;
    })
  );

  const familyParticipations = athleteParticipations.filter((participation) =>
    isFamilyParticipation(participation)
  );

  const primaryFamilyParticipation = familyParticipations[0] || null;

  useEffect(() => {
    if (!safeAthlete?.id) return;

    const unsubscribes = [];

    const byAthleteQuery = query(
      collection(db, "contributions"),
      where("athleteId", "==", safeAthlete.id)
    );

    const byAthleteUnsubscribe = onSnapshot(byAthleteQuery, (snapshot) => {
      const athleteData = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));

      setContributions((current) => {
        const familyOnly = current.filter(
          (item) => item.familyId && item.familyId === safeAthlete.familyId
        );

        const merged = [...athleteData, ...familyOnly];
        const unique = Array.from(
          new Map(merged.map((item) => [item.id, item])).values()
        );

        unique.sort((a, b) => {
          const dateA =
            a.createdAt?.seconds ||
            (a.orderCreatedAt ? Date.parse(a.orderCreatedAt) / 1000 : 0);
          const dateB =
            b.createdAt?.seconds ||
            (b.orderCreatedAt ? Date.parse(b.orderCreatedAt) / 1000 : 0);
          return dateB - dateA;
        });

        return unique;
      });
    });

    unsubscribes.push(byAthleteUnsubscribe);

    if (safeAthlete.familyId) {
      const byFamilyQuery = query(
        collection(db, "contributions"),
        where("familyId", "==", safeAthlete.familyId)
      );

      const byFamilyUnsubscribe = onSnapshot(byFamilyQuery, (snapshot) => {
        const familyData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setContributions((current) => {
          const athleteOnly = current.filter(
            (item) => item.athleteId === safeAthlete.id
          );

          const merged = [...athleteOnly, ...familyData];
          const unique = Array.from(
            new Map(merged.map((item) => [item.id, item])).values()
          );

          unique.sort((a, b) => {
            const dateA =
              a.createdAt?.seconds ||
              (a.orderCreatedAt ? Date.parse(a.orderCreatedAt) / 1000 : 0);
            const dateB =
              b.createdAt?.seconds ||
              (b.orderCreatedAt ? Date.parse(b.orderCreatedAt) / 1000 : 0);
            return dateB - dateA;
          });

          return unique;
        });
      });

      unsubscribes.push(byFamilyUnsubscribe);
    }

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [safeAthlete?.id, safeAthlete?.familyId]);

  function participationRaised(participation) {
    if (!participation) return 0;

    const familyMode = isFamilyParticipation(participation);

    const matchingContributions = (contributions || []).filter((contribution) => {
      const sameCampaign = contribution.campaignId === participation.campaignId;
      if (!sameCampaign) return false;

      if (familyMode) {
        const sameFamily =
          safeAthlete.familyId && contribution.familyId === safeAthlete.familyId;

        const sameFundingGroup =
          participation.fundingGroupId &&
          contribution.fundingGroupId === participation.fundingGroupId;

        return sameFamily || sameFundingGroup;
      }

      return contribution.athleteId === participation.athleteId;
    });

    const contributionTotal = matchingContributions.reduce(
      (sum, contribution) => sum + contributionAmount(contribution),
      0
    );

    const matchingParticipations = familyMode
      ? (participations || []).filter(
          (item) =>
            item.campaignId === participation.campaignId &&
            item.familyId === safeAthlete.familyId &&
            !isInactiveStatus(item.status)
        )
      : [participation];

    const manualTotal = matchingParticipations.reduce(
      (sum, item) =>
        sum +
        Number(item.raisedOffline || 0) +
        Number(item.raisedSponsorship || 0),
      0
    );

    return contributionTotal + manualTotal;
  }

  function participationGoal(participation) {
    if (!participation) return 0;

    if (isFamilyParticipation(participation)) {
      return (participations || [])
        .filter(
          (item) =>
            item.campaignId === participation.campaignId &&
            item.familyId === safeAthlete.familyId &&
            !isInactiveStatus(item.status)
        )
        .reduce((sum, item) => sum + Number(item.goal || 0), 0);
    }

    return Number(participation.goal || 0);
  }

  function participationCampaign(participation) {
    return (campaigns || []).find(
      (campaign) => campaign.id === participation.campaignId
    );
  }

  function familyGroupAthletes(participation) {
    if (!participation || !safeAthlete.familyId) return [];

    const groupParticipations = (participations || []).filter(
      (item) =>
        item.campaignId === participation.campaignId &&
        item.familyId === safeAthlete.familyId &&
        !isInactiveStatus(item.status)
    );

    return uniqueById(
      groupParticipations
        .map((item) =>
          (athletes || []).find(
            (athleteItem) => athleteItem.id === item.athleteId
          )
        )
        .filter(Boolean)
    );
  }

  function buildParticipationSupportUrl(participation, campaign) {
    const baseUrl =
      participation.shopifyUrl ||
      campaign?.shopifyUrl ||
      safeAthlete.shopifyUrl ||
      "https://kinkolab.com";

    const url = new URL(baseUrl, window.location.origin);

    url.searchParams.set("campaignId", participation.campaignId || "");
    url.searchParams.set("participationId", participation.id || "");
    url.searchParams.set("fundingMode", isFamilyParticipation(participation) ? "family" : participation.fundingMode || "individual");
    url.searchParams.set("fundingGroupId", participation.fundingGroupId || "");
    url.searchParams.set("athleteId", participation.athleteId || safeAthlete.id || "");

    if (participation.familyId) {
      url.searchParams.set("familyId", participation.familyId);
    }

    return url.toString();
  }

  function buildParticipationSponsorUrl(participation, campaign) {
    const baseUrl =
      participation.sponsorUrl ||
      campaign?.sponsorUrl ||
      safeAthlete.sponsorUrl ||
      safeAthlete.shopifyUrl ||
      "https://kinkolab.com";

    const url = new URL(baseUrl, window.location.origin);

    url.searchParams.set("campaignId", participation.campaignId || "");
    url.searchParams.set("participationId", participation.id || "");
    url.searchParams.set("fundingMode", isFamilyParticipation(participation) ? "family" : participation.fundingMode || "individual");
    url.searchParams.set("fundingGroupId", participation.fundingGroupId || "");
    url.searchParams.set("athleteId", participation.athleteId || safeAthlete.id || "");

    if (participation.familyId) {
      url.searchParams.set("familyId", participation.familyId);
    }

    return url.toString();
  }

  const firstName =
    safeAthlete.firstName ||
    (safeAthlete.name || "l’athlète").split(" ")[0];

  function supportButtonLabel(participation, campaign) {
    if (isFamilyParticipation(participation)) {
      return `Soutenir la famille ${participation.familyName || safeAthlete.familyName || ""} pour ${campaign?.title || participation.campaignTitle || "cette campagne"}`;
    }

    return `Soutenir ${firstName} pour ${campaign?.title || participation.campaignTitle || "cette campagne"}`;
  }

  function sponsorButtonLabel(participation, campaign) {
    if (isFamilyParticipation(participation)) {
      return `Commanditer la famille pour ${campaign?.title || participation.campaignTitle || "cette campagne"}`;
    }

    return `Commanditer ${firstName} pour ${campaign?.title || participation.campaignTitle || "cette campagne"}`;
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const legacyRaised = totalRaised(safeAthlete);
  const legacySponsorship = Number(safeAthlete.raisedSponsorship || 0);
  const legacyRemaining = Math.max(Number(safeAthlete.goal || 0) - legacyRaised, 0);
  const legacyProgress =
    Number(safeAthlete.goal || 0) > 0
      ? Math.min(Math.round((legacyRaised / Number(safeAthlete.goal || 0)) * 100), 100)
      : 0;

  const mainCampaign = primaryFamilyParticipation
    ? participationCampaign(primaryFamilyParticipation)
    : null;

  const mainFamilyAthletes = primaryFamilyParticipation
    ? familyGroupAthletes(primaryFamilyParticipation)
    : [];

  const mainFamilyGoal = primaryFamilyParticipation
    ? participationGoal(primaryFamilyParticipation)
    : 0;

  const mainFamilyRaised = primaryFamilyParticipation
    ? participationRaised(primaryFamilyParticipation)
    : 0;

  const mainFamilyRemaining = Math.max(mainFamilyGoal - mainFamilyRaised, 0);

  const mainFamilyPercent =
    mainFamilyGoal > 0
      ? Math.min(Math.round((mainFamilyRaised / mainFamilyGoal) * 100), 100)
      : 0;

  const contributionsTotal = contributions.reduce(
    (sum, contribution) => sum + contributionAmount(contribution),
    0
  );

  function submitMessage() {
    if (!message.name.trim() || !message.message.trim()) return;

    if (!setWallMessages) return;

    setWallMessages([
      {
        id: Date.now(),
        athleteId: safeAthlete.id,
        name: message.name,
        message: message.message,
        date: new Date().toISOString().slice(0, 10),
        status: "en_attente",
        hideAmount: true,
      },
      ...(wallMessages || []),
    ]);

    setMessage({ name: "", message: "" });
    setMessageOpen(false);
  }

  function copyShareLink() {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={goBack}
          className="mb-5 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={17} /> Retour aux athlètes
        </button>

        {(safeAthlete.status === "suspendu" ||
          safeAthlete.status === "archivé" ||
          safeAthlete.isPublic === false) && (
          <section className="mb-6 rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-5">
            <p className="font-black" style={{ color: gold }}>
              Cette page est actuellement désactivée publiquement.
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Elle reste visible depuis l’admin pour consultation et gestion.
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
          <div className="grid gap-8 p-6 md:p-10 lg:grid-cols-[0.95fr_1.1fr] lg:items-center">
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black">
                {safeAthlete.photoUrl ? (
                  <img
                    src={safeAthlete.photoUrl}
                    alt={safeAthlete.name || "Athlète"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-8xl">
                    {safeAthlete.avatar || "🥋"}
                  </div>
                )}
              </div>

              <div className="absolute left-4 top-4 rounded-full bg-black/75 px-4 py-2 text-sm font-black backdrop-blur">
                {safeAthlete.countryFlag || "🇨🇦"} Canada
              </div>

              <div
                className="absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm font-black text-black"
                style={{ background: gold }}
              >
                {primaryFamilyParticipation
                  ? "Campagne familiale"
                  : safeAthlete.campaignBadge ||
                    safeAthlete.program ||
                    "Programme Athlètes"}
              </div>
            </div>

            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.3em]"
                style={{ color: gold }}
              >
                Page athlète publique
              </p>

              <h1 className="mt-4 text-5xl font-black md:text-7xl">
                {primaryFamilyParticipation
                  ? `Famille ${primaryFamilyParticipation.familyName || safeAthlete.familyName || ""}`
                  : safeAthlete.name || "Athlète Kinko"}
              </h1>

              <p className="mt-3 text-2xl font-black text-white">
                {primaryFamilyParticipation
                  ? mainCampaign?.title ||
                    primaryFamilyParticipation.campaignTitle ||
                    "Campagne familiale"
                  : `${safeAthlete.athleteLabel || "Athlète Kinko"} — ${
                      safeAthlete.campaignBadge ||
                      safeAthlete.program ||
                      "Programme Athlètes"
                    }`}
              </p>

              <p className="mt-2 text-lg text-zinc-300">
                Dojo {safeAthlete.dojo || "à confirmer"}
              </p>

              {safeAthlete.familyName && !primaryFamilyParticipation && (
                <p className="mt-2 text-lg text-zinc-300">
                  Famille {safeAthlete.familyName}
                </p>
              )}

              {primaryFamilyParticipation && mainFamilyAthletes.length > 0 && (
                <div className="mt-5 rounded-2xl bg-black p-4">
                  <p className="text-sm font-black" style={{ color: gold }}>
                    Athlètes de cette campagne
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {mainFamilyAthletes.map((familyAthlete) => (
                      <button
                        key={familyAthlete.id}
                        onClick={() => {
                          if (familyAthlete.id !== safeAthlete.id) {
                            window.location.href = `/athlete/${familyAthlete.id}`;
                          }
                        }}
                        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
                      >
                        {familyAthlete.avatar || "🥋"} {familyAthlete.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
                {primaryFamilyParticipation
                  ? "Cette page présente un fonds commun familial lié à une campagne précise."
                  : `Objectif : ${
                      safeAthlete.fundingPurpose ||
                      safeAthlete.objective ||
                      safeAthlete.goalText ||
                      safeAthlete.bio ||
                      safeAthlete.presentation ||
                      "financer sa participation à la compétition"
                    }.`}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  safeAthlete.province || "Province à confirmer",
                  safeAthlete.discipline || "Arts martiaux",
                  `Ceinture ${safeAthlete.belt || "à confirmer"}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-900 px-4 py-2 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {(safeAthlete.bio || safeAthlete.presentation) && (
                <div className="mt-8 rounded-2xl border border-zinc-800 bg-black p-5">
                  <p
                    className="text-xs font-bold uppercase tracking-[0.25em]"
                    style={{ color: gold }}
                  >
                    Présentation
                  </p>
                  <p className="mt-3 text-base leading-7 text-zinc-300">
                    {safeAthlete.bio || safeAthlete.presentation}
                  </p>
                </div>
              )}

              <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p
                  className="text-sm font-bold leading-6"
                  style={{ color: gold }}
                >
                  Pour soutenir correctement cette page, utilisez les boutons
                  dans les campagnes actives ci-dessous. Ils attribuent le
                  soutien à la bonne campagne, au bon athlète ou au bon fonds
                  commun familial.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"
                >
                  <Share2 size={18} /> {copied ? "Lien copié" : "Partager la page"}
                </button>

                {primaryFamilyParticipation?.campaignId ? (
                  <button
                    onClick={() =>
                      onOpenCampaign?.(primaryFamilyParticipation.campaignId)
                    }
                    className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"
                  >
                    <Megaphone size={18} /> Voir campagne
                  </button>
                ) : (
                  safeAthlete.campaignId && (
                    <button
                      onClick={() => onOpenCampaign?.(safeAthlete.campaignId)}
                      className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-4 py-3 font-bold text-white hover:bg-zinc-900"
                    >
                      <Megaphone size={18} /> Voir campagne
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {primaryFamilyParticipation && (
          <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
            <SectionTitle icon={Users} title="Objectif commun famille">
              Les montants ci-dessous regroupent les athlètes de la même famille
              associés à cette campagne.
            </SectionTitle>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">
                  Objectif commun
                </p>
                <p className="mt-1 text-3xl font-black">
                  {money(mainFamilyGoal)}
                </p>
              </div>

              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">
                  Déjà amassé
                </p>
                <p className="mt-1 text-3xl font-black">
                  {money(mainFamilyRaised)}
                </p>
              </div>

              <div className="rounded-2xl bg-black p-4">
                <p className="text-xs uppercase text-zinc-500">
                  Reste à financer
                </p>
                <p className="mt-1 text-3xl font-black" style={{ color: gold }}>
                  {money(mainFamilyRemaining)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ProgressBar value={mainFamilyPercent} />
              <p className="mt-2 text-sm text-zinc-400">
                {mainFamilyPercent} % de l’objectif familial atteint
              </p>
            </div>
          </section>
        )}

        {athleteParticipations.length > 0 && (
          <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
            <SectionTitle icon={Megaphone} title="Campagnes actives">
              Cet athlète peut participer à plusieurs campagnes, seul ou avec sa
              famille. Utilisez les boutons de chaque campagne pour attribuer le
              soutien au bon fonds.
            </SectionTitle>

            <div className="mt-6 grid gap-4">
              {athleteParticipations.map((participation) => {
                const campaign = participationCampaign(participation);
                const raisedAmount = participationRaised(participation);
                const goalAmount = participationGoal(participation);

                const percent =
                  goalAmount > 0
                    ? Math.min(
                        Math.round((raisedAmount / goalAmount) * 100),
                        100
                      )
                    : 0;

                const familyAthletes = familyGroupAthletes(participation);
                const supportUrl = buildParticipationSupportUrl(
                  participation,
                  campaign
                );
                const sponsorUrl = buildParticipationSponsorUrl(
                  participation,
                  campaign
                );

                return (
                  <div
                    key={participation.id}
                    className="rounded-2xl border border-zinc-800 bg-black p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p
                          className="text-xs font-bold uppercase tracking-[0.2em]"
                          style={{ color: gold }}
                        >
                          {isFamilyParticipation(participation)
                            ? "Fonds commun famille"
                            : "Financement individuel"}
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-white">
                          {campaign?.title ||
                            participation.campaignTitle ||
                            "Campagne"}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-400">
                          {campaign?.city || ""} {campaign?.country || ""}{" "}
                          {campaign?.eventDate
                            ? `· ${campaign.eventDate}`
                            : ""}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          onOpenCampaign?.(participation.campaignId)
                        }
                        className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-black text-white hover:bg-zinc-900"
                      >
                        Voir campagne
                      </button>
                    </div>

                    {isFamilyParticipation(participation) &&
                      familyAthletes.length > 0 && (
                        <div className="mt-5 rounded-2xl bg-zinc-950 p-4">
                          <p
                            className="text-sm font-black"
                            style={{ color: gold }}
                          >
                            Athlètes regroupés dans ce fonds commun
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {familyAthletes.map((familyAthlete) => (
                              <button
                                key={familyAthlete.id}
                                onClick={() => {
                                  if (familyAthlete.id !== safeAthlete.id) {
                                    window.location.href = `/athlete/${familyAthlete.id}`;
                                  }
                                }}
                                className="rounded-full bg-black px-4 py-2 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
                              >
                                {familyAthlete.avatar || "🥋"}{" "}
                                {familyAthlete.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-zinc-950 p-4">
                        <p className="text-xs uppercase text-zinc-500">
                          Objectif
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {money(goalAmount)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950 p-4">
                        <p className="text-xs uppercase text-zinc-500">
                          Collecté
                        </p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {money(raisedAmount)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-zinc-950 p-4">
                        <p className="text-xs uppercase text-zinc-500">
                          Progression
                        </p>
                        <p
                          className="mt-1 text-2xl font-black"
                          style={{ color: gold }}
                        >
                          {percent} %
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <ProgressBar value={percent} />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <a
                        href={supportUrl}
                        className="flex items-center gap-2 rounded-2xl px-5 py-4 font-black text-black"
                        style={{ background: gold }}
                      >
                        <Store size={18} />
                        {supportButtonLabel(participation, campaign)}
                      </a>

                      <a
                        href={sponsorUrl}
                        className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-4 font-black text-white hover:bg-zinc-900"
                      >
                        <HeartHandshake size={18} />
                        {sponsorButtonLabel(participation, campaign)}
                      </a>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                      <p className="text-xs font-bold uppercase text-zinc-500">
                        Attribution du soutien
                      </p>
                      <p className="mt-1 text-sm leading-6 text-zinc-300">
                        {isFamilyParticipation(participation)
                          ? `Les ventes, dons ou commandites de cette campagne seront attribués au fonds commun familial ${participation.familyName || safeAthlete.familyName || ""}.`
                          : `Les ventes, dons ou commandites de cette campagne seront attribués à ${safeAthlete.name}.`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={ReceiptText} title="Contributions reçues">
            Les contributions ci-dessous proviennent des achats Shopify
            attribués à cette page. Elles permettent de suivre concrètement les
            montants remis à l’athlète ou au fonds familial.
          </SectionTitle>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs uppercase text-zinc-500">Total reçu</p>
              <p className="mt-1 text-3xl font-black" style={{ color: gold }}>
                {money(contributionsTotal)}
              </p>
            </div>

            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs uppercase text-zinc-500">Contributions</p>
              <p className="mt-1 text-3xl font-black">
                {contributions.length}
              </p>
            </div>

            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs uppercase text-zinc-500">Type</p>
              <p className="mt-1 text-lg font-black">
                {primaryFamilyParticipation ? "Fonds familial" : "Athlète individuel"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {contributions.length === 0 && (
              <p className="rounded-2xl bg-black p-5 text-zinc-500">
                Aucune contribution reçue pour le moment.
              </p>
            )}

            {contributions.map((contribution) => (
              <ContributionCard
                key={contribution.id}
                contribution={contribution}
              />
            ))}
          </div>
        </section>

        {!primaryFamilyParticipation && (
          <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] bg-zinc-950 p-6">
              <SectionTitle icon={Sparkles} title="Objectif financier" />

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-black p-4">
                  <p className="text-xs uppercase text-zinc-500">
                    Objectif total
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {money(safeAthlete.goal || 0)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-4">
                  <p className="text-xs uppercase text-zinc-500">
                    Déjà amassé
                  </p>
                  <p className="mt-1 text-3xl font-black">
                    {money(legacyRaised)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-4">
                  <p className="text-xs uppercase text-zinc-500">
                    Reste à financer
                  </p>
                  <p
                    className="mt-1 text-3xl font-black"
                    style={{ color: gold }}
                  >
                    {money(legacyRemaining)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <ProgressBar value={legacyProgress} />
                <p className="mt-2 text-sm text-zinc-400">
                  {legacyProgress} % de l’objectif atteint
                </p>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-zinc-300">
                <div className="flex justify-between rounded-2xl bg-black p-4">
                  <span>Ventes boutique</span>
                  <b>{money(safeAthlete.raisedShop || 0)}</b>
                </div>

                <div className="flex justify-between rounded-2xl bg-black p-4">
                  <span>Dons / activités</span>
                  <b>{money(safeAthlete.raisedOffline || 0)}</b>
                </div>

                <div className="flex justify-between rounded-2xl bg-black p-4">
                  <span>Commandites</span>
                  <b>{money(legacySponsorship)}</b>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-zinc-950 p-6">
              <SectionTitle
                icon={Gift}
                title={`Comment soutenir ${firstName} ?`}
              >
                Utilisez les boutons dans les campagnes actives pour que le
                soutien soit attribué au bon athlète, à la bonne famille et à la
                bonne campagne.
              </SectionTitle>

              <div className="mt-6 grid gap-3">
                {(supportSteps.length
                  ? supportSteps
                  : [
                      "Choisir la campagne active à soutenir",
                      "Acheter un produit supporter ou faire un don",
                      "Partager la page",
                      "Laisser un message d’encouragement",
                    ]
                ).map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="flex items-center gap-4 rounded-2xl bg-black p-4"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full font-black text-black"
                      style={{ background: gold }}
                    >
                      {index + 1}
                    </div>
                    <p className="font-bold text-zinc-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Target} title="À quoi servira le financement ?">
            Le détail ci-dessous permet de comprendre concrètement ce que le
            soutien finance.
          </SectionTitle>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {needs.length === 0 && (
              <p className="text-zinc-500">
                Les besoins financiers seront précisés prochainement.
              </p>
            )}

            {needs.map((item) => (
              <NeedRow key={item.label} item={item} />
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-black p-5">
            <div className="flex items-start gap-3">
              <Plane className="mt-1" size={20} style={{ color: gold }} />
              <div>
                <p className="font-black">Un soutien concret</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">
                  Chaque achat supporter, don ou commandite aide directement à
                  réduire les frais de compétition.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6">
          <SectionTitle icon={Store} title="Soutenir via la boutique KinkoLab">
            Le soutien se fait maintenant depuis les boutons de chaque campagne
            active afin d’attribuer les fonds au bon groupe.
          </SectionTitle>

          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-bold leading-6" style={{ color: gold }}>
              Sélectionnez une campagne active plus haut pour soutenir cet
              athlète individuellement ou soutenir son fonds commun familial.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={CalendarDays} title="Étapes de préparation">
            Chaque étape donne une vision claire du parcours de préparation.
          </SectionTitle>

          <div className="mt-6 grid gap-3">
            {steps.length === 0 && (
              <p className="text-zinc-500">
                Les étapes seront ajoutées prochainement.
              </p>
            )}

            {steps.map((step, index) => (
              <CampaignStep
                key={`${step.label || "step"}-${index}`}
                step={step}
                index={index}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle
            icon={Megaphone}
            title={`Dernières nouvelles de ${firstName}`}
          />

          <div className="mt-6 grid gap-4">
            {approvedUpdates.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-800 bg-black p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p
                    className="text-xs font-bold uppercase"
                    style={{ color: gold }}
                  >
                    {item.type}
                  </p>
                  {item.date && (
                    <p className="text-xs text-zinc-500">{item.date}</p>
                  )}
                </div>

                <h3 className="mt-2 text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {item.content}
                </p>

                {item.mediaUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full object-cover"
                    />
                  </div>
                )}
              </article>
            ))}

            {approvedUpdates.length === 0 && (
              <p className="text-zinc-500">
                Aucune nouvelle publiée pour le moment.
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Users} title="Événements de financement">
            Activités locales, stages, ventes et initiatives autour de
            l’athlète.
          </SectionTitle>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {fundingEvents.length === 0 && (
              <p className="text-zinc-500">
                Aucun événement publié pour le moment.
              </p>
            )}

            {fundingEvents.map((event) => (
              <div
                key={`${event.date}-${event.title}`}
                className="rounded-2xl bg-black p-5"
              >
                <p
                  className="text-xs font-bold uppercase"
                  style={{ color: gold }}
                >
                  {event.date}
                </p>
                <h3 className="mt-2 text-xl font-black">{event.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {event.description}
                </p>
                {event.goal && (
                  <p className="mt-3 text-sm font-bold text-zinc-300">
                    Objectif : {money(event.goal)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle
            icon={HeartHandshake}
            title={`Partenaires de ${firstName}`}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sponsors.length === 0 && (
              <p className="text-zinc-500">
                Aucun partenaire affiché pour le moment.
              </p>
            )}

            {sponsors.map((sponsor) => (
              <SponsorCard
                key={`${sponsor.level}-${sponsor.name}`}
                sponsor={sponsor}
              />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-zinc-950 p-6">
            <SectionTitle icon={MessageCircle} title="Mur d’encouragement">
              Les messages sont publiés après validation afin de protéger
              l’athlète.
            </SectionTitle>

            <div className="mt-5 space-y-3">
              {approvedMessages.length === 0 && (
                <p className="text-zinc-500">
                  Aucun message publié pour le moment.
                </p>
              )}

              {approvedMessages.map((item) => (
                <div key={item.id} className="rounded-2xl bg-black p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{item.name}</p>
                    {item.date && (
                      <p className="text-xs text-zinc-500">{item.date}</p>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{item.message}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setMessageOpen(!messageOpen)}
              className="mt-5 rounded-2xl px-5 py-3 font-black text-black"
              style={{ background: gold }}
            >
              Laisser un message
            </button>
          </div>

          <div
            className={cn(
              "rounded-3xl bg-white p-6 text-zinc-950",
              !messageOpen && "hidden lg:block"
            )}
          >
            <h2 className="text-2xl font-black">Ajouter un message</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Le message sera publié après validation admin.
            </p>

            <div className="mt-5 space-y-3">
              <input
                value={message.name}
                onChange={(event) =>
                  setMessage({ ...message, name: event.target.value })
                }
                placeholder="Votre nom"
                className="w-full rounded-2xl border border-zinc-200 p-3"
              />

              <textarea
                value={message.message}
                onChange={(event) =>
                  setMessage({ ...message, message: event.target.value })
                }
                placeholder="Votre message..."
                className="min-h-28 w-full rounded-2xl border border-zinc-200 p-3"
              />

              <button
                onClick={submitMessage}
                className="w-full rounded-2xl bg-black p-3 font-black text-white"
              >
                Soumettre
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6">
          <SectionTitle icon={ShieldCheck} title="Transparence">
            Comment les fonds sont attribués ?
          </SectionTitle>

          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les profits des produits achetés depuis une campagne individuelle
              sont attribués à l’athlète sélectionné.
            </div>
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les profits des produits achetés depuis une campagne familiale
              sont attribués au fonds commun familial de cette campagne.
            </div>
            <div className="rounded-2xl bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              Les commandites d’événement sont versées au fonds commun de la
              campagne ou au fonds familial selon le mode de financement choisi.
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] bg-zinc-950 p-6">
          <SectionTitle icon={Share2} title="Partager cette page">
            Aidez {firstName} en partageant cette page avec votre famille, vos
            amis et votre réseau.
          </SectionTitle>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-black text-black"
              style={{ background: gold }}
            >
              <Copy size={18} /> {copied ? "Lien copié" : "Copier le lien"}
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Share2 size={18} /> Facebook
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Share2 size={18} /> Instagram
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Send size={18} /> Messenger
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-3 font-black text-white hover:bg-zinc-900">
              <Mail size={18} /> Courriel
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
