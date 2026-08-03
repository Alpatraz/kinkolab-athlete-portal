import { useLanguage } from "../context/LanguageContext";
import { gold } from "../utils/format";

const copy = {
  fr: {
    title: "Politique de confidentialité", updated: "Dernière mise à jour : 2 août 2026",
    intro: "Chez KinkoLab Inc., nous prenons la protection de vos renseignements personnels très au sérieux. Cette politique explique comment nous recueillons, utilisons et protégeons vos données conformément à la Loi 25 (Québec) et à la LPRPDE (Canada).",
    sections: [
      ["1. Renseignements collectés", ["Identité et contact : nom, prénom, courriel, adresses de livraison et de facturation et téléphone.", "Données de paiement des achats : elles sont traitées de façon sécurisée par Shopify et ses fournisseurs. KinkoLab ne conserve jamais vos numéros de carte.", "Renseignements de versement : nom légal, qualité du bénéficiaire, courriel Wise, consentement, campagne, montant, statut, références et preuve du transfert. Les coordonnées bancaires sont fournies directement à Wise et ne sont jamais reçues ni conservées par KinkoLab ou Firebase.", "Données de navigation : adresse IP, type de navigateur et témoins de session nécessaires au fonctionnement et à l’amélioration du site."]],
      ["2. Utilisation de vos données", ["Traiter, expédier et suivre vos commandes.", "Calculer et attribuer le soutien destiné aux athlètes sélectionnés.", "Prévenir la fraude et assurer la sécurité des transactions."]],
      ["3. Partage et conservation", ["Nous ne vendons ni ne louons vos données. Elles sont partagées uniquement avec les fournisseurs nécessaires au service, notamment Shopify, Wise et les services de livraison, et conservées seulement pendant la durée requise par nos obligations légales, fiscales et opérationnelles.", "Le nom légal, le courriel, le montant et la référence de campagne sont communiqués à Wise pour préparer et exécuter le versement. Wise traite ensuite directement les coordonnées bancaires selon ses propres obligations.", "Avant toute communication hors Québec, KinkoLab évalue les facteurs relatifs à la vie privée, notamment la sensibilité, la finalité, les mesures de protection, le lieu de traitement et le cadre contractuel applicable."]],
      ["4. Communications liées au Programme Athlètes", ["Lorsque vous déposez une candidature ou participez à une campagne, KinkoLab peut vous envoyer les communications nécessaires à l’administration du programme : réception et décision concernant la candidature, avancement de la campagne, changements importants, fermeture de la campagne, suivi financier et versement des fonds.", "Les nouvelles concernant les prochaines campagnes, les nouvelles campagnes ouvertes, les activités ou les produits KinkoLab sont envoyées uniquement aux personnes ayant donné leur consentement facultatif à ces communications.", "Chaque communication promotionnelle identifie KinkoLab et comprend un mécanisme de désabonnement. Vous pouvez retirer votre consentement en tout temps; la demande sera traitée dans les délais prévus par la loi. Le retrait des communications promotionnelles n’empêche pas l’envoi des messages administratifs nécessaires à une campagne active.", "Nous conservons une preuve du consentement, notamment sa portée, sa date et la version du texte accepté, aussi longtemps que nécessaire pour gérer nos obligations."]],
      ["5. Vos droits", ["Vous pouvez demander l’accès, la rectification ou la suppression de vos renseignements personnels, ou retirer votre consentement lorsque la loi le permet."]],
    ],
    officer: "Responsable de la protection des renseignements personnels", contact: "Pour toute question ou demande relative à vos données, écrivez à :",
  },
  en: {
    title: "Privacy Policy", updated: "Last updated: August 2, 2026",
    intro: "At KinkoLab Inc., we take the protection of your personal information seriously. This policy explains how we collect, use and protect your data in accordance with Quebec’s Law 25 and Canada’s PIPEDA.",
    sections: [
      ["1. Information we collect", ["Identity and contact information: name, email, shipping and billing addresses, and phone number.", "Purchase payment information is securely processed by Shopify and its providers. KinkoLab never stores your card numbers.", "Payout information: legal name, beneficiary capacity, Wise email, consent, campaign, amount, status, transfer references and payment evidence. Bank details are provided directly to Wise and are never received or stored by KinkoLab or Firebase.", "Browsing data: IP address, browser type and session cookies required to operate and improve the website."]],
      ["2. How we use your information", ["Process, ship and track your orders.", "Calculate and allocate support for selected athletes.", "Prevent fraud and keep transactions secure."]],
      ["3. Sharing and retention", ["We do not sell or rent your data. It is shared only with service providers required to deliver the service, including Shopify, Wise and shipping providers, and retained only as long as required for legal, tax and operational purposes.", "Legal name, email, amount and campaign reference are communicated to Wise to prepare and execute the payout. Wise then processes bank details directly under its own obligations.", "Before information is communicated outside Quebec, KinkoLab assesses privacy factors including sensitivity, purpose, safeguards, processing location and the applicable contractual framework."]],
      ["4. Athlete Program communications", ["When you submit an application or participate in a campaign, KinkoLab may send communications required to administer the program, including application receipt and decisions, campaign progress, significant changes, campaign closure, financial updates and fund payments.", "News about upcoming campaigns, newly opened campaigns, KinkoLab activities or products is sent only to people who have provided optional consent to receive these communications.", "Every promotional communication identifies KinkoLab and includes an unsubscribe mechanism. You may withdraw consent at any time, and the request will be processed within the period required by law. Unsubscribing from promotional communications does not prevent necessary administrative messages about an active campaign.", "We retain evidence of consent, including its scope, date and the version of the accepted wording, for as long as needed to manage our obligations."]],
      ["5. Your rights", ["You may request access to, correction or deletion of your personal information, or withdraw consent where permitted by law."]],
    ],
    officer: "Privacy Officer", contact: "For questions or requests about your personal information, email:",
  },
};

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const page = copy[language];
  return <main className="min-h-screen bg-black px-5 py-16 text-white"><article className="mx-auto max-w-4xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-10">
    <h1 className="text-4xl font-black md:text-5xl">{page.title}</h1><p className="mt-3 text-zinc-400">{page.updated}</p>
    <p className="mt-8 leading-8 text-zinc-300">{page.intro}</p>
    {page.sections.map(([title, items]) => <section key={title}><h2 className="mt-10 text-2xl font-black" style={{ color: gold }}>{title}</h2><ul className="mt-4 list-disc space-y-3 pl-6 text-zinc-300">{items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}
    <section className="mt-10 rounded-2xl border border-zinc-700 bg-black p-6"><h2 className="text-xl font-black">{page.officer}</h2><p className="mt-3 text-zinc-300">{page.contact} <a className="font-bold underline" style={{ color: gold }} href="mailto:privacy@kinkolab.com">privacy@kinkolab.com</a></p></section>
  </article></main>;
}
