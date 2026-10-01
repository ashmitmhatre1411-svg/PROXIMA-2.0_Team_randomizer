import Papa from "papaparse";
import { TOTAL_STUDENTS } from "./config";
import type { ParseResult, Student, Team } from "./types";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

const NAME_HEADERS = new Set([
  "name",
  "student name",
  "students name",
  "full name",
  "fullname",
  "student",
  "students",
  "candidate name",
  "participant name",
  "participant",
]);

const normalizeHeader = (s: string): string =>
  s
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const cleanName = (s: string): string =>
  s.normalize("NFC").replace(/\s+/g, " ").trim();

const cleanRoll = (s: string): string => s.replace(/\s+/g, " ").trim();

function formatRows(rows: number[], limit = 8): string {
  const shown = rows.slice(0, limit).join(", ");
  return rows.length > limit ? `${shown} and ${rows.length - limit} more` : shown;
}

/** Parses CSV text into students. Pure function: no DOM access, easy to test. */
export function parseStudentCsv(text: string, fileName: string): ParseResult {
  if (!/\.csv$/i.test(fileName)) {
    return {
      ok: false,
      errors: [`"${fileName}" is not a CSV file. Upload a file ending in .csv.`],
    };
  }

  const clean = text.replace(/^\uFEFF/, "");
  if (clean.trim() === "") {
    return { ok: false, errors: ["The CSV file is empty."] };
  }

  const parsed = Papa.parse<string[]>(clean, { skipEmptyLines: false });
  const quoteError = parsed.errors.find((e) => e.type === "Quotes");
  if (quoteError) {
    return {
      ok: false,
      errors: [
        `The CSV could not be read (${quoteError.message}, near row ${
          (quoteError.row ?? 0) + 1
        }). Check for unclosed quotation marks.`,
      ],
    };
  }

  const isBlank = (row: string[]) => row.every((c) => (c ?? "").trim() === "");
  const allRows = parsed.data.map((cells, i) => ({ cells, rowNumber: i + 1 }));
  const nonBlank = allRows.filter((r) => !isBlank(r.cells));

  if (nonBlank.length === 0) {
    return { ok: false, errors: ["The CSV file is empty."] };
  }

  const headerRow = nonBlank[0];
  const dataRows = nonBlank.slice(1);
  const headers = headerRow.cells.map((c) => normalizeHeader(c ?? ""));
  const warnings: string[] = [];

  if (dataRows.length === 0) {
    return {
      ok: false,
      errors: [
        "The CSV only has a header row. Add one row per student below it.",
      ],
    };
  }

  // 1. Find the name column.
  let nameIdx = headers.findIndex((h) => NAME_HEADERS.has(h));
  if (nameIdx === -1) {
    nameIdx = headers.findIndex((h) => h.includes("name"));
  }
  if (nameIdx === -1) {
    // Fall back to the column that looks most like text rather than numbers.
    const width = Math.max(...nonBlank.map((r) => r.cells.length));
    let best = -1;
    let bestScore = 0.6;
    for (let c = 0; c < width; c++) {
      const hits = dataRows.filter((r) => {
        const v = (r.cells[c] ?? "").trim();
        return /\p{L}/u.test(v) && !/^\d+$/.test(v);
      }).length;
      const score = hits / dataRows.length;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    if (best === -1) {
      return {
        ok: false,
        errors: [
          'No student name column found. Add a header row with a column called "Name".',
        ],
      };
    }
    nameIdx = best;
    warnings.push(
      `No "Name" header found, so column ${best + 1} was used for student names.`
    );
  }

  // 2. Find the optional roll number column.
  const rollIdx = headers.findIndex(
    (h, i) =>
      i !== nameIdx &&
      /\b(roll|reg|registration|enrol|enrolment|enrollment|prn|usn|id)\b/.test(h)
  );
  const hasRoll = rollIdx !== -1;

  // 3. Build the student list and collect every problem in one pass.
  const errors: string[] = [];
  const students: Student[] = [];
  const missingNameRows: number[] = [];
  const missingRollRows: number[] = [];

  dataRows.forEach((row, i) => {
    const name = cleanName(row.cells[nameIdx] ?? "");
    const roll = hasRoll ? cleanRoll(row.cells[rollIdx] ?? "") : "";
    if (name === "") {
      missingNameRows.push(row.rowNumber);
      return;
    }
    if (hasRoll && roll === "") missingRollRows.push(row.rowNumber);
    students.push({ id: `s${i + 1}`, name, roll });
  });

  if (missingNameRows.length > 0) {
    errors.push(
      `Missing student name in row${missingNameRows.length > 1 ? "s" : ""} ${formatRows(
        missingNameRows
      )}.`
    );
  }

  const studentRowCount = dataRows.length;
  if (studentRowCount !== TOTAL_STUDENTS) {
    const diff = Math.abs(studentRowCount - TOTAL_STUDENTS);
    errors.push(
      `Found ${studentRowCount} students but exactly ${TOTAL_STUDENTS} are required (${diff} ${
        studentRowCount < TOTAL_STUDENTS ? "missing" : "too many"
      }).`
    );
  }

  // Duplicate detection: roll number identifies a student when present, otherwise the name does.
  const byKey = new Map<string, { label: string; rows: number[] }>();
  dataRows.forEach((row) => {
    const name = cleanName(row.cells[nameIdx] ?? "");
    if (name === "") return;
    const roll = hasRoll ? cleanRoll(row.cells[rollIdx] ?? "") : "";
    const key = roll !== "" ? `roll:${roll.toLowerCase()}` : `name:${name.toLowerCase()}`;
    const label =
      roll !== "" ? `roll number "${roll}"` : `student "${name}" (no roll number)`;
    const entry = byKey.get(key) ?? { label, rows: [] };
    entry.rows.push(row.rowNumber);
    byKey.set(key, entry);
  });
  for (const { label, rows } of byKey.values()) {
    if (rows.length > 1) {
      errors.push(`Duplicate ${label} in rows ${formatRows(rows)}.`);
    }
  }

  // Same name with different roll numbers is allowed but worth flagging.
  if (hasRoll) {
    const names = new Map<string, { name: string; count: number }>();
    students.forEach((s) => {
      const k = s.name.toLowerCase();
      const e = names.get(k) ?? { name: s.name, count: 0 };
      e.count += 1;
      names.set(k, e);
    });
    for (const { name, count } of names.values()) {
      if (count > 1) {
        warnings.push(
          `The name "${name}" appears ${count} times with different roll numbers. They are treated as separate students.`
        );
      }
    }
    if (missingRollRows.length > 0) {
      warnings.push(
        `Roll number is blank in row${missingRollRows.length > 1 ? "s" : ""} ${formatRows(
          missingRollRows
        )}. Those students are identified by name only.`
      );
    }
  } else {
    warnings.push("No roll number column found. Teams will list names only.");
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, students, hasRoll, warnings };
}

/** Reads a File in the browser and parses it. */
export async function parseStudentFile(file: File): Promise<ParseResult> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      errors: ["The file is larger than 2 MB. Upload the student list only."],
    };
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, errors: ["The file could not be read. Try again."] };
  }
  return parseStudentCsv(text, file.name);
}

/** Escapes one CSV cell. Also defuses spreadsheet formulas such as =SUM(...). */
function csvCell(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  if (/[",\r\n]/.test(v)) v = `"${v.replace(/"/g, '""')}"`;
  return v;
}

/** Builds the export CSV: Team,Student,Roll Number. */
export function teamsToCsv(teams: readonly Team[]): string {
  const lines = ["Team,Student,Roll Number"];
  for (const team of teams) {
    for (const m of team.members) {
      lines.push([csvCell(team.name), csvCell(m.name), csvCell(m.roll)].join(","));
    }
  }
  return lines.join("\r\n") + "\r\n";
}
