import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { gold, money, totalRaised } from "../utils/format";

export default function CampaignsPage({ campaigns, athletes, onOpenCampaign, openSignup }) {
  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: gold }}>
            Pages campagne
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Les campagnes du Programme Athlètes
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
            Une campagne regroupe un événement, une collection Shopify et plusieurs athlètes.
          </p>

          <button onClick={openSignup} className="mt-6 rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>
            Demander à rejoindre une campagne
          </button>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {campaigns.map((campaign) => {
            const linked = athletes.filter((athlete) => athlete.campaignId === campaign.id);
            const raised = linked.reduce((sum, athlete) => sum + totalRaised(athlete), 0);

            return (
              <motion.div key={campaign.id} whileHover={{ y: -4 }} className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950 shadow-xl">
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6">
                  <h2 className="mt-2 text-2xl font-black">{campaign.title}</h2>
                  <p className="mt-1 text-sm text-zinc-400">{campaign.subtitle}</p>
                </div>

                <div className="p-6">
                  <p className="text-sm leading-6 text-zinc-400">{campaign.description}</p>

                  <div className="mt-5 grid gap-3 text-sm">
                    <div className="rounded-2xl bg-black p-4">
                      <MapPin className="mb-2" size={18} style={{ color: gold }} />
                      <b>{campaign.location}</b>
                    </div>

                    <div className="rounded-2xl bg-black p-4">
                      <CalendarDays className="mb-2" size={18} style={{ color: gold }} />
                      <b>{campaign.date}</b>
                    </div>

                    <div className="rounded-2xl bg-black p-4">
                      <Users className="mb-2" size={18} style={{ color: gold }} />
                      <b>{linked.length}</b> athlète(s)
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-black p-4">
                    <p className="text-xs uppercase text-zinc-500">Fonds suivis</p>
                    <p className="mt-1 text-2xl font-black">{money(raised)}</p>
                  </div>

                  <button onClick={() => onOpenCampaign(campaign.id)} className="mt-5 w-full rounded-2xl px-5 py-3 font-black text-black" style={{ background: gold }}>
                    Ouvrir la campagne
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
