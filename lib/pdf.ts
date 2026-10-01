import { TEAM_SIZE } from "./config";
import type { Team } from "./types";

/** jsPDF's built-in fonts only cover Latin-1, so map or replace anything outside it. */
function pdfSafe(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .normalize("NFC")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?");
}

/** Generates and downloads the printable TEAM ALLOCATION PDF. */
export async function downloadTeamsPdf(
  teams: readonly Team[],
  fileName = "team-allocation.pdf"
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const gutter = 10;
  const colW = (pageW - margin * 2 - gutter) / 2;
  const footerY = pageH - 9;
  const bottom = pageH - 18;
  const lineH = 6.4;
  const headH = 9;
  const blockH = headH + lineH * TEAM_SIZE + 6;

  const indigo: [number, number, number] = [67, 78, 200];
  const ink: [number, number, number] = [24, 28, 48];
  const muted: [number, number, number] = [110, 116, 140];

  const dateText = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fit = (text: string, maxW: number): string => {
    let t = pdfSafe(text);
    if (doc.getTextWidth(t) <= maxW) return t;
    while (t.length > 1 && doc.getTextWidth(t + "...") > maxW) t = t.slice(0, -1);
    return t.trimEnd() + "...";
  };

  // Title block (first page only)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text("TEAM ALLOCATION", margin, margin + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  const total = teams.reduce((n, t) => n + t.members.length, 0);
  doc.text(
    `${total} students in ${teams.length} teams  |  ${dateText}`,
    margin,
    margin + 15
  );
  doc.setDrawColor(...indigo);
  doc.setLineWidth(0.8);
  doc.line(margin, margin + 19, pageW - margin, margin + 19);

  const firstPageTop = margin + 27;
  const nextPageTop = margin + 4;

  // Teams are laid out two per row. Work out how many rows fit on each page up front.
  const rowsFirst = Math.max(1, Math.floor((bottom - firstPageTop) / blockH));
  const rowsNext = Math.max(1, Math.floor((bottom - nextPageTop) / blockH));

  const place = (idx: number): { page: number; x: number; y: number } => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    let page = 0;
    let r = row;
    if (r >= rowsFirst) {
      r -= rowsFirst;
      page = 1 + Math.floor(r / rowsNext);
      r = r % rowsNext;
    }
    const top = page === 0 ? firstPageTop : nextPageTop;
    return { page, x: margin + col * (colW + gutter), y: top + r * blockH };
  };

  teams.forEach((team, idx) => {
    const { page, x, y } = place(idx);
    while (doc.getNumberOfPages() < page + 1) doc.addPage();
    doc.setPage(page + 1);

    // Team heading
    doc.setFillColor(...indigo);
    doc.rect(x, y, 1.6, headH - 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(...ink);
    doc.text(pdfSafe(team.name), x + 4, y + 5.2);

    doc.setDrawColor(215, 218, 232);
    doc.setLineWidth(0.25);
    doc.line(x, y + headH - 0.5, x + colW, y + headH - 0.5);

    // Members: "1. Name - Roll"
    doc.setFontSize(10);
    team.members.forEach((m, i) => {
      const ly = y + headH + 4.6 + i * lineH;
      const label = `${i + 1}. `;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...muted);
      doc.text(label, x + 1, ly);
      const labelW = doc.getTextWidth(label);

      const gap = 1.8;
      const rollText = m.roll ? pdfSafe(`- ${m.roll}`) : "";
      const rollW = rollText ? doc.getTextWidth(rollText) + gap : 0;
      const nameText = fit(m.name, colW - labelW - rollW - 2);

      doc.setTextColor(...ink);
      doc.text(nameText, x + 1 + labelW, ly);
      if (rollText) {
        doc.setTextColor(...muted);
        doc.text(rollText, x + 1 + labelW + doc.getTextWidth(nameText) + gap, ly);
      }
    });
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    doc.text("Team Randomizer", margin, footerY);
    doc.text(`Page ${p} of ${pages}`, pageW - margin, footerY, { align: "right" });
  }

  doc.setProperties({ title: "Team Allocation", creator: "Team Randomizer" });
  doc.save(fileName);
}
