import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Conditions Générales d'Utilisation et de Vente</h1>
      <p className="text-sm text-slate-500 mb-8">Dernière mise à jour : 24 juin 2026</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Objet du site</h2>
        <p>
          Le site <em>://kinkolab.com</em> est la propriété de KinkoLab Inc. Il s'agit d'une plateforme commerciale de vente de vêtements de supporters. Chaque achat permet de financer des bourses ou des contrats de commandite pour les athlètes inscrits à notre programme.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Nature de la transaction (Pas un don de bienfaisance)</h2>
        <p className="bg-amber-50 border-l-4 border-amber-500 p-3 my-2 text-sm text-amber-900">
          <strong>Avis important :</strong> En effectuant un paiement sur notre site, vous achetez un produit de consommation (vêtement). Il ne s'agit <strong>pas</strong> d'un don de bienfaisance. KinkoLab Inc. étant une société par actions privée, aucun reçu officiel aux fins d'impôt ne sera émis.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Prix, taxes et paiements</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Les prix affichés sont en dollars canadiens ($ CAD).</li>
          <li>Les taxes applicables (TPS/TVQ) s'appliquent sur la totalité du prix d'achat de l'article (ex: 60 $) selon les taux en vigueur au Québec et au Canada au moment de la transaction.</li>
          <li>Le paiement est exigible en totalité au moment de la commande via notre passerelle sécurisée Stripe.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">4. Politique de remboursement et annulation</h2>
        <p>
          En raison de la nature personnalisée ou exclusive des produits liés aux athlètes et du versement des fonds associés, les ventes sont fermes. En cas de défaut de fabrication du produit, veuillez contacter le support dans les 14 jours suivant la réception pour un échange. Si un remboursement complet est accordé, l'attribution des 20 $ à l'athlète pour cette vente spécifique sera annulée.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">5. Droit applicable</h2>
        <p>Ces conditions sont régies et interprétées conformément aux lois de la province de Québec et aux lois fédérales du Canada qui s'y appliquent.</p>
      </section>
    </div>
  );
}
