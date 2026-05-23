export default function AthletesPage({ athletes }) {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-5xl font-black">Athlètes</h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {athletes.map((athlete) => (
            <div
              key={athlete.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <div className="text-5xl">{athlete.avatar}</div>
              <h2 className="mt-4 text-2xl font-black">
                {athlete.name}
              </h2>
              <p className="text-zinc-400">{athlete.dojo}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}