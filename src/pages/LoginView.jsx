import { useState } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { gold } from "../utils/format";
import { auth, db } from "../firebase";

export default function LoginView({ goBack, setCurrentUser, openAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        throw new Error("Aucun profil utilisateur n’est associé à ce compte.");
      }

      const userData = userSnap.data();

      const connectedUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userData.name || firebaseUser.email,
        role: userData.role || "athlete",
      };

      setCurrentUser(connectedUser);

      if (connectedUser.role === "admin") {
        openAdmin();
      } else {
        goBack();
      }
    } catch (error) {
      console.error("Erreur connexion:", error);
      setErrorMessage(
        "Connexion impossible. Vérifie le courriel, le mot de passe et le rôle associé au compte."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-zinc-800 bg-zinc-950 p-8">
        <button
          onClick={goBack}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={17} /> Retour
        </button>

        <LockKeyhole size={38} style={{ color: gold }} />

        <h1 className="mt-4 text-4xl font-black">Connexion portail</h1>

        <p className="mt-3 text-zinc-400">
          Connectez-vous avec votre courriel et votre mot de passe.
        </p>

        <form onSubmit={login} className="mt-8 grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Courriel
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-yellow-600"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-zinc-300">
              Mot de passe
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-black p-4 text-white outline-none focus:border-yellow-600"
            />
          </label>

          {errorMessage && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl px-5 py-4 font-black text-black disabled:opacity-60"
            style={{ background: gold }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
