import { TEAM_COUNT, TOTAL_STUDENTS } from "@/lib/config";
import HeroMosaic from "./HeroMosaic";

export default function Hero({ onUpload }: { onUpload: () => void }) {
  return (
    <header className="grid items-center gap-10 pb-10 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-14 lg:pt-20">
      <div>
        <h1 className="text-[clamp(2.6rem,7vw,4.75rem)] font-semibold uppercase leading-[0.95] tracking-tight">
          Team
          <br />
          Randomizer
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-300">
          Randomly divide {TOTAL_STUDENTS} students into {TEAM_COUNT} balanced teams.
        </p>
        <button type="button" onClick={onUpload} className="btn-primary mt-8 px-7 py-3.5">
          Upload CSV
        </button>
      </div>
      <HeroMosaic />
    </header>
  );
}
