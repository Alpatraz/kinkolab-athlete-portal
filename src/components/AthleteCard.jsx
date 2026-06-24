import { motion } from "framer-motion";
import { Eye, Megaphone, Star } from "lucide-react";
import { campaignTitle, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "./ProgressBar";

function contributionAmount(contribution) {
  return Number(contribution?.amountReserved || contribution?.reservedAmount || 0);
}

function isActiveContribution(contribution) {
  const status = String(contribution?.status || "reserved").toLowerCase();
  return !["cancelled", "annulé", "annule", "refunded", "remboursé", "rembourse"].includes(status);
}

function participationRaised(participation) {
  return (
    Number(participation?.raisedOffline || 0) +
    Number(participation?.raisedSponsorship || 0)
  );
}

export default function AthleteCard({
  athlete,
  campaigns = [],
  participation = null,
  contributions = [],
  onOpen,
  onOpenCampaign,
}) {
  const campaignId = participation?.campaignId || athlete.campaignId;
  const goal = Number(participation?.goal || athlete.goal || 0);

  const shopRaised = (contributions || [])
    .filter((contribution) => {
      if (!isActiveContribution(contribution)) return false;

      const sameCampaign = !campaignId || contribution.campaignId === campaignId;
      const directAthlete = contribution.athleteId === athlete.id;

      const familyContribution =
        athlete.familyId &&
        contribution.fundingMode === "family" &&
        contribution.familyId === athlete.familyId;

      return sameCampaign && (directAthlete || familyContribution);
    })
    .reduce((sum, contribution) => sum + contributionAmount(contribution), 0);

  const raised = Math.max(
    participation ? participationRaised(participation) : totalRaised(athlete),
    shopRaised
  );

  const progress =
    goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : progressOf(athlete);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 text-left text-white shadow-xl transition hover:border-zinc-600"
    >
      <button onClick={() => onOpen?.(athlete.id)} className="block w-full text-left">
        <div className="relative h-56 bg-gradient-to-br from-zinc-800 to-black">
          {athlete.photoUrl ? (
            <img
              src={athlete.photoUrl}
              alt={athlete.name || "Athlète"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">
              {athlete.avatar || "🥋"}
            </div>
          )}

          <div className="absolute right-5 top-5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-zinc-300">
            {athlete.category || athlete.belt || ""}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">{athlete.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{athlete.dojo}</p>
            </div>

            {athlete.featured && <Star size={19} style={{ color: gold }} fill={gold} />}
          </div>

          <p className="mt-2 text-xs font-bold uppercase text-zinc-500">
            {athlete.province} · {athlete.discipline}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            {campaignTitle(campaigns, campaignId)}
          </p>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
            {athlete.bio || athlete.fundingPurpose}
          </p>

          <div className="mt-4">
            <ProgressBar value={progress} />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
            <span>
              <b className="text-white">{money(raised)}</b> / {money(goal)}
            </span>
            <span>{progress}%</span>
          </div>
        </div>
      </button>

      <div className="flex border-t border-zinc-800 p-3 text-xs font-bold text-zinc-400">
        <button
          onClick={() => onOpen?.(athlete.id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white"
        >
          <Eye size={14} /> Page athlète
        </button>

        <button
          onClick={() => onOpenCampaign?.(campaignId)}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white"
        >
          <Megaphone size={14} /> Campagne
        </button>
      </div>
    </motion.div>
  );
}
