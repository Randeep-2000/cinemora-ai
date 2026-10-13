"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const main = [{ href: "/studio", label: "Overview", icon: "◫" }, { href: "/studio/projects", label: "Projects", icon: "▤" }, { href: "/studio/assets", label: "Media library", icon: "▧" }, { href: "/studio/jobs", label: "Job history", icon: "◷" }];
const create = [{ href: "/studio/characters", label: "Character studio", icon: "◉" }, { href: "/studio/world", label: "World builder", icon: "◇" }, { href: "/studio/voice", label: "Voice studio", icon: "〰" }, { href: "/studio/music", label: "Music studio", icon: "♫" }];

export function StudioShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter();
  async function signOut() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  function nav(items: typeof main) { return items.map((item) => <Link key={item.href} href={item.href} className={`studio-nav-link ${pathname === item.href ? "selected" : ""}`}><span className="nav-icon">{item.icon}</span>{item.label}</Link>); }
  return <div className="studio-app"><aside className="studio-sidebar"><Link href="/studio" className="brand studio-brand"><span className="brand-mark">C</span><span><strong>CINEMORA</strong><small>AI FILM STUDIO</small></span></Link><div className="workspace-switch"><span className="workspace-avatar">{userName.slice(0,1).toUpperCase()}</span><span><b>My studio</b><small>Personal workspace</small></span><span className="chevron">⌄</span></div><div className="nav-group"><div className="nav-label">STUDIO</div>{nav(main)}</div><div className="nav-group"><div className="nav-label">CREATIVE TOOLS</div>{nav(create)}</div><div className="sidebar-spacer"/><Link className={`studio-nav-link ${pathname === "/studio/settings" ? "selected" : ""}`} href="/studio/settings"><span className="nav-icon">⚙</span>Settings</Link><button className="account-row" onClick={signOut}><span className="workspace-avatar account-avatar">{userName.slice(0,1).toUpperCase()}</span><span><b>{userName}</b><small>Sign out</small></span><span className="account-menu">↗</span></button></aside><main className="studio-main"><header className="studio-topbar"><div className="crumb"><span>MY STUDIO</span><i>/</i><b>{pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "overview"}</b></div><div className="topbar-right"><span className="quiet-status"><i/> All changes saved</span><div className="user-mini">{userName.slice(0,1).toUpperCase()}</div></div></header><div className="studio-content">{children}</div></main></div>;
}
