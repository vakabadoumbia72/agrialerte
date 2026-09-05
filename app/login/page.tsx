"use client";

import { FormEvent, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.code === "email_not_confirmed"
            ? "Votre adresse email n’est pas confirmée. Vérifiez votre boîte de réception Supabase ou confirmez l’utilisateur dans Authentication > Users."
            : "Email ou mot de passe incorrect.",
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 0));
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Erreur de connexion Supabase.", error);
      setErrorMessage("Le service de connexion est temporairement indisponible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 text-green-400">
      <div className="w-full max-w-md rounded-2xl border border-green-900 bg-zinc-950 p-6 shadow-2xl shadow-green-950/30 sm:p-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-green-500">
          AgriAlerte
        </p>
        <h1 className="mb-8 text-3xl font-bold text-green-300">Connexion</h1>
        <form onSubmit={signIn} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-green-900 bg-black px-4 py-3 text-green-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-green-900 bg-black px-4 py-3 text-green-200 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-400" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-green-500 px-4 py-3 font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
