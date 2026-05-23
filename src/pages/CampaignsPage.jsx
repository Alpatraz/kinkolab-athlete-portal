export default function CampaignsPage({ campaigns }) {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-5xl font-black">Campagnes</h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <h2 className="text-2xl font-black">
                {campaign.title}
              </h2>

              <p className="mt-2 text-zinc-400">
                {campaign.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}