import type { Project } from "@/types";

export function calculateFocusScore(project: Project): number {
  const revenue = project.revenueScore ?? 5;
  const strategic = project.strategicImportance ?? 5;
  const excitement = project.excitementScore ?? 5;
  const readiness = project.launchReadinessScore ?? 5;
  const effort = project.effortScore ?? 5;

  let score =
    revenue * 0.30 +
    strategic * 0.25 +
    excitement * 0.20 +
    readiness * 0.15 +
    (10 - effort) * 0.10;

  // Stage modifiers
  if (project.stage === "Ready for Build") score *= 1.10;
  if (project.stage === "Launch Prep") score *= 1.15;
  if (project.blockers && project.blockers.length > 0) score *= 0.80;

  return Math.min(10, Math.round(score));
}

export type HealthStatus = "green" | "yellow" | "red";

export function calculateHealth(project: Project): { status: HealthStatus; reasons: string[] } {
  const issues: string[] = [];

  if (!project.nextAction) issues.push("No next action set");
  if (project.blockers && project.blockers.length > 0) issues.push(`${project.blockers.length} blocker(s)`);

  const updatedAt = new Date(project.updatedAt).getTime();
  const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 14) issues.push("Not updated in 2+ weeks");

  if (!project.mvpDefinition && !project.featureRoadmap) issues.push("No roadmap defined");

  if (issues.length === 0) return { status: "green", reasons: ["On track"] };
  if (issues.length <= 2) return { status: "yellow", reasons: issues };
  return { status: "red", reasons: issues };
}

export function enrichProjectWithScore(project: Project): Project {
  return { ...project, focusScore: calculateFocusScore(project) };
}
