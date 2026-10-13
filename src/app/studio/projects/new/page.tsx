import type { Metadata } from "next";
import { ProjectWizard } from "../../../../components/ProjectWizard";
export const metadata: Metadata = { title: "New project" };
export default function NewProjectPage() { return <ProjectWizard />; }
