import { gold } from "../utils/format";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-10">
        <h1 className="text-4xl font-black md:text-5xl">
          Conditions Générales d'Utilisation
        </h1>

        <p className="mt-3 text-zinc-400">
          Dernière mise à jour : 24 juin 2026
        </p>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          1. Objet du site
        </h2>

        <p className="mt-4 leading-8 text-zinc-300">
          KinkoLab est une plateforme de vente de produits supporters destinée
          à soutenir les athlètes participants au Programme Athlètes.
        </p>

        <div className="mt-8 rounded-2xl border border-yellow-700/40 bg-yellow-950/20 p-6">
          <p className="leading-7 text-yellow-100">
            <strong>Avis important :</strong> Les achats effectués sur ce site
            sont des achats de produits commerciaux et non des dons de
            bienfaisance. Aucun reçu fiscal ne sera émis.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          2. Prix et paiements
        </h2>

        <ul className="mt-4 list-disc space-y-3 pl-6 text-zinc-300">
          <li>Prix affichés en dollars canadiens.</li>
          <li>TPS et TVQ applicables en sus.</li>
          <li>Paiement sécurisé via Stripe.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          3. Annulations et remboursements
        </h2>

        <p className="mt-4 leading-8 text-zinc-300">
          En cas de remboursement complet d'une commande, les montants associés
          à l'athlète ou à la famille concernée seront automatiquement retirés
          du suivi financier affiché sur la plateforme.
        </p>

        <h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>
          4. Droit applicable
        </h2>

        <p className="mt-4 leading-8 text-zinc-300">
          Les présentes conditions sont régies par les lois du Québec et du
          Canada.
        </p>
      </div>
    </main>
  );
}
