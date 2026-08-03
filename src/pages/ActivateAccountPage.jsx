import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { gold } from "../utils/format";

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [account, setAccount] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      try {
        const response = await fetch(`/api/account-activation?token=${encodeURIComponent(token)}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Lien invalide.");
        if (!cancelled) setAccount(result);
      } catch (requestError) {
        if (!cancelled) setError(requestError.message || "Ce lien n’est plus valide.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    verify();
    return () => { cancelled = true; };
  }, [token]);

  async function activate(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/account-activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Activation impossible.");
      setComplete(true);
    } catch (requestError) {
      setError(requestError.message || "Activation impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[75vh] bg-black px-4 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-7 shadow-2xl md:p-10">
        {loading ? (
          <div className="flex items-center gap-3 py-16 text-zinc-300"><LoaderCircle className="animate-spin" /> Vérification du lien sécurisé…</div>
        ) : complete ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto" size={52} style={{ color: gold }} />
            <h1 className="mt-5 text-3xl font-black">Votre accès est prêt</h1>
            <p className="mt-4 text-zinc-300">Votre identifiant est <strong className="text-white">{account?.email}</strong>. Vous pouvez maintenant vous connecter avec le mot de passe que vous venez de créer.</p>
            <button onClick={() => navigate("/login")} className="mt-8 w-full rounded-2xl px-5 py-4 font-black text-black" style={{ background: gold }}>Se connecter</button>
          </div>
        ) : account ? (
          <>
            <KeyRound size={44} style={{ color: gold }} />
            <h1 className="mt-5 text-3xl font-black">Créez votre mot de passe</h1>
            <p className="mt-3 text-zinc-300">Votre identifiant de connexion :</p>
            <div className="mt-2 rounded-2xl border border-yellow-600/40 bg-yellow-500/10 p-4 font-black" style={{ color: gold }}>{account.email}</div>
            <form onSubmit={activate} className="mt-7 grid gap-4">
              <label><span className="mb-2 block text-sm font-bold">Nouveau mot de passe</span><input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-black p-4 outline-none focus:border-yellow-600" /></label>
              <p className="text-sm text-zinc-400">Au moins 12 caractères, avec une majuscule, une minuscule et un chiffre.</p>
              <label><span className="mb-2 block text-sm font-bold">Confirmer le mot de passe</span><input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-black p-4 outline-none focus:border-yellow-600" /></label>
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">{error}</div>}
              <button disabled={submitting} className="mt-2 w-full rounded-2xl px-5 py-4 font-black text-black disabled:opacity-60" style={{ background: gold }}>{submitting ? "Création…" : "Créer mon mot de passe"}</button>
            </form>
          </>
        ) : (
          <div className="text-center"><KeyRound className="mx-auto" size={44} style={{ color: gold }} /><h1 className="mt-5 text-3xl font-black">Lien non valide</h1><p className="mt-4 text-zinc-300">{error}</p><p className="mt-3 text-sm text-zinc-400">Demandez à un administrateur KinkoLab de vous renvoyer un accès. Seul le courriel le plus récent fonctionnera.</p></div>
        )}
      </section>
    </main>
  );
}
