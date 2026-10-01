/** Triggers a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Downloads CSV text. A BOM is added so Excel reads UTF-8 names correctly. */
export function downloadCsv(csv: string, fileName: string): void {
  downloadBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), fileName);
}
