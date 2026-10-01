/* Run with: npm run verify */
import assert from "node:assert/strict";
import { parseStudentCsv, teamsToCsv } from "../lib/csv";
import { generateTeams, shuffle, validateTeams } from "../lib/teams";
import type { Student } from "../lib/types";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

const pad = (n: number) => String(n).padStart(3, "0");
const makeCsv = (n: number, opts: { roll?: boolean; eol?: string } = {}) => {
  const eol = opts.eol ?? "\n";
  const roll = opts.roll ?? true;
  const lines = [roll ? "Name,Roll Number" : "Name"];
  for (let i = 1; i <= n; i++) lines.push(roll ? `Student ${i},${pad(i)}` : `Student ${i}`);
  return lines.join(eol) + eol;
};

console.log("CSV parsing");
test("valid 45-row CSV parses", () => {
  const r = parseStudentCsv(makeCsv(45), "a.csv");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.students.length, 45);
    assert.equal(r.hasRoll, true);
    assert.equal(r.students[0].roll, "001"); // leading zeros preserved
  }
});
test("Windows line endings, BOM and blank rows", () => {
  const csv = "\uFEFF" + makeCsv(45, { eol: "\r\n" }).replace("\r\n", "\r\n\r\n") + "\r\n\r\n,\r\n";
  const r = parseStudentCsv(csv, "A.CSV");
  assert.ok(r.ok, JSON.stringify(r));
});
test("column order, extra columns, different header names", () => {
  const lines = ["Email,Reg No,Student Name,Branch"];
  for (let i = 1; i <= 45; i++) lines.push(`s${i}@x.edu,${pad(i)},Person ${i},CS`);
  const r = parseStudentCsv(lines.join("\n"), "x.csv");
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.students[4].name, "Person 5");
    assert.equal(r.students[4].roll, "005");
  }
});
test("no roll column works using names", () => {
  const r = parseStudentCsv(makeCsv(45, { roll: false }), "n.csv");
  assert.ok(r.ok);
  if (r.ok) assert.equal(r.hasRoll, false);
});
test("special characters, quotes, commas, extra spaces", () => {
  const lines = ['Name,Roll Number', '"Doe, Jane",001', '  Jos\u00e9   Fern\u00e1ndez ,002', '"O""Brien",003', "\u0905\u0930\u094d\u091c\u0941\u0928,004"];
  for (let i = 5; i <= 45; i++) lines.push(`Student ${i},${pad(i)}`);
  const r = parseStudentCsv(lines.join("\n"), "s.csv");
  assert.ok(r.ok, JSON.stringify(r));
  if (r.ok) {
    assert.equal(r.students[0].name, "Doe, Jane");
    assert.equal(r.students[1].name, "Jos\u00e9 Fern\u00e1ndez");
    assert.equal(r.students[2].name, 'O"Brien');
  }
});
test("name column found by content when header is unusual", () => {
  const lines = ["Candidate,Number"];
  for (let i = 1; i <= 45; i++) lines.push(`Person ${i},${pad(i)}`);
  const r = parseStudentCsv(lines.join("\n"), "c.csv");
  assert.ok(r.ok);
});

console.log("CSV rejection");
const rejects = (csv: string, name: string, match: RegExp) => {
  const r = parseStudentCsv(csv, name);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.some((e) => match.test(e)), r.errors.join(" | "));
};
test("not a CSV file", () => rejects(makeCsv(45), "list.xlsx", /not a CSV/));
test("empty file", () => rejects("", "e.csv", /empty/));
test("whitespace only", () => rejects("\n\n  \n", "e.csv", /empty/));
test("header only", () => rejects("Name,Roll Number\n", "e.csv", /header row/));
test("44 students", () => rejects(makeCsv(44), "e.csv", /Found 44 .* exactly 45/));
test("46 students", () => rejects(makeCsv(46), "e.csv", /Found 46 .* exactly 45/));
test("missing names", () => {
  const lines = makeCsv(45).split("\n");
  lines[3] = ",003";
  rejects(lines.join("\n"), "m.csv", /Missing student name in row 4/);
});
test("duplicate roll numbers", () => {
  const lines = makeCsv(45).split("\n");
  lines[10] = "Someone Else,003";
  rejects(lines.join("\n"), "d.csv", /Duplicate roll number "003"/);
});
test("duplicate names without roll column", () => {
  const lines = makeCsv(45, { roll: false }).split("\n");
  lines[5] = "Student 2";
  rejects(lines.join("\n"), "d.csv", /Duplicate student "Student 2"/);
});
test("duplicate names with different rolls are allowed with a warning", () => {
  const lines = makeCsv(45).split("\n");
  lines[5] = "Student 2,005";
  const r = parseStudentCsv(lines.join("\n"), "d.csv");
  assert.ok(r.ok);
  if (r.ok) assert.ok(r.warnings.some((w) => /appears 2 times/.test(w)));
});
test("unclosed quote", () => rejects('Name,Roll\n"Bad,001\n', "q.csv", /could not be read/));
test("no name column at all", () => {
  const lines = ["Roll,Marks"];
  for (let i = 1; i <= 45; i++) lines.push(`${i},${i * 2}`);
  rejects(lines.join("\n"), "z.csv", /No student name column/);
});

