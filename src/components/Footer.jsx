<footer className="border-t border-zinc-800 bg-black text-zinc-400">
  <div className="mx-auto max-w-7xl px-6 py-12">

    <div className="grid gap-10 md:grid-cols-4">

      {/* Logo */}
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
            <p className="text-xs text-zinc-500">
              Programme Athlètes
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6">
          Soutenir les athlètes canadiens des arts martiaux
          grâce à des campagnes de financement transparentes
          et responsables.
        </p>
      </div>

      {/* Navigation */}
      <div>
        <h3 className="mb-4 font-bold text-white">
          Navigation
        </h3>

        <ul className="space-y-2 text-sm">
          <li>
            <button onClick={goHome} className="hover:text-white">
              Accueil
            </button>
          </li>

          <li>
            <button onClick={openAthletes} className="hover:text-white">
              Athlètes
            </button>
          </li>

          <li>
            <button onClick={openCampaigns} className="hover:text-white">
              Campagnes
            </button>
          </li>

          <li>
            <button onClick={openSignup} className="hover:text-white">
              Inscription
            </button>
          </li>
        </ul>
      </div>

      {/* Informations légales */}
      <div>
        <h3 className="mb-4 font-bold text-white">
          Informations
        </h3>

        <ul className="space-y-2 text-sm">
          <li>
            <button
              onClick={() => setPage("privacy")}
              className="hover:text-white"
            >
              Politique de confidentialité
            </button>
          </li>

          <li>
            <button
              onClick={() => setPage("terms")}
              className="hover:text-white"
            >
              Conditions d'utilisation
            </button>
          </li>

          <li>
            <button
              onClick={() => setPage("eligibility")}
              className="hover:text-white"
            >
              Admissibilité sportive
            </button>
          </li>

          <li>
            <button
              onClick={() => setPage("transparency")}
              className="hover:text-white"
            >
              Transparence financière
            </button>
          </li>
        </ul>
      </div>

      {/* Transparence */}
      <div>
        <h3 className="mb-4 font-bold text-white">
          Transparence
        </h3>

        <p className="text-sm leading-6">
          Les montants affichés sur les campagnes
          correspondent aux fonds suivis dans le cadre
          du programme et peuvent être ajustés en cas
          d'annulation, remboursement ou correction
          administrative.
        </p>

        <p className="mt-3 text-sm leading-6">
          Les versements demeurent soumis aux règles
          du Programme Athlètes KinkoLab.
        </p>
      </div>
    </div>

    <div className="mt-10 border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
      © {new Date().getFullYear()} KinkoLab — Programme Athlètes.
      Tous droits réservés.
    </div>

  </div>
</footer>
