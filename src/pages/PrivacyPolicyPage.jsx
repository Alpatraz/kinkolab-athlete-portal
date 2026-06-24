import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Politique de Confidentialité</h1>
      <p className="text-sm text-slate-500 mb-8">Dernière mise à jour : 24 juin 2026</p>

      <section className="mb-8">
        <p className="mb-4">
          Chez <strong>KinkoLab Inc.</strong>, nous prenons la protection de vos renseignements personnels très au sérieux. 
          Cette politique décrit comment nous collectons, utilisons et protégeons vos données conformément à la Loi 25 (Québec) 
          et à la LPRPDE (Canada).
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Renseignements collectés</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Identité et contact :</strong> Nom, prénom, adresse courriel, adresse de livraison et de facturation, numéro de téléphone.</li>
          <li><strong>Données de paiement :</strong> Vos informations bancaires sont traitées de manière 100 % sécurisée par notre processeur de paiement (Stripe). KinkoLab ne stocke jamais vos numéros de carte de crédit.</li>
          <li><strong>Données de navigation :</strong> Adresse IP, type de navigateur et cookies de session pour optimiser votre expérience d'achat.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Utilisation de vos données</h2>
        <p className="mb-2">Vos informations sont strictement utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Traiter, expédier et assurer le suivi de vos commandes de vêtements.</li>
          <li>Calculer et attribuer les bourses de soutien de 20 $ destinées aux athlètes sélectionnés.</li>
          <li>Prévenir la fraude et assurer la sécurité des transactions.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Partage des données avec des tiers</h2>
        <p>Nous ne vendons ni ne louons vos données. Vos informations sont partagées uniquement avec nos sous-traitants de confiance nécessaires à l'exécution de vos commandes (ex: Stripe pour le paiement, Postes Canada pour la livraison).</p>
      </section>

      <section className="border-t pt-6 mt-8 bg-slate-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Responsable de la protection des données</h2>
        <p className="text-sm"> Pour toute question, accès ou demande de rectification de vos données, contactez notre responsable :</p>
        <p className="mt-2 font-medium text-blue-600">privacy@kinkolab.com</p>
      </section>
    </div>
  );
}
