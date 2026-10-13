import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";

export const metadata: Metadata = { title: "Sign in" };
type Props = { searchParams: Promise<{ mode?: string }> };
export default async function SignInPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  return <main className="auth-page"><div className="auth-art"><Link className="brand" href="/"><span className="brand-mark">C</span><span><strong>CINEMORA</strong><small>AI FILMMAKER STUDIO</small></span></Link><div className="auth-art-copy"><div className="eyebrow">EVERY GREAT FILM STARTS SOMEWHERE</div><h1>Begin with<br />a <em>story.</em></h1><p>Make space for the idea that has been living in your head.</p></div><span className="auth-credit">A STUDIO FOR WHAT COMES NEXT</span></div><section className="auth-panel"><AuthForm defaultMode={mode === "register" ? "register" : "login"} /></section></main>;
}
