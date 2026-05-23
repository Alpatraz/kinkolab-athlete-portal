import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { cn, gold } from "../utils/format";

export default function LoginView({ goBack, setCurrentUser, openAdmin }) {
  const [role, setRole] = useState("athlete");

  function login() {
    const user = role === "admin" ? { name: "Admin KinkoLab", role: "admin" } : { name: "Athlète démo", role: "athlete" };
    setCurrentUser(user);

    if (role === "admin") openAdmin();
    else goBack();
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
        <button onClick={goBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white">
          <ArrowLeft size={17} /> Retour
        </button>

        <LockKeyhole size={38} style={{ color: gold }} />
        <h1 className="mt-4 text-4xl font-black">Connexion portail</h1>
        <p className="mt-3 text-zinc-400">Connexion simulée pour tester l’interface.</p>

        <div className="mt-8 grid gap-3">
          <button onClick={() => setRole("athlete")} className={cn("rounded-2xl border p-4 text-left", role === "athlete" ? "border-yellow-600 bg-black" : "border-zinc-800")}>
            Athlète
          </button>

          <button onClick={() => setRole("admin")} className={cn("rounded-2xl border p-4 text-left", role === "admin" ? "border-yellow-600 bg-black" : "border-zinc-800")}>
            Admin
          </button>
        </div>

        <button onClick={login} className="mt-6 w-full rounded-2xl px-5 py-4 font-black text-black" style={{ background: gold }}>
          Se connecter
        </button>
      </div>
    </main>
  );
}
