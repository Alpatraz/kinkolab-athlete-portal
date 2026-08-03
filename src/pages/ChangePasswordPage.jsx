import { useState } from "react";
import { KeyRound } from "lucide-react";
import { updatePassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { gold } from "../utils/format";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) return setError("Les deux mots de passe ne correspondent pas.");
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return setError("Utilisez au moins 12 caractères, une majuscule, une minuscule et un chiffre.");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Votre session a expiré. Reconnectez-vous.");
      await updatePassword(user, password);
      const changedAt = new Date();
      const expiresAt = new Date(changedAt); expiresAt.setMonth(expiresAt.getMonth() + 6);
      await setDoc(doc(db, "users", user.uid), { mustChangePassword: false, passwordChangedAt: changedAt.toISOString(), passwordExpiresAt: expiresAt.toISOString(), updatedAt: serverTimestamp() }, { merge: true });
      await signOut(auth);
      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch (changeError) {
      setError(changeError?.code === "auth/requires-recent-login" ? "Pour votre sécurité, reconnectez-vous puis recommencez." : (changeError.message || "Le mot de passe n’a pas pu être modifié."));
    } finally { setLoading(false); }
  }

  return <main className="min-h-[75vh] bg-black px-4 py-12 text-white"><section className="mx-auto max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-7 md:p-10"><KeyRound size={44} style={{ color: gold }} /><h1 className="mt-5 text-3xl font-black">Renouvelez votre mot de passe</h1><p className="mt-3 text-zinc-300">Pour protéger votre espace, KinkoLab exige un nouveau mot de passe tous les six mois.</p><form onSubmit={submit} className="mt-7 grid gap-4"><label><span className="mb-2 block text-sm font-bold">Nouveau mot de passe</span><input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-black p-4 outline-none focus:border-yellow-600" /></label><p className="text-sm text-zinc-400">Au moins 12 caractères, avec une majuscule, une minuscule et un chiffre.</p><label><span className="mb-2 block text-sm font-bold">Confirmer le mot de passe</span><input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-2xl border border-zinc-700 bg-black p-4 outline-none focus:border-yellow-600" /></label>{error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">{error}</div>}<button disabled={loading} className="mt-2 rounded-2xl px-5 py-4 font-black text-black disabled:opacity-60" style={{ background: gold }}>{loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}</button></form></section></main>;
}
