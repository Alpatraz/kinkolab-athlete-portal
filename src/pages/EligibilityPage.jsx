import React from 'react';

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
