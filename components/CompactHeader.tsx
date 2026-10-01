interface Props {
  fileName: string;
  onReset: () => void;
}

export default function CompactHeader({ fileName, onReset }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 pb-6 pt-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold uppercase tracking-tight sm:text-2xl">
          Team Randomizer
        </h1>
        <p className="mt-1 truncate text-sm text-slate-400" title={fileName}>
          {fileName}
        </p>
      </div>
      <button type="button" onClick={onReset} className="btn-danger">
        Reset
      </button>
    </header>
  );
}
