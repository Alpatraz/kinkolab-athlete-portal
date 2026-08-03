import { useLanguage } from "../context/LanguageContext";
import { gold } from "../utils/format";

const copy = {
  fr: {
    title: "Conditions générales d’utilisation et de vente", updated: "Dernière mise à jour : 2 août 2026",
    sections: [
      ["1. Nature du programme", ["KinkoLab exploite un programme privé de soutien lié à la vente de produits supporters.", "Chaque achat est une transaction commerciale et non un don de bienfaisance. Aucun reçu fiscal n’est émis."]],
      ["2. Prix, paiement et part athlète", ["Les prix sont affichés en dollars canadiens et les taxes et frais de livraison applicables s’ajoutent au prix du produit.", "Pour chaque hoodie admissible correctement associé à une campagne et à un athlète ou une famille, un montant fixe de 20 $ CAD est attribué au bénéficiaire désigné.", "Le solde du prix sert notamment à la production, aux matières, à la logistique, au traitement du paiement et à l’administration du programme.", "Le paiement et la confirmation officielle de commande sont traités par Shopify et ses fournisseurs de paiement."]],
      ["3. Confirmation, facture et expédition", ["L’acheteur reçoit la confirmation Shopify ainsi qu’un message KinkoLab présentant le produit, sa taille, la campagne, l’athlète soutenu et la part de 20 $ par article admissible.", "L’acheteur est avisé lorsque le produit est expédié. Les délais de production et de livraison peuvent varier."]],
      ["4. Annulations, remboursements et contestations", ["Toute annulation, tout remboursement complet ou partiel et toute contestation de paiement entraînent automatiquement un ajustement du montant attribué à l’athlète.", "Les pages publiques, statistiques et rapports peuvent être corrigés rétroactivement afin de refléter uniquement les contributions valides.", "L’athlète ou son représentant est avisé lorsqu’une annulation ou un remboursement réduit le montant de sa campagne."]],
      ["5. Versement des fonds", ["Sous réserve des vérifications, annulations, remboursements et renseignements de versement complets, le solde admissible est normalement remis 15 jours après la fin de la campagne.", "Le versement est effectué à l’athlète majeur, au parent ou tuteur légal d’un mineur, ou à un fournisseur admissible lorsque cela a été convenu.", "L’acheteur peut être informé lorsque les fonds associés à son soutien ont été remis."]],
      ["6. Renseignements de versement", ["KinkoLab recueille uniquement les renseignements nécessaires au versement. Les numéros bancaires bruts ne sont pas enregistrés directement dans Firebase.", "Le dépôt direct, lorsqu’il sera offert, devra utiliser un fournisseur spécialisé et une procédure sécurisée de vérification."]],
      ["7. Droit applicable", ["Les présentes conditions sont régies par les lois du Québec et du Canada. Elles ne remplacent pas les droits impératifs accordés aux consommateurs."]],
    ],
  },
  en: {
    title: "Terms of Use and Sale", updated: "Last updated: August 2, 2026",
    sections: [
      ["1. Program structure", ["KinkoLab operates a private support program linked to the sale of supporter products.", "Each purchase is a commercial transaction, not a charitable donation. No tax receipt is issued."]],
      ["2. Price, payment and athlete allocation", ["Prices are displayed in Canadian dollars; applicable taxes and shipping charges are added to the product price.", "For each eligible hoodie properly linked to a campaign and an athlete or family, a fixed CAD $20 amount is allocated to the designated beneficiary.", "The remaining price covers items such as production, materials, logistics, payment processing and program administration.", "Payment and the official order confirmation are processed by Shopify and its payment providers."]],
      ["3. Confirmation, receipt and shipping", ["The buyer receives Shopify’s confirmation and a KinkoLab message identifying the product, size, campaign, supported athlete and the $20 allocation for each eligible item.", "The buyer is notified when the product ships. Production and delivery times may vary."]],
      ["4. Cancellations, refunds and disputes", ["Any cancellation, full or partial refund, or payment dispute automatically adjusts the amount allocated to the athlete.", "Public pages, statistics and reports may be corrected retroactively so they reflect valid contributions only.", "The athlete or their representative is notified when a cancellation or refund reduces the campaign amount."]],
      ["5. Payment of funds", ["Subject to verification, cancellations, refunds and complete payment details, the eligible balance is normally paid 15 days after the campaign ends.", "Payment is made to an adult athlete, a minor’s parent or legal guardian, or an eligible supplier where agreed.", "The buyer may be notified when funds associated with their support have been paid."]],
      ["6. Payment information", ["KinkoLab collects only the information required to make a payment. Raw bank account numbers are not stored directly in Firebase.", "Direct deposit, when offered, must use a specialized provider and a secure verification process."]],
      ["7. Governing law", ["These terms are governed by the laws of Quebec and Canada. They do not replace mandatory consumer rights."]],
    ],
  },
};

export default function TermsPage() {
  const { language } = useLanguage();
  const page = copy[language] || copy.fr;
  return <main className="min-h-screen bg-black px-5 py-16 text-white"><article className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-10"><h1 className="text-4xl font-black md:text-5xl">{page.title}</h1><p className="mt-3 text-zinc-400">{page.updated}</p>{page.sections.map(([title, items]) => <section key={title}><h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>{title}</h2><ul className="mt-4 list-disc space-y-3 pl-6 text-zinc-300">{items.map((item) => <li key={item} className="leading-8">{item}</li>)}</ul></section>)}</article></main>;
}
