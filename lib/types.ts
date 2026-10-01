export interface Student {
  /** Stable internal id, unique per uploaded row. */
  id: string;
  name: string;
  /** Empty string when the CSV has no roll number for this student. */
  roll: string;
}

export interface Team {
  /** "Team 01" ... "Team 15" */
  name: string;
  members: Student[];
}

export type ParseResult =
  | {
      ok: true;
      students: Student[];
      hasRoll: boolean;
      warnings: string[];
    }
  | { ok: false; errors: string[] };

export type TeamsResult =
  | { ok: true; teams: Team[] }
  | { ok: false; errors: string[] };
