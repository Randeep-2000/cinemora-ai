"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ defaultMode }: { defaultMode: "login" | "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState(defaultMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Authentication failed.");
      router.push("/studio"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <div className="auth-form-wrap"><div className="auth-kicker">YOUR PRODUCTION DESK</div><h2>{mode === "register" ? "Create your account" : "Welcome back"}</h2><p className="muted">{mode === "register" ? "A place for every story you want to tell." : "Pick up where your last cut left off."}</p><form onSubmit={submit} className="stack-form">{mode === "register" && <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={80} placeholder="Alex Morgan" /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label>Password<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 12 : 1} maxLength={128} placeholder={mode === "register" ? "At least 12 characters" : "Your password"} /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-primary button-wide" disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"} <span>↗</span></button></form><p className="auth-toggle">{mode === "register" ? "Already have an account?" : "New to CINEMORA?"} <button onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>{mode === "register" ? "Sign in" : "Create an account"}</button></p><p className="auth-security">Your work is private to your account.</p></div>;
}
