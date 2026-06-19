import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Flame,
  Handshake,
  Medal,
  ShieldCheck,
  Shirt,
  Star,
} from "lucide-react";
import { gold } from "../utils/format";

function CriteriaCard({ number, icon, title, items }) {
  return (
    <article className="relative min-h-[320px] border border-yellow-700/40 bg-zinc-950/40 p-8">
      <div className="text-4xl">{icon}</div>

      <div className="absolute right-8 top-8 text-7xl font-black text-yellow-900/10">
        {number}
      </div>

      <h3 className="mt-10 text-3xl font-light uppercase tracking-wide" style={{ color: gold }}>
        {title}
      </h3>

      <ul className="mt-8 space-y-3 text-lg leading-7 text-zinc-100">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ValueCard({ icon, label }) {
  return (
    <div className="border border-yellow-700/30 bg-zinc-950/40 p-8 text-center">
      <div className="text-4xl">{icon}</div>
      <p className="mt-8 text-xl text-white">{label}</p>
    </div>
  );
}

function LegalSection({ title, children }) {
  return (
    <section className="mt-14">
      <h3 className="text-xl font-black text-white">{title}</h3>
      <div className="mt-6 space-y-4 text-lg leading-9 text-zinc-200">
        {children}
      </div>
    </section>
  );
}

export default function EligibilityCriteriaPage({ goBack, openSignup }) {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          {goBack && (
            <button
              onClick={goBack}
              className="mb-10 text-sm font-black uppercase tracking-[0.18em] text-zinc-500 hover:text-white"
            >
              ← Retour
            </button>
          )}

          <p className="text-7xl font-black uppercase text-zinc-900 md:text-8xl">
            Critères
          </p>

          <h1
            className="-mt-5 text-5xl font-black uppercase italic md:text-6xl"
            style={{ color: gold }}
          >
            d’admissibilité
          </h1>

          <p className="mt-14 max-w-5xl text-xl leading-10 text-zinc-200">
            Les candidatures au Programme Athlètes KinkoLab sont évaluées selon
            différents critères. Notre objectif est de soutenir des athlètes,
            familles et projets qui représentent les valeurs du programme. Une
            candidature déposée ne garantit pas automatiquement l’acceptation au
            programme ni l’obtention d’un financement.
          </p>

          <div className="mt-20 grid gap-7 lg:grid-cols-2">
            <CriteriaCard
              number="01"
              icon="🥋"
              title="Sport admissible"
              items={[
                "Karaté",
                "Kickboxing",
                "Jiu-Jitsu",
                "Taekwondo",
                "Muay Thai",
                "Autres disciplines étudiées",
              ]}
            />

            <CriteriaCard
              number="02"
              icon="🏆"
              title="Objectif significatif"
              items={[
                "Championnat provincial",
                "Championnat national",
                "Sélections",
                "Championnat du monde",
                "Équipe nationale",
              ]}
            />

            <CriteriaCard
              number="03"
              icon="🔥"
              title="Engagement"
              items={[
                "Implication active",
                "Entraînement régulier",
                "Esprit sportif",
                "Attitude positive",
                "Persévérance",
              ]}
            />

            <CriteriaCard
              number="04"
              icon="👕"
              title="Participation supporters"
              items={[
                "Partager sa campagne",
                "Promouvoir les produits supporters",
                "Collaborer avec KinkoLab",
                "Participer au projet",
              ]}
            />

            <CriteriaCard
              number="05"
              icon="🇨🇦"
              title="Participation canadienne"
              items={[
                "Résident canadien",
                "Organisation canadienne",
                "Représentation canadienne",
              ]}
            />

            <CriteriaCard
              number="06"
              icon="📋"
              title="Évaluation"
              items={[
                "Qualité du dossier",
                "Objectif sportif",
                "Engagement",
                "Impact potentiel",
                "Ressources disponibles",
              ]}
            />
          </div>

          <section className="mt-20 border border-yellow-700/40 bg-zinc-950/40 p-8 md:p-12">
            <h2 className="text-4xl font-black" style={{ color: gold }}>
              Valeurs du programme
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-5">
              <ValueCard icon="🥋" label="Respect" />
              <ValueCard icon="🔥" label="Dépassement" />
              <ValueCard icon="🤝" label="Esprit d’équipe" />
              <ValueCard icon="⭐" label="Persévérance" />
              <ValueCard icon="🇨🇦" label="Fierté" />
            </div>
          </section>

          <div className="mt-16 bg-[#d1aa4a] p-8 text-xl font-black leading-9 text-black md:p-10">
            Le programme KinkoLab ne vise pas uniquement les champions. Nous
            croyons aussi aux athlètes en développement, aux familles impliquées
            et aux parcours inspirants.
          </div>

          <section className="mt-16 border border-yellow-700/40 bg-zinc-950/40 p-8 md:p-12">
            <h2 className="text-3xl font-light uppercase tracking-wide" style={{ color: gold }}>
              Conditions et engagements du programme
            </h2>

            <LegalSection title="Maintien de l’admissibilité">
              <p>
                KinkoLab se réserve le droit de refuser, suspendre ou révoquer
                l’inscription d’un athlète qui ne respecte pas les règles,
                engagements, conditions ou valeurs du programme.
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Comportement irrespectueux</li>
                <li>Fausses informations ou omissions importantes</li>
                <li>Utilisation abusive du programme</li>
                <li>Non-respect des engagements</li>
                <li>Attitude contraire aux valeurs sportives</li>
                <li>
                  Atteinte à l’image du programme, de KinkoLab ou des
                  partenaires associés
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="Nature du soutien financier">
              <p>
                Les montants affichés ou amassés dans le cadre du Programme
                Athlètes KinkoLab représentent des contributions au programme.
                Ils ne constituent pas une promesse de paiement automatique, un
                don de bienfaisance, un salaire, ni un remboursement garanti.
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Une portion des ventes de produits supporters peut contribuer
                  au Programme Athlètes KinkoLab.
                </li>
                <li>
                  Les produits communs alimentent le fonds commun du programme
                  concerné.
                </li>
                <li>
                  Les produits personnalisés peuvent alimenter un fonds associé à
                  l’athlète ou à la famille concernée.
                </li>
                <li>
                  Les montants attribués sont soumis aux règles, critères,
                  ressources disponibles et modalités du programme.
                </li>
                <li>
                  Une candidature acceptée ne garantit pas un montant fixe de
                  financement.
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="Versement des fonds">
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  KinkoLab administre les fonds recueillis dans le cadre du
                  programme.
                </li>
                <li>Les fonds peuvent être versés en un ou plusieurs paiements.</li>
                <li>
                  KinkoLab peut demander des justificatifs liés aux dépenses
                  sportives admissibles.
                </li>
                <li>
                  Les versements peuvent être remis à l’athlète, à un parent ou
                  tuteur légal, ou appliqués directement à certaines dépenses
                  liées à la compétition.
                </li>
                <li>
                  KinkoLab peut verser certains montants directement à des
                  fournisseurs, organisateurs, clubs, hôtels, transporteurs ou
                  organismes liés à la compétition.
                </li>
                <li>
                  Les fonds peuvent servir notamment aux inscriptions,
                  déplacements, hébergement, équipement, uniformes et frais liés à
                  la saison sportive.
                </li>
                <li>
                  Les fonds non attribués, non réclamés ou non admissibles
                  peuvent demeurer dans le Programme Athlètes KinkoLab ou être
                  réaffectés selon les règles du programme.
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="Délais des produits supporters">
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Les t-shirts, hoodies et produits supporters sont généralement
                  produits à la demande.
                </li>
                <li>
                  Le délai moyen de production est estimé entre 7 et 15 jours
                  ouvrables.
                </li>
                <li>
                  Les produits personnalisés peuvent nécessiter un délai
                  supplémentaire.
                </li>
                <li>
                  Les délais peuvent varier selon la disponibilité des produits,
                  la personnalisation, le volume de commandes et les périodes de
                  forte demande.
                </li>
                <li>
                  KinkoLab ne garantit pas une livraison avant une compétition ou
                  un événement si la commande est passée trop tardivement.
                </li>
                <li>Les délais de livraison s’ajoutent aux délais de production.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Images, noms et promotion">
              <p>
                En participant au programme, l’athlète ou son représentant
                autorisé pourrait être invité à fournir des informations, photos
                ou éléments de présentation permettant de promouvoir sa campagne.
                L’utilisation de ces éléments doit être autorisée par l’athlète
                ou, lorsque requis, par un parent ou tuteur légal.
              </p>
            </LegalSection>

            <LegalSection title="Modification du programme">
              <p>
                KinkoLab se réserve le droit d’ajuster les règles, conditions,
                critères, délais, méthodes de répartition ou fonctionnement du
                Programme Athlètes afin d’assurer son équité, sa conformité, sa
                viabilité et sa pérennité.
              </p>
            </LegalSection>

            <div className="mt-14 border-l-4 border-yellow-600 bg-black p-6 text-lg leading-8 text-zinc-300">
              <strong style={{ color: gold }}>Note importante :</strong>{" "}
              Le Programme Athlètes KinkoLab est un programme privé de soutien lié
              à la vente de produits supporters. Les montants et modalités peuvent
              varier selon les campagnes, les ventes réalisées, les dépenses
              admissibles, les ressources disponibles et les règles applicables à
              chaque programme.
            </div>
          </section>

          {openSignup && (
            <div className="mt-14 text-center">
              <button
                onClick={openSignup}
                className="inline-flex items-center gap-3 px-10 py-5 text-lg font-black uppercase text-black"
                style={{ background: gold }}
              >
                Soumettre une candidature
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