console.log("Team generation");
const students: Student[] = Array.from({ length: 45 }, (_, i) => ({
  id: `s${i + 1}`,
  name: `Student ${i + 1}`,
  roll: pad(i + 1),
}));

test("shuffle does not mutate and keeps all items", () => {
  const input = [...students];
  const out = shuffle(input);
  assert.deepEqual(input, students);
  assert.equal(new Set(out.map((s) => s.id)).size, 45);
});
test("2,000 generations always give 15 teams x 3, every student once", () => {
  for (let run = 0; run < 2000; run++) {
    const r = generateTeams(students);
    assert.ok(r.ok);
    if (!r.ok) return;
    assert.equal(r.teams.length, 15);
    assert.ok(r.teams.every((t) => t.members.length === 3));
    assert.equal(new Set(r.teams.flatMap((t) => t.members.map((m) => m.id))).size, 45);
    assert.deepEqual(validateTeams(r.teams, students), []);
    assert.equal(r.teams[0].name, "Team 01");
    assert.equal(r.teams[14].name, "Team 15");
  }
});
test("results are not in sorted order", () => {
  const r = generateTeams(students);
  assert.ok(r.ok);
  if (r.ok) {
    const flat = r.teams.flatMap((t) => t.members.map((m) => m.id));
    assert.notDeepEqual(flat, students.map((s) => s.id));
  }
});
test("uniformity: student 1 lands in each team about equally (chi-square)", () => {
  const runs = 30000;
  const counts = new Array(15).fill(0);
  for (let i = 0; i < runs; i++) {
    const r = generateTeams(students);
    if (!r.ok) throw new Error("generation failed");
    counts[r.teams.findIndex((t) => t.members.some((m) => m.id === "s1"))]++;
  }
  const expected = runs / 15;
  const chi = counts.reduce((a, c) => a + (c - expected) ** 2 / expected, 0);
  // 14 degrees of freedom: 99.9th percentile is 36.12
  assert.ok(chi < 36.12, `chi-square ${chi.toFixed(2)} too high`);
  console.log(`      chi-square = ${chi.toFixed(2)} (df 14, limit 36.12)`);
});
test("reshuffle differs from the previous allocation", () => {
  const a = generateTeams(students);
  const b = generateTeams(students);
  assert.ok(a.ok && b.ok);
  if (a.ok && b.ok) assert.notDeepEqual(a.teams, b.teams);
});
test("wrong student count is refused", () => {
  const r = generateTeams(students.slice(0, 44));
  assert.equal(r.ok, false);
});
test("validateTeams catches tampering", () => {
  const r = generateTeams(students);
  assert.ok(r.ok);
  if (!r.ok) return;
  const broken = structuredClone(r.teams);
  broken[0].members.pop();
  assert.ok(validateTeams(broken, students).length > 0);
  const dup = structuredClone(r.teams);
  dup[1].members[0] = dup[0].members[0];
  assert.ok(validateTeams(dup, students).length > 0);
});

console.log("CSV export");
test("export format and escaping", () => {
  const r = generateTeams(students);
  assert.ok(r.ok);
  if (!r.ok) return;
  const csv = teamsToCsv(r.teams);
  const lines = csv.trim().split("\r\n");
  assert.equal(lines[0], "Team,Student,Roll Number");
  assert.equal(lines.length, 46);
  assert.ok(lines[1].startsWith("Team 01,"));
  assert.ok(lines[45].startsWith("Team 15,"));

  const tricky: Student[] = [{ id: "x", name: '=HYPERLINK("x"), Bob', roll: "007" }];
  const out = teamsToCsv([{ name: "Team 01", members: tricky }]);
  assert.ok(out.includes(`"'=HYPERLINK(""x""), Bob"`), out);
});

console.log(`\n${passed} checks passed`);
