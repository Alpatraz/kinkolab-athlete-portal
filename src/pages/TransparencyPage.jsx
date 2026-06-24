import React from 'react';

export default function TransparencyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Transparence du Programme</h1>
      <p className="text-sm text-slate-500 mb-8">Comment fonctionne la répartition financière chez KinkoLab</p>

      <section className="mb-6">
        <p className="text-lg leading-relaxed">
          Le Bureau de la concurrence du Canada exige que les entreprises privées qui soutiennent des individus ou des causes affichent des règles claires. Chez KinkoLab Inc., nous croyons en une transparence absolue.
        </p>
      </section>

      <section className="mb-8 bg-slate-50 p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-4 text-center">Répartition type d'une vente de 60 $</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-center">
            <span className="text-2xl font-bold text-emerald-700">20,00 $</span>
            <p className="text-xs font-semibold text-emerald-900 uppercase mt-1">Attribués à l'athlète</p>
            <p className="text-xs text-emerald-700 mt-1">Montant fixe et garanti par article vendu (hors taxes)</p>
          </div>
          <div className="bg-slate-100 border border-slate-200 p-4 rounded-lg text-center">
            <span className="text-2xl font-bold text-slate-700">40,00 $</span>
            <p className="text-xs font-semibold text-slate-900 uppercase mt-1">Part KinkoLab Inc.</p>
            <p className="text-xs text-slate-500 mt-1">Frais de production, tissus, logistique, Stripe et administration</p>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Mécanisme de versement aux athlètes</h2>
        <p className="mb-2">Les montants cumulés par les ventes de produits supporters ne transitent pas par une cagnotte publique de dons. Ils font l'objet d'un processus logistique strict :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Période de validation :</strong> Une vente est comptabilisée définitivement après un délai de 14 jours (période de sécurité pour contrer les fraudes de cartes de crédit et gérer les éventuels défauts du produit).</li>
          <li><strong>Fréquence de paiement :</strong> KinkoLab procède au virement des bourses accumulées de manière périodique selon les termes de l'entente signée avec l'athlète ou sa famille.</li>
          <li><strong>Bénéficiaire légal :</strong> Le virement bancaire final est déposé directement sur le compte de l'athlète majeur, ou sur le compte du parent/tuteur légal si l'athlète est mineur.</li>
        </ul>
      </section>

      <section className="mb-6 text-sm text-slate-500 border-t pt-4">
        <p>Pour toute question relative à nos bilans de campagnes ou au fonctionnement technique du programme, veuillez écrire à : <span className="font-semibold text-slate-700">athletes@kinkolab.com</span></p>
      </section>
    </div>
  );
}
