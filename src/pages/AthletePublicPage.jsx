// src/pages/AthletePublicPage.jsx

import { useMemo } from "react";

import {
  ArrowLeft,
  DollarSign,
  Megaphone,
  Users,
} from "lucide-react";

import {
  gold,
  money,
} from "../utils/format";

function ProgressBar({ value }) {
  return (
    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${value}%`,
          background: gold,
        }}
      />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Icon style={{ color: gold }} />
        <h2 className="text-3xl font-black text-white">
          {title}
        </h2>
      </div>

      {children && (
        <p className="mt-3 max-w-3xl text-zinc-400">
          {children}
        </p>
      )}
    </div>
  );
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

  const supportSteps = safeAthlete.supportSteps || [];

  const athleteParticipations = (participations || []).filter(
    (participation) =>
      participation.athleteId === safeAthlete.id &&
      participation.status !== "suspendue" &&
      participation.status !== "archivée"
  );

  function participationRaised(participation) {
    if (!participation) return 0;

    if (
      participation.fundingMode === "family" &&
      participation.fundingGroupId
    ) {
      return (participations || [])
        .filter(
          (item) =>
            item.fundingGroupId ===
              participation.fundingGroupId &&
            item.status !== "suspendue" &&
            item.status !== "archivée"
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.raisedShop || 0) +
            Number(item.raisedOffline || 0) +
            Number(item.raisedSponsorship || 0),
          0
        );
    }

    return (
      Number(participation.raisedShop || 0) +
      Number(participation.raisedOffline || 0) +
      Number(participation.raisedSponsorship || 0)
    );
  }

  function participationGoal(participation) {
    if (!participation) return 0;

    if (
      participation.fundingMode === "family" &&
      participation.fundingGroupId
    ) {
      return (participations || [])
        .filter(
          (item) =>
            item.fundingGroupId ===
              participation.fundingGroupId &&
            item.status !== "suspendue" &&
            item.status !== "archivée"
        )
        .reduce(
          (sum, item) =>
            sum + Number(item.goal || 0),
          0
        );
    }

    return Number(participation.goal || 0);
  }

  function participationCampaign(participation) {
    return (campaigns || []).find(
      (campaign) =>
        campaign.id === participation.campaignId
    );
  }

  function familyGroupAthletes(participation) {
    if (!participation?.fundingGroupId) return [];

    const groupParticipations = (participations || []).filter(
      (item) =>
        item.fundingGroupId ===
          participation.fundingGroupId &&
        item.status !== "suspendue" &&
        item.status !== "archivée"
    );

    return groupParticipations
      .map((item) =>
        (athletes || []).find(
          (athleteItem) =>
            athleteItem.id === item.athleteId
        )
      )
      .filter(Boolean);
  }

  const totalRaised = useMemo(() => {
    return athleteParticipations.reduce(
      (sum, participation) =>
        sum + participationRaised(participation),
      0
    );
  }, [athleteParticipations]);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-zinc-900 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
          <button
            onClick={goBack}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
          >
            <ArrowLeft size={17} />
            Retour
          </button>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              {safeAthlete.photo && (
                <img
                  src={safeAthlete.photo}
                  alt={safeAthlete.name}
                  className="h-[420px] w-full rounded-[2rem] object-cover"
                />
              )}
            </div>

            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.3em]"
                style={{ color: gold }}
              >
                Athlete Portal
              </p>

              <h1 className="mt-4 text-5xl font-black md:text-7xl">
                {safeAthlete.avatar} {safeAthlete.name}
              </h1>

              <p className="mt-4 text-lg text-zinc-400">
                {safeAthlete.dojo} ·{" "}
                {safeAthlete.city || ""}
              </p>

              {safeAthlete.bio && (
                <p className="mt-8 max-w-3xl text-lg leading-8 text-zinc-300">
                  {safeAthlete.bio}
                </p>
              )}

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-black p-5 ring-1 ring-zinc-800">
                  <p className="text-sm uppercase text-zinc-500">
                    Total collecté
                  </p>

                  <p className="mt-2 text-4xl font-black">
                    {money(totalRaised)}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5 ring-1 ring-zinc-800">
                  <p className="text-sm uppercase text-zinc-500">
                    Campagnes actives
                  </p>

                  <p className="mt-2 text-4xl font-black">
                    {athleteParticipations.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-black p-5 ring-1 ring-zinc-800">
                  <p className="text-sm uppercase text-zinc-500">
                    Famille
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {safeAthlete.familyName || "Aucune"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {athleteParticipations.length > 0 && (
            <section className="mt-12">
              <SectionTitle
                icon={Megaphone}
                title="Campagnes actives"
              >
                Cet athlète peut participer à une ou plusieurs campagnes, seul ou avec sa famille.
              </SectionTitle>

              <div className="mt-6 grid gap-4">
                {athleteParticipations.map(
                  (participation) => {
                    const campaign =
                      participationCampaign(
                        participation
                      );

                    const raisedAmount =
                      participationRaised(
                        participation
                      );

                    const goalAmount =
                      participationGoal(
                        participation
                      );

                    const percent =
                      goalAmount > 0
                        ? Math.min(
                            Math.round(
                              (raisedAmount /
                                goalAmount) *
                                100
                            ),
                            100
                          )
                        : 0;

                    const familyAthletes =
                      familyGroupAthletes(
                        participation
                      );

                    return (
                      <div
                        key={participation.id}
                        className="rounded-[2rem] border border-zinc-800 bg-black p-6"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <p
                              className="text-xs font-bold uppercase tracking-[0.2em]"
                              style={{ color: gold }}
                            >
                              {participation.fundingMode ===
                              "family"
                                ? "Fonds commun famille"
                                : "Financement individuel"}
                            </p>

                            <h3 className="mt-2 text-3xl font-black text-white">
                              {campaign?.title ||
                                participation.campaignTitle ||
                                "Campagne"}
                            </h3>

                            <p className="mt-2 text-zinc-400">
                              {campaign?.city || ""}{" "}
                              {campaign?.country || ""}
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              onOpenCampaign?.(
                                participation.campaignId
                              )
                            }
                            className="rounded-2xl border border-zinc-700 px-5 py-4 text-sm font-black text-white hover:bg-zinc-900"
                          >
                            Voir campagne
                          </button>
                        </div>

                        {participation.fundingMode ===
                          "family" &&
                          familyAthletes.length >
                            0 && (
                            <div className="mt-6 rounded-2xl bg-zinc-950 p-5">
                              <div className="flex items-center gap-3">
                                <Users
                                  style={{
                                    color: gold,
                                  }}
                                />

                                <h4 className="text-xl font-black">
                                  Fonds commun famille
                                </h4>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {familyAthletes.map(
                                  (
                                    familyAthlete
                                  ) => (
                                    <button
                                      key={
                                        familyAthlete.id
                                      }
                                      onClick={() => {
                                        if (
                                          familyAthlete.id !==
                                          safeAthlete.id
                                        ) {
                                          window.location.href = `/athlete/${familyAthlete.id}`;
                                        }
                                      }}
                                      className="rounded-full bg-black px-5 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
                                    >
                                      {familyAthlete.avatar ||
                                        "🥋"}{" "}
                                      {
                                        familyAthlete.name
                                      }
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl bg-zinc-950 p-5">
                            <p className="text-sm uppercase text-zinc-500">
                              Objectif
                            </p>

                            <p className="mt-2 text-3xl font-black">
                              {money(goalAmount)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-zinc-950 p-5">
                            <p className="text-sm uppercase text-zinc-500">
                              Collecté
                            </p>

                            <p className="mt-2 text-3xl font-black">
                              {money(raisedAmount)}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-zinc-950 p-5">
                            <p className="text-sm uppercase text-zinc-500">
                              Progression
                            </p>

                            <p
                              className="mt-2 text-3xl font-black"
                              style={{
                                color: gold,
                              }}
                            >
                              {percent}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <ProgressBar
                            value={percent}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
