import { TEAM_COUNT, TEAM_SIZE, TOTAL_STUDENTS } from "./config";
import type { Student, Team, TeamsResult } from "./types";

/** Unbiased random integer in [0, max). Uses the Web Crypto API when available. */
function randomInt(max: number): number {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const range = 0x100000000;
    const limit = range - (range % max); // rejection sampling removes modulo bias
    const buf = new Uint32Array(1);
    do {
      c.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** Fisher-Yates shuffle. Returns a new array and never mutates the input. */
export function shuffle<T>(array: readonly T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function teamName(index: number): string {
  return `Team ${String(index + 1).padStart(2, "0")}`;
}

/** Checks the student list before generating teams. Returns a list of problems (empty = valid). */
export function validateStudents(students: readonly Student[]): string[] {
  const errors: string[] = [];
  if (students.length !== TOTAL_STUDENTS) {
    errors.push(
      `Expected exactly ${TOTAL_STUDENTS} students but found ${students.length}.`
    );
  }
  const ids = new Set(students.map((s) => s.id));
  if (ids.size !== students.length) {
    errors.push("Some students share the same internal id.");
  }
  if (students.some((s) => s.name.trim() === "")) {
    errors.push("Every student needs a name.");
  }
  return errors;
}

/** Checks a finished allocation against the original student list. Returns problems (empty = valid). */
export function validateTeams(
  teams: readonly Team[],
  students: readonly Student[]
): string[] {
  const errors: string[] = [];
  if (teams.length !== TEAM_COUNT) {
    errors.push(`Expected ${TEAM_COUNT} teams but got ${teams.length}.`);
  }
  teams.forEach((team) => {
    if (team.members.length !== TEAM_SIZE) {
      errors.push(
        `${team.name} has ${team.members.length} students instead of ${TEAM_SIZE}.`
      );
    }
  });

  const placed = teams.flatMap((t) => t.members.map((m) => m.id));
  const unique = new Set(placed);
  if (placed.length !== TOTAL_STUDENTS) {
    errors.push(`Expected ${TOTAL_STUDENTS} placements but got ${placed.length}.`);
  }
  if (unique.size !== TOTAL_STUDENTS) {
    errors.push(
      `Expected ${TOTAL_STUDENTS} unique students but got ${unique.size}.`
    );
  }
  const original = new Set(students.map((s) => s.id));
  for (const id of unique) {
    if (!original.has(id)) {
      errors.push("A student in the teams is not in the uploaded list.");
      break;
    }
  }
  for (const id of original) {
    if (!unique.has(id)) {
      errors.push("A student from the uploaded list is missing from the teams.");
      break;
    }
  }
  return errors;
}

/** Shuffles the students and splits them into TEAM_COUNT teams of TEAM_SIZE. */
export function generateTeams(students: readonly Student[]): TeamsResult {
  const inputErrors = validateStudents(students);
  if (inputErrors.length > 0) return { ok: false, errors: inputErrors };

  const shuffled = shuffle(students);
  const teams: Team[] = [];
  for (let t = 0; t < TEAM_COUNT; t++) {
    teams.push({
      name: teamName(t),
      members: shuffled.slice(t * TEAM_SIZE, (t + 1) * TEAM_SIZE),
    });
  }

  const outputErrors = validateTeams(teams, students);
  if (outputErrors.length > 0) return { ok: false, errors: outputErrors };

  return { ok: true, teams };
}
