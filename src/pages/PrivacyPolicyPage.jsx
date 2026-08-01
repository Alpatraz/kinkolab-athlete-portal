import { useLanguage } from "../context/LanguageContext";
import { gold } from "../utils/format";

const copy = {
  fr: {
    title: "Politique de confidentialité", updated: "Dernière mise à jour : 24 juin 2026",
    intro: "Chez KinkoLab Inc., nous prenons la protection de vos renseignements personnels très au sérieux. Cette politique explique comment nous recueillons, utilisons et protégeons vos données conformément à la Loi 25 (Québec) et à la LPRPDE (Canada).",
    sections: [
      ["1. Renseignements collectés", ["Identité et contact : nom, prénom, courriel, adresses de livraison et de facturation et téléphone.", "Données de paiement : elles sont traitées de façon sécurisée par Stripe. KinkoLab ne conserve jamais vos numéros de carte.", "Données de navigation : adresse IP, type de navigateur et témoins de session nécessaires au fonctionnement et à l’amélioration du site."]],
      ["2. Utilisation de vos données", ["Traiter, expédier et suivre vos commandes.", "Calculer et attribuer le soutien destiné aux athlètes sélectionnés.", "Prévenir la fraude et assurer la sécurité des transactions."]],
      ["3. Partage et conservation", ["Nous ne vendons ni ne louons vos données. Elles sont partagées uniquement avec les fournisseurs nécessaires au service, notamment Stripe et les services de livraison, et conservées seulement pendant la durée requise par nos obligations légales et opérationnelles."]],
      ["4. Vos droits", ["Vous pouvez demander l’accès, la rectification ou la suppression de vos renseignements personnels, ou retirer votre consentement lorsque la loi le permet."]],
    ],
    officer: "Responsable de la protection des renseignements personnels", contact: "Pour toute question ou demande relative à vos données, écrivez à :",
  },
  en: {
    title: "Privacy Policy", updated: "Last updated: June 24, 2026",
    intro: "At KinkoLab Inc., we take the protection of your personal information seriously. This policy explains how we collect, use and protect your data in accordance with Quebec’s Law 25 and Canada’s PIPEDA.",
    sections: [
      ["1. Information we collect", ["Identity and contact information: name, email, shipping and billing addresses, and phone number.", "Payment information: payments are securely processed by Stripe. KinkoLab never stores your card numbers.", "Browsing data: IP address, browser type and session cookies required to operate and improve the website."]],
      ["2. How we use your information", ["Process, ship and track your orders.", "Calculate and allocate support for selected athletes.", "Prevent fraud and keep transactions secure."]],
      ["3. Sharing and retention", ["We do not sell or rent your data. It is shared only with service providers required to deliver the service, including Stripe and shipping providers, and retained only as long as required for legal and operational purposes."]],
      ["4. Your rights", ["You may request access to, correction or deletion of your personal information, or withdraw consent where permitted by law."]],
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
