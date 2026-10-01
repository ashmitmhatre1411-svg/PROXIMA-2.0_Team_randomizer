"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ActionBar from "@/components/ActionBar";
import CompactHeader from "@/components/CompactHeader";
import ConfirmDialog from "@/components/ConfirmDialog";
import Hero from "@/components/Hero";
import StatsBar from "@/components/StatsBar";
import StudentPreview from "@/components/StudentPreview";
import TeamCard from "@/components/TeamCard";
import Toast, { type ToastState } from "@/components/Toast";
import UploadZone from "@/components/UploadZone";
import { TEAM_COUNT, TEAM_SIZE, TOTAL_STUDENTS } from "@/lib/config";
import { parseStudentFile, teamsToCsv } from "@/lib/csv";
import { downloadCsv } from "@/lib/download";
import { downloadTeamsPdf } from "@/lib/pdf";
import { clearSession, loadSession, saveSession } from "@/lib/storage";
import { generateTeams, validateTeams } from "@/lib/teams";
import type { Student, Team } from "@/lib/types";

type ConfirmKind = "unlock" | "reset" | null;

export default function Page() {
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [students, setStudents] = useState<Student[] | null>(null);
  const [hasRoll, setHasRoll] = useState(false);
  const [fileName, setFileName] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [actionErrors, setActionErrors] = useState<string[]>([]);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    setToast({ id: Date.now(), message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const cancelConfirm = useCallback(() => setConfirm(null), []);

  // Restore an in-progress session after a refresh so a live event never loses its teams.
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setStudents(saved.students);
      setHasRoll(saved.hasRoll);
      setFileName(saved.fileName);
      setWarnings(saved.warnings);
      setTeams(saved.teams);
      setLocked(saved.locked);
      setPreviewOpen(saved.teams === null);
      setToast({
        id: Date.now(),
        message: saved.locked ? "Restored your locked teams." : "Restored your previous session.",
        tone: "success",
      });
    }
    setHydrated(true);
  }, []);

  // Keep the saved session in sync with the screen.
  useEffect(() => {
    if (!hydrated) return;
    if (!students) {
      clearSession();
      return;
    }
    saveSession({ fileName, students, hasRoll, warnings, teams, locked });
  }, [hydrated, students, fileName, hasRoll, warnings, teams, locked]);

  // Bring the first generated result into view.
  useEffect(() => {
    if (generation === 1) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generation]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setUploadErrors([]);
      const result = await parseStudentFile(file);
      setParsing(false);

      if (!result.ok) {
        setUploadErrors(result.errors);
        return;
      }
      setStudents(result.students);
      setHasRoll(result.hasRoll);
      setWarnings(result.warnings);
      setFileName(file.name);
      setTeams(null);
      setLocked(false);
      setGeneration(0);
      setActionErrors([]);
      setPreviewOpen(true);
      notify(`Loaded ${result.students.length} students.`);
    },
    [notify]
  );

  const handleGenerate = useCallback(() => {
    if (!students || locked) return;
    const result = generateTeams(students);
    if (!result.ok) {
      setActionErrors(result.errors);
      notify("Teams could not be generated.", "error");
      return;
    }
    const first = teams === null;
    setActionErrors([]);
    setTeams(result.teams);
    setGeneration((g) => g + 1);
    if (first) setPreviewOpen(false);
    notify(first ? "Teams generated successfully." : "Teams reshuffled successfully.");
  }, [students, locked, teams, notify]);

  const handleLock = useCallback(() => {
    setLocked(true);
    notify("Teams locked.");
  }, [notify]);

  const handleCsv = useCallback(() => {
    if (!teams || !students) return;
    const problems = validateTeams(teams, students);
    if (problems.length > 0) {
      setActionErrors(problems);
      notify("Export stopped: the teams failed validation.", "error");
      return;
    }
    downloadCsv(teamsToCsv(teams), "team-allocation.csv");
    notify("CSV downloaded.");
  }, [teams, students, notify]);

  const handlePdf = useCallback(async () => {
    if (!teams || !students) return;
    const problems = validateTeams(teams, students);
    if (problems.length > 0) {
      setActionErrors(problems);
      notify("Export stopped: the teams failed validation.", "error");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadTeamsPdf(teams);
      notify("PDF downloaded.");
    } catch {
      notify("The PDF could not be created. Try again.", "error");
    } finally {
      setPdfBusy(false);
    }
  }, [teams, students, notify]);

  const handleConfirm = useCallback(() => {
    if (confirm === "unlock") {
      setLocked(false);
      notify("Teams unlocked. You can shuffle again.");
    } else if (confirm === "reset") {
      setStudents(null);
      setHasRoll(false);
      setFileName("");
      setWarnings([]);
      setUploadErrors([]);
      setActionErrors([]);
      setTeams(null);
      setLocked(false);
      setGeneration(0);
      setPreviewOpen(true);
      clearSession();
      notify("Reset complete. Upload a CSV to start again.");
    }
    setConfirm(null);
  }, [confirm, notify]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      {students ? (
        <CompactHeader fileName={fileName} onReset={() => setConfirm("reset")} />
      ) : (
        <Hero onUpload={openPicker} />
      )}

      <StatsBar studentCount={students ? students.length : null} />

      <div className="mt-8 space-y-6">
        {!students && (
          <UploadZone
            onBrowse={openPicker}
            onFile={(f) => void handleFile(f)}
            busy={parsing}
            errors={uploadErrors}
          />
        )}

        {students && (
          <div className="fade-in space-y-6">
            {warnings.length > 0 && (
              <div className="rounded-2xl border border-amber-300/25 bg-amber-400/[0.06] px-5 py-4">
                <h2 className="text-sm font-semibold text-amber-200">Worth a look</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/80">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {actionErrors.length > 0 && (
              <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-rose-200">Validation failed</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-100/90">
                  {actionErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {!teams && (
              <section className="glass flex flex-col items-start justify-between gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {TOTAL_STUDENTS} Students {"\u2192"} {TEAM_COUNT} Teams {"\u2192"} {TEAM_SIZE} Students per Team
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    The file is valid. Teams are only shuffled when you press the button.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="btn-primary shrink-0 px-8 py-4 text-base"
                >
                  Generate teams
                </button>
              </section>
            )}

            <StudentPreview
              students={students}
              hasRoll={hasRoll}
              open={previewOpen}
              onToggle={() => setPreviewOpen((o) => !o)}
            />

            {teams && (
              <div ref={resultsRef} className="scroll-mt-4 space-y-5">
                <ActionBar
                  locked={locked}
                  pdfBusy={pdfBusy}
                  onShuffle={handleGenerate}
                  onLock={handleLock}
                  onUnlock={() => setConfirm("unlock")}
                  onCsv={handleCsv}
                  onPdf={() => void handlePdf()}
                />
                <div
                  key={generation}
                  className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {teams.map((team, i) => (
                    <TeamCard key={team.name} team={team} index={i} hasRoll={hasRoll} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirm === "unlock"}
        title="Unlock teams?"
        message="Unlocking will allow the teams to be reshuffled. Continue?"
        confirmLabel="Unlock"
        onConfirm={handleConfirm}
        onCancel={cancelConfirm}
      />
      <ConfirmDialog
        open={confirm === "reset"}
        title="Reset everything?"
        message="This clears the uploaded CSV and all generated teams. Continue?"
        confirmLabel="Reset"
        danger
        onConfirm={handleConfirm}
        onCancel={cancelConfirm}
      />
      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}
