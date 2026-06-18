import { useMemo, useState } from "react";
import { CalendarDays, MapPin, Search, Users, DollarSign } from "lucide-react";
import { gold, money } from "../utils/format";

function isVisibleCampaign(campaign) {
  return (
    campaign &&
    campaign.status !== "suspendue" &&
    campaign.status !== "archivée" &&
    campaign.status !== "archive" &&
    campaign.status !== "archivé"
  );
}

function campaignLocation(campaign) {
  return [campaign.city, campaign.country].filter(Boolean).join(", ");
}

function campaignDate(campaign) {
  if (campaign.eventDate) return campaign.eventDate;
  if (campaign.startDate && campaign.endDate) {
    return `${campaign.startDate} au ${campaign.endDate}`;
  }
  if (campaign.startDate) return campaign.startDate;
  return "Date à confirmer";
}

function participationRaised(participation) {
  return (
    Number(participation?.raisedShop || 0) +
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
}

function isActiveParticipation(participation) {
  return (
    participation &&
    participation.status !== "suspendue" &&
    participation.status !== "suspendu" &&
    participation.status !== "archivée" &&
    participation.status !== "archivé" &&
    participation.status !== "archive"
  );
}

export default function CampaignsPage({
  campaigns = [],
  athletes = [],
  participations = [],
  onOpenCampaign,
  openSignup,
}) {
  const [search, setSearch] = useState("");

  const visibleCampaigns = useMemo(() => {
    return (campaigns || [])
      .filter(isVisibleCampaign)
      .filter((campaign) => {
        const text = [
          campaign.title,
          campaign.description,
          campaign.year,
          campaign.country,
          campaign.city,
          campaign.status,
          campaign.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(search.toLowerCase());
      });
  }, [campaigns, search]);

  function campaignParticipations(campaignId) {
    return (participations || []).filter(
      (participation) =>
        participation.campaignId === campaignId &&
        isActiveParticipation(participation)
    );
  }

  function campaignAthletes(campaignId) {
    const activeParticipations = campaignParticipations(campaignId);
    const athleteIds = new Set(
      activeParticipations.map((participation) => participation.athleteId)
    );

    return (athletes || []).filter(
      (athlete) =>
        athleteIds.has(athlete.id) &&
        athlete.status !== "suspendu" &&
        athlete.status !== "archivé" &&
        athlete.isPublic !== false
    );
  }

  function campaignRaised(campaignId) {
    return campaignParticipations(campaignId).reduce(
      (sum, participation) => sum + participationRaised(participation),
      0
    );
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p
            className="text-sm font-bold uppercase tracking-[0.3em]"
            style={{ color: gold }}
          >
            Campagnes
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Campagnes de financement
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-400">
            Découvrez les campagnes actives du Programme Athlètes KinkoLab.
          </p>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-4 text-zinc-500" size={20} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une campagne..."
                className="w-full rounded-2xl border border-zinc-800 bg-black py-4 pl-12 pr-4 text-white outline-none focus:border-yellow-600"
              />
            </div>

            <button
              onClick={openSignup}
              className="rounded-2xl px-5 py-4 font-black text-black"
              style={{ background: gold }}
            >
              Rejoindre une campagne
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibleCampaigns.length === 0 && (
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 text-zinc-400 md:col-span-2 lg:col-span-3">
              Aucune campagne active à afficher pour le moment.
            </div>
          )}

          {visibleCampaigns.map((campaign) => {
            const linkedAthletes = campaignAthletes(campaign.id);
            const raised = campaignRaised(campaign.id);

            return (
              <article
                key={campaign.id}
                className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-xl"
              >
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-[0.2em]"
                        style={{ color: gold }}
                      >
                        {campaign.type === "continuous"
                          ? "Campagne continue"
                          : "Campagne événement"}
                      </p>

                      <h2 className="mt-3 text-3xl font-black text-white">
                        {campaign.title || "Campagne KinkoLab"}
                      </h2>
                    </div>

                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-black"
                      style={{ background: gold }}
                    >
                      <CalendarDays size={24} />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <p className="min-h-16 text-sm leading-6 text-zinc-400">
                    {campaign.description ||
                      "Campagne de financement pour soutenir les athlètes des arts martiaux."}
                  </p>

                  <div className="mt-5 grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl bg-black p-4">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <MapPin size={18} style={{ color: gold }} />
                        <span>Lieu</span>
                      </div>
                      <b className="text-right text-white">
                        {campaignLocation(campaign) || "À confirmer"}
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-black p-4">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <CalendarDays size={18} style={{ color: gold }} />
                        <span>Date</span>
                      </div>
                      <b className="text-right text-white">
                        {campaignDate(campaign)}
                      </b>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-black p-4">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <Users size={18} style={{ color: gold }} />
                        <span>Athlètes</span>
                      </div>
                      <b className="text-white">{linkedAthletes.length}</b>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-black p-4">
                      <div className="flex items-center gap-3 text-zinc-400">
                        <DollarSign size={18} style={{ color: gold }} />
                        <span>Fonds suivis</span>
                      </div>
                      <b className="text-white">{money(raised)}</b>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenCampaign?.(campaign.id)}
                    className="mt-6 w-full rounded-2xl px-5 py-4 font-black text-black"
                    style={{ background: gold }}
                  >
                    Ouvrir la campagne
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
