interface Props {
  locked: boolean;
  pdfBusy: boolean;
  onShuffle: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onCsv: () => void;
  onPdf: () => void;
}

export default function ActionBar({
  locked,
  pdfBusy,
  onShuffle,
  onLock,
  onUnlock,
  onCsv,
  onPdf,
}: Props) {
  return (
    <div className="glass sticky top-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onShuffle}
          disabled={locked}
          className="btn-primary"
        >
          Shuffle again
        </button>

        {locked ? (
          <>
            <span
              role="status"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200"
            >
              {"\u{1F512}"} Teams Locked
            </span>
            <button type="button" onClick={onUnlock} className="btn-ghost">
              Unlock
            </button>
          </>
        ) : (
          <button type="button" onClick={onLock} className="btn-ghost">
            Lock teams
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
        <button type="button" onClick={onCsv} className="btn-ghost">
          Download CSV
        </button>
        <button type="button" onClick={onPdf} disabled={pdfBusy} className="btn-ghost">
          {pdfBusy ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>
    </div>
  );
}
