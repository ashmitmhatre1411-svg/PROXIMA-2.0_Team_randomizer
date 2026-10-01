import { TEAM_COUNT, TEAM_SIZE, TOTAL_STUDENTS } from "@/lib/config";

interface Props {
  /** Number of students loaded, or null before a CSV has been uploaded. */
  studentCount: number | null;
}

export default function StatsBar({ studentCount }: Props) {
  const loaded = studentCount !== null;
  const dash = "\u2014";
  const stats = [
    {
      label: "Total students",
      value: loaded ? String(studentCount) : dash,
      note: `Required: ${TOTAL_STUDENTS}`,
    },
    {
      label: "Total teams",
      value: loaded ? String(TEAM_COUNT) : dash,
      note: "Team 01 to Team 15",
    },
    {
      label: "Students / team",
      value: loaded ? String(TEAM_SIZE) : dash,
      note: "Exactly three each",
    },
  ];

  return (
    <section aria-label="Statistics" className="grid grid-cols-3 gap-3 sm:gap-4">
      {stats.map((s) => (
        <div key={s.label} className="glass rounded-2xl px-3 py-4 sm:px-6 sm:py-5">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
            {s.label}
          </div>
          <div
            className={`mt-1.5 text-3xl font-semibold tabular-nums sm:text-5xl ${
              loaded ? "text-white" : "text-slate-600"
            }`}
          >
            {s.value}
          </div>
          <div className="mt-1 hidden text-xs text-slate-500 sm:block">{s.note}</div>
        </div>
      ))}
    </section>
  );
}
