import { redirect } from "next/navigation";
import { currentUser } from "../../lib/auth";
import { StudioShell } from "../../components/StudioShell";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return <StudioShell userName={user.name}>{children}</StudioShell>;
}
