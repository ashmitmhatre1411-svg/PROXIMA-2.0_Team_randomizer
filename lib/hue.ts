import { TEAM_COUNT } from "./config";

/** Blue-to-purple hue for a team index, so each card is distinct but on-palette. */
export function teamHue(index: number): number {
  const start = 205;
  const end = 292;
  return Math.round(start + (index * (end - start)) / Math.max(1, TEAM_COUNT - 1));
}
