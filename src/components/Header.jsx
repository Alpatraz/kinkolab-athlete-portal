import { LogIn } from "lucide-react";
import { gold } from "../utils/format";

export default function Header({
  currentUser,
  setCurrentUser,
  goHome,
  openLogin,
  openSignup,
  openCampaigns,
  openAthletes,
  openAdmin,
  openDashboard
}) {
  const isAdmin = currentUser?.role === "admin";

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/90 px-4 py-3 text-white backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button onClick={goHome} className="flex items-center gap-3 text-left">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl font-black text-black"
            style={{ background: gold }}
          >
            K
          </div>

          <div>
            <p className="text-lg font-black tracking-wide">KinkoLab</p>
            <p className="text-xs text-zinc-400">Programme Athlètes</p>
          </div>
        </button>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={goHome}
            className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Accueil
          </button>

          <button
            onClick={openAthletes}
            className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Athlètes
          </button>

          <button
            onClick={openCampaigns}
            className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Campagnes
          </button>

          {currentUser && (
            <button
              onClick={openDashboard}
              className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Mon espace
            </button>
          )}

          <button
            onClick={openSignup}
            className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Inscription
          </button>

          {isAdmin && (
            <button
              onClick={openAdmin}
              className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Admin
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={() => setCurrentUser(null)}
              className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
            >
              Déconnexion
            </button>
          ) : (
            <button
              onClick={openLogin}
              className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-black"
              style={{ background: gold }}
            >
              <LogIn size={17} />
              Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
