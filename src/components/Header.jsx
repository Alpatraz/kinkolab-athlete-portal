import { useState } from "react";
import { ExternalLink, LogIn, Menu, X } from "lucide-react";
import { gold } from "../utils/format";
import { useLanguage } from "../context/LanguageContext";

export default function Header({
  currentUser,
  setCurrentUser,
  goHome,
  openLogin,
  openSignup,
  openCampaigns,
  openAthletes,
  openAdmin,
  openDashboard,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = currentUser?.role === "admin";
  const { language, setLanguage, t } = useLanguage();

  const LanguageSelector = ({ mobile = false }) => (
    <div className={`${mobile ? "w-full justify-center rounded-3xl px-6 py-4 text-lg" : "rounded-2xl px-3 py-2 text-sm"} flex items-center gap-2 border border-zinc-700 bg-zinc-950 font-black`} aria-label={t("language.selector")}>
      <button type="button" onClick={() => setLanguage("fr")} className={language === "fr" ? "text-yellow-400" : "text-zinc-400 hover:text-white"} aria-pressed={language === "fr"}>FR</button>
      <span className="text-zinc-600" aria-hidden="true">/</span>
      <button type="button" onClick={() => setLanguage("en")} className={language === "en" ? "text-yellow-400" : "text-zinc-400 hover:text-white"} aria-pressed={language === "en"}>EN</button>
    </div>
  );

  function closeAndRun(action) {
    setMobileOpen(false);
    action?.();
  }

  return (
    <header data-i18n-managed className="sticky top-0 z-50 border-b border-zinc-800 bg-black/95 px-4 py-3 text-white backdrop-blur md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button onClick={() => closeAndRun(goHome)} className="flex items-center gap-3 text-left">
          <div>
            <div className="flex h-11 items-center rounded-xl bg-white px-3">
              <img src="/images/kinko-logo.png" alt="Kinko" className="h-7 w-auto" />
            </div>
            <p className="text-xs text-zinc-400">{t("brand.program")}</p>
          </div>
        </button>

        <nav className="hidden items-center gap-2 lg:flex">
          <button onClick={goHome} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
            {t("nav.home")}
          </button>

          <button onClick={openAthletes} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
            {t("nav.athletes")}
          </button>

          <button onClick={openCampaigns} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
            {t("nav.campaigns")}
          </button>

          {currentUser && (
            <button onClick={openDashboard} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
              {t("nav.dashboard")}
            </button>
          )}

          <button onClick={openSignup} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
            {t("nav.signup")}
          </button>

          {isAdmin && (
            <button onClick={openAdmin} className="rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
              Admin
            </button>
          )}

          <a href="https://kinkolab.com" className="inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-900 hover:text-white">
            KinkoLab.com <ExternalLink size={14} aria-hidden="true" />
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <div className="hidden lg:block">
            {currentUser ? (
              <button
                onClick={() => setCurrentUser(null)}
                className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
              >
                {t("nav.logout")}
              </button>
            ) : (
              <button
                onClick={openLogin}
                className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-black"
                style={{ background: gold }}
              >
                <LogIn size={17} />
                {t("nav.login")}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-white lg:hidden"
            aria-label={t("nav.openMenu")}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
  <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl lg:hidden">
    <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-3">
        <div>
          <div className="flex h-11 items-center rounded-xl bg-white px-3">
            <img src="/images/kinko-logo.png" alt="Kinko" className="h-7 w-auto" />
          </div>
          <p className="text-xs text-zinc-400">
            {t("brand.program")}
          </p>
        </div>
      </div>

      <button
        onClick={() => setMobileOpen(false)}
        className="flex h-14 w-14 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950 text-white"
      >
        <X size={28} />
      </button>
    </div>

    <nav className="p-5 space-y-4">
      <LanguageSelector mobile />
      <button
        onClick={() => closeAndRun(goHome)}
        className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
      >
        {t("nav.home")}
      </button>

      <button
        onClick={() => closeAndRun(openAthletes)}
        className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
      >
        {t("nav.athletes")}
      </button>

      <button
        onClick={() => closeAndRun(openCampaigns)}
        className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
      >
        {t("nav.campaigns")}
      </button>

      {currentUser && (
        <button
          onClick={() => closeAndRun(openDashboard)}
          className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
        >
          {t("nav.dashboard")}
        </button>
      )}

      <button
        onClick={() => closeAndRun(openSignup)}
        className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
      >
        {t("nav.signup")}
      </button>

      {isAdmin && (
        <button
          onClick={() => closeAndRun(openAdmin)}
          className="w-full rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
        >
          Admin
        </button>
      )}

      <a
        href="https://kinkolab.com"
        className="flex w-full items-center justify-between rounded-3xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-left text-xl font-black text-white shadow-xl"
      >
        KinkoLab.com <ExternalLink size={20} aria-hidden="true" />
      </a>

      <div className="pt-4">
        {currentUser ? (
          <button
            onClick={() => {
              setMobileOpen(false);
              setCurrentUser(null);
            }}
            className="w-full rounded-3xl bg-zinc-900 px-6 py-5 text-xl font-black text-white"
          >
            {t("nav.logout")}
          </button>
        ) : (
          <button
            onClick={() => closeAndRun(openLogin)}
            className="flex w-full items-center justify-center gap-3 rounded-3xl px-6 py-5 text-xl font-black text-black shadow-xl"
            style={{ background: gold }}
          >
            <LogIn size={22} />
            {t("nav.login")}
          </button>
        )}
      </div>
    </nav>
  </div>
)}
    </header>
  );
}
