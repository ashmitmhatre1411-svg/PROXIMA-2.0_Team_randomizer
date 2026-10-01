import { TEAM_COUNT, TEAM_SIZE } from "@/lib/config";
import { teamHue } from "@/lib/hue";

/** Decorative preview of the end result: 15 teams of 3 dots. Deterministic, so no hydration mismatch. */
export default function HeroMosaic() {
  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
      {Array.from({ length: TEAM_COUNT }, (_, t) => {
        const hue = teamHue(t);
        return (
          <div
            key={t}
            className="glass rounded-xl px-2.5 py-3"
            style={{ borderTop: `2px solid hsl(${hue} 85% 68%)` }}
          >
            <div className="mb-2 text-[11px] font-medium tabular-nums text-slate-400">
              {String(t + 1).padStart(2, "0")}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: TEAM_SIZE }, (_, d) => (
                <span
                  key={d}
                  className="dot-in h-2 w-2 rounded-full"
                  style={{
                    background: `hsl(${hue} 85% 68%)`,
                    animationDelay: `${(t * TEAM_SIZE + d) * 14 + 150}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
