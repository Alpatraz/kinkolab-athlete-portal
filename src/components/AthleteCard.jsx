import { motion } from "framer-motion";
import { Eye, Megaphone, Star } from "lucide-react";
import { campaignTitle, gold, money, progressOf, totalRaised } from "../utils/format";
import ProgressBar from "./ProgressBar";

export default function AthleteCard({ athlete, campaigns, onOpen, onOpenCampaign }) {
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

          <div className="mt-4">
            <ProgressBar value={progressOf(athlete)} />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-zinc-400">
            <span><b className="text-white">{money(totalRaised(athlete))}</b> / {money(athlete.goal)}</span>
            <span>{progressOf(athlete)}%</span>
          </div>
        </div>
      </button>

      <div className="flex border-t border-zinc-800 p-3 text-xs font-bold text-zinc-400">
        <button onClick={() => onOpen(athlete.id)} className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white">
          <Eye size={14} /> Page athlète
        </button>
        <button onClick={() => onOpenCampaign(athlete.campaignId)} className="flex flex-1 items-center justify-center gap-1 rounded-xl py-2 hover:bg-black hover:text-white">
          <Megaphone size={14} /> Campagne
        </button>
      </div>
    </motion.div>
  );
}
