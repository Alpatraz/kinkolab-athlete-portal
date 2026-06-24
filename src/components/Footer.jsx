import { gold } from "../utils/format";

export default function Footer({
  goHome,
  openAthletes,
  openCampaigns,
  openSignup,
  openPrivacy,
  openTerms,
  openEligibility,
  openTransparency,
}) {
  return (
    <footer className="border-t border-zinc-800 bg-black text-zinc-400">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl font-black text-black"
                style={{ background: gold }}
              >
                K
              </div>
              <div>
                <p className="font-black text-white">KinkoLab</p>
                <p className="text-xs text-zinc-500">Programme Athlètes</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6">
              Soutenir les athlètes canadiens des arts martiaux grâce à des
              campagnes de financement transparentes et responsables.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={goHome} className="hover:text-white">Accueil</button></li>
              <li><button onClick={openAthletes} className="hover:text-white">Athlètes</button></li>
              <li><button onClick={openCampaigns} className="hover:text-white">Campagnes</button></li>
              <li><button onClick={openSignup} className="hover:text-white">Inscription</button></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Informations</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={openPrivacy} className="hover:text-white">Politique de confidentialité</button></li>
              <li><button onClick={openTerms} className="hover:text-white">Conditions d'utilisation</button></li>
              <li><button onClick={openEligibility} className="hover:text-white">Admissibilité sportive</button></li>
              <li><button onClick={openTransparency} className="hover:text-white">Transparence financière</button></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-bold text-white">Transparence</h3>
            <p className="text-sm leading-6">
              Les montants affichés correspondent aux fonds suivis dans le cadre
              du programme et peuvent être ajustés en cas d'annulation,
              remboursement ou correction administrative.
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} KinkoLab — Programme Athlètes. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
