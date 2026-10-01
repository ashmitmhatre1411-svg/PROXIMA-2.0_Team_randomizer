"use client";

import { useState } from "react";
import { TOTAL_STUDENTS } from "@/lib/config";

interface Props {
  onBrowse: () => void;
  onFile: (file: File) => void;
  busy: boolean;
  errors: string[];
}

export default function UploadZone({ onBrowse, onFile, busy, errors }: Props) {
  const [dragging, setDragging] = useState(false);

  return (
    <section aria-label="Upload student list" className="fade-in">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a CSV file. Drag and drop here or press Enter to browse."
        onClick={onBrowse}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onBrowse();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={`glass cursor-pointer rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 sm:py-16 ${
          dragging
            ? "border-accent-soft bg-accent/10"
            : "border-white/15 hover:border-white/30"
        }`}
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            dragging ? "bg-accent text-white" : "bg-white/[0.06] text-accent-soft"
          }`}
          aria-hidden="true"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 16V4" />
            <path d="M7 9l5-5 5 5" />
            <path d="M5 20h14" />
          </svg>
        </div>
        <p className="mt-5 text-xl font-semibold">
          {busy
            ? "Reading file..."
            : dragging
              ? "Drop the file to upload"
              : "Drag and drop your CSV here"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
          One row per student with a Name column and an optional Roll Number column.
          Exactly {TOTAL_STUDENTS} students are required. The file stays in your browser.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="btn-primary pointer-events-none">Choose file</span>
          <a
            href="/sample-students.csv"
            download
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            Download a sample CSV
          </a>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5"
        >
          <h2 className="text-sm font-semibold text-rose-200">
            {errors.length === 1
              ? "This file can't be used"
              : `This file can't be used (${errors.length} problems)`}
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-rose-100/90">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-rose-100/70">Fix the file and upload it again.</p>
        </div>
      )}
    </section>
  );
}
