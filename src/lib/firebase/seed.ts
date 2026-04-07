import { createProject } from "./projects";
import { SEED_PROJECTS } from "@/data/seed";

export async function seedDemoProjects(userId: string): Promise<number> {
  let count = 0;
  for (const project of SEED_PROJECTS) {
    await createProject(userId, project);
    count++;
  }
  return count;
}
