export default function AthletePublicPage({ athlete }) {
  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl bg-zinc-950 p-8">
        <div className="text-7xl">{athlete.avatar}</div>

        <h1 className="mt-6 text-6xl font-black">
          {athlete.name}
        </h1>

        <p className="mt-4 text-xl text-zinc-400">
          {athlete.program}
        </p>
      </div>
    </main>
  );
}