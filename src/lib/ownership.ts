import { db } from "./db";

export async function ownedProject(projectId: string, userId: string) {
  return db.project.findFirst({ where: { id: projectId, userId } });
}
