import type { Project } from "@/types";

export function calculateFocusScore(project: Project): number {
  const revenue = project.revenueScore ?? 5;
  const strategic = project.strategicImportance ?? 5;
  const excitement = project.excitementScore ?? 5;
  const readiness = project.launchReadinessScore ?? 5;
  const effort = project.effortScore ?? 5;

  return Math.round(
    revenue * 0.30 +
    strategic * 0.25 +
    excitement * 0.20 +
    readiness * 0.15 +
    (10 - effort) * 0.10
  );
}

export function enrichProjectWithScore(project: Project): Project {
  return { ...project, focusScore: calculateFocusScore(project) };
}
