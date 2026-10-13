import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CINEMORA AI — Film Studio", template: "%s · CINEMORA AI" },
  description: "Write, storyboard, score, edit and export films with an AI-assisted production studio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
