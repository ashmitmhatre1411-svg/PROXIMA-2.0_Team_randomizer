import { STORAGE_KEY } from "./config";
import type { Student, Team } from "./types";
import { validateStudents, validateTeams } from "./teams";

export interface SavedSession {
  fileName: string;
  students: Student[];
  hasRoll: boolean;
  warnings: string[];
  teams: Team[] | null;
  locked: boolean;
}

function isStudent(v: unknown): v is Student {
  const s = v as Student;
  return (
    !!s &&
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.roll === "string"
  );
}

/** Loads and re-validates a saved session. Anything inconsistent is discarded. */
export function loadSession(): SavedSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedSession;

    if (!Array.isArray(data.students) || !data.students.every(isStudent)) return null;
    if (validateStudents(data.students).length > 0) return null;

    let teams: Team[] | null = null;
    if (data.teams) {
      const ok =
        Array.isArray(data.teams) &&
        data.teams.every(
          (t) =>
            typeof t.name === "string" &&
            Array.isArray(t.members) &&
            t.members.every(isStudent)
        );
      if (!ok || validateTeams(data.teams, data.students).length > 0) return null;
      teams = data.teams;
    }

    return {
      fileName: typeof data.fileName === "string" ? data.fileName : "students.csv",
      students: data.students,
      hasRoll: !!data.hasRoll,
      warnings: Array.isArray(data.warnings)
        ? data.warnings.filter((w) => typeof w === "string")
        : [],
      teams,
      locked: !!data.locked && teams !== null,
    };
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable (private mode, quota) - the app still works without it */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
