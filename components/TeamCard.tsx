import type { CSSProperties } from "react";
import { teamHue } from "@/lib/hue";
import type { Team } from "@/lib/types";

interface Props {
  team: Team;
  index: number;
  hasRoll: boolean;
}

export default function TeamCard({ team, index, hasRoll }: Props) {
  const style = {
    "--h": teamHue(index),
    animationDelay: `${index * 45}ms`,
  } as CSSProperties;

  return (
    <article className="team-card card-in glass rounded-2xl pb-2" style={style}>
      <header className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <h3 className="text-base font-semibold uppercase tracking-wide">{team.name}</h3>
        <span className="team-badge rounded-full px-2.5 py-0.5 text-xs font-medium">
          {team.members.length} students
        </span>
      </header>
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-slate-400">
          <tr>
            <th className="w-9 px-4 py-1.5 font-medium">#</th>
            <th className="px-1 py-1.5 font-medium">Student</th>
            {hasRoll && <th className="px-4 py-1.5 text-right font-medium">Roll Number</th>}
          </tr>
        </thead>
        <tbody>
          {team.members.map((m, i) => (
            <tr key={m.id} className="border-t border-white/[0.06]">
              <td className="px-4 py-2 tabular-nums text-slate-500">{i + 1}</td>
              <td className="px-1 py-2">{m.name}</td>
              {hasRoll && (
                <td className="px-4 py-2 text-right tabular-nums text-slate-300">
                  {m.roll || "\u2014"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
