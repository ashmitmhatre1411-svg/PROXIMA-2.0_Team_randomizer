import type { Student } from "@/lib/types";

interface Props {
  students: Student[];
  hasRoll: boolean;
  open: boolean;
  onToggle: () => void;
}

export default function StudentPreview({ students, hasRoll, open, onToggle }: Props) {
  return (
    <section aria-label="Student preview" className="glass rounded-2xl">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-semibold">
          Uploaded students
          <span className="ml-2 text-sm font-normal text-slate-400">{students.length}</span>
        </h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white"
        >
          {open ? "Hide list" : "Show list"}
        </button>
      </div>
      {open && (
        <div className="thin-scroll max-h-[26rem] overflow-auto border-t border-white/[0.08]">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="sticky top-0 bg-[#0d1226] text-xs text-slate-400">
              <tr>
                <th className="w-14 px-5 py-2.5 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Student</th>
                {hasRoll && <th className="px-5 py-2.5 font-medium">Roll Number</th>}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="border-t border-white/[0.05]">
                  <td className="px-5 py-2 tabular-nums text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  {hasRoll && (
                    <td className="px-5 py-2 tabular-nums text-slate-300">
                      {s.roll || "\u2014"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
