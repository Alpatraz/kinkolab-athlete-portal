import { LogIn } from "lucide-react";
import { gold } from "../utils/format";

export default function Header({
  goHome,
  openAthletes,
  openCampaigns,
  openSignup,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/90 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button onClick={goHome} className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl font-black text-black"
            style={{ background: gold }}
          >
            K
          </div>

          <div className="text-left">
            <p className="text-lg font-black">KinkoLab</p>
            <p className="text-xs text-zinc-400">Programme Athlètes</p>
          </div>
        </button>

        <div className="hidden gap-2 lg:flex">
          <button onClick={goHome}>Accueil</button>
          <button onClick={openAthletes}>Athlètes</button>
          <button onClick={openCampaigns}>Campagnes</button>
          <button onClick={openSignup}>Inscription</button>
        </div>

        <button
          className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-black"
          style={{ background: gold }}
        >
          <LogIn size={16} />
          Connexion
        </button>
      </div>
    </header>
  );
}
