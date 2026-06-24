Voici les structures de code de vos 4 fichiers React (.jsx). Ils intègrent les obligations de la Loi 25 (Québec), les normes de la LPRPDE (Canada), les exigences du Bureau de la concurrence et les règles de conformité de Stripe.Ces fichiers sont conçus avec Tailwind CSS pour être propres, professionnels et faciles à lire pour vos utilisateurs.1. PrivacyPolicyPage.jsx (Politique de Confidentialité — Obligatoire Loi 25)jsximport React from 'react';

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
Utilisez le code avec précaution.2. TermsPage.jsx (Conditions Générales de Vente et d'Utilisation)jsximport React from 'react';

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
Utilisez le code avec précaution.3. EligibilityPage.jsx (Règles d'Admissibilité des Athlètes)jsximport React from 'react';

export default function EligibilityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-800">
      <h1 className="text-3xl font-bold mb-2">Admissibilité des Athlètes</h1>
      <p className="text-sm text-slate-500 mb-8">Critères et encadrement du Programme Athlètes KinkoLab</p>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">1. Qui peut s'inscrire ?</h2>
        <p className="mb-2">Le programme est ouvert aux profils suivants résidant au Canada :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Athlètes amateurs (sports individuels ou collectifs).</li>
          <li>Athlètes d'élite, espoirs et de niveau universitaire.</li>
          <li>Les athlètes âgés de moins de 18 ans doivent obligatoirement fournir une autorisation écrite de leur parent ou tuteur légal, qui sera le signataire officiel de l'entente.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">2. Préservation du statut d'athlète amateur (Règlementation sportive)</h2>
        <p className="bg-sky-50 border-l-4 border-sky-500 p-4 text-sm text-sky-900 mb-4">
          <strong>Avis aux athlètes scolaires et universitaires (ex: RSEQ, U Sports, NCAA) :</strong> Recevoir du soutien financier direct peut être soumis à des règles strictes de la part de vos fédérations sportives. KinkoLab Inc. structure l'attribution de ses fonds sous forme de <strong>bourse de soutien ou de contrat de commandite marketing (droits d'image)</strong>. 
        </p>
        <p className="text-sm font-medium">Il est de la responsabilité exclusive de l'athlète ou de sa famille de vérifier auprès de sa fédération ou de son établissement d'enseignement si ce type de partenariat est autorisé afin de ne pas compromettre son éligibilité sportive.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-3">3. Engagements de l'athlète</h2>
        <p className="mb-2">Pour conserver son profil actif sur la plateforme et recevoir ses versements, l'athlète s'engage à :</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Fournir des informations exactes sur son parcours et ses besoins de financement.</li>
          <li>Respecter l'éthique sportive et l'esprit du programme KinkoLab (aucun comportement discriminatoire, violent ou antisportif ne sera toléré).</li>
          <li>Autoriser KinkoLab à utiliser son nom, son image et sa biographie sportive dans le cadre exclusif de la promotion de ses vêtements supporters.</li>
        </ul>
      </section>
    </div>
  );
}
Utilisez le code avec précaution.4. TransparencyPage.jsx (Transparence Financière — Conformité Concurrence)jsximport React from 'react';

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
Utilisez le code avec précaution.
