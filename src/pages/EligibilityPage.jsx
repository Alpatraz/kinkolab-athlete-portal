import { gold } from "../utils/format";

export default function EligibilityPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-10">
        <h1 className="text-4xl font-black md:text-5xl">
          Admissibilité Sportive
        </h1>

        <p className="mt-8 leading-8 text-zinc-300">
          Le Programme Athlètes KinkoLab est ouvert aux athlètes canadiens
          souhaitant financer leur développement sportif.
        </p>

        <div className="mt-8 rounded-2xl border border-red-700/40 bg-red-950/20 p-6">
          <h2 className="text-xl font-black text-red-300">
            Rappel important
          </h2>

          <p className="mt-3 leading-8 text-red-100">
            Il est de la responsabilité exclusive de l'athlète ou de sa famille
            de vérifier que les sommes reçues dans le cadre du Programme
            Athlètes respectent les règlements de sa fédération sportive, de son
            établissement scolaire ou universitaire.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          Qui peut participer ?
        </h2>

        <ul className="mt-4 list-disc space-y-3 pl-6 text-zinc-300">
          <li>Athlètes amateurs.</li>
          <li>Athlètes de niveau provincial, national ou international.</li>
          <li>Mineurs avec autorisation parentale.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          Engagements
        </h2>

        <ul className="mt-4 list-disc space-y-3 pl-6 text-zinc-300">
          <li>Respecter l'éthique sportive.</li>
          <li>Fournir des informations exactes.</li>
          <li>Maintenir une image compatible avec les valeurs de KinkoLab.</li>
        </ul>
      </div>
    </main>
  );
}
