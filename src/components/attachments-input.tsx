"use client";
import { useRef, useState } from "react";
import { Icon } from "./icons";

export const MAX_FILES = 3;
const MAX_PDF = 2_500_000;
const ACCEPT = "image/*,application/pdf";

/** Shrink a photo on the phone before upload: 1600px longest side, JPEG. Falls back to the original. */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/**
 * Add up to 3 photos or PDFs (for example lab results, a prescription or a photo of a rash).
 * Photos are made smaller on the phone first, so they upload quickly on mobile data.
 */
export function AttachmentsInput({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    setBusy(true);
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) { setError(`You can add up to ${MAX_FILES} files.`); break; }
      if (f.type === "application/pdf") {
        if (f.size > MAX_PDF) { setError("That PDF is too big. Please keep files under 2.5 MB, or take a photo of the page."); continue; }
        next.push(f);
      } else if (f.type.startsWith("image/")) {
        const small = await shrink(f);
        if (small.size > MAX_PDF) { setError("That photo is too big. Please try another."); continue; }
        next.push(small);
      } else {
        setError("Please add a photo or a PDF.");
      }
    }
    onChange(next);
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      {files.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface px-3 py-2">
              <Icon name={f.type === "application/pdf" ? "clipboard" : "eye"} size={18} strokeWidth={2} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{f.name}</span>
              <span className="shrink-0 text-xs text-subtle">{Math.max(1, Math.round(f.size / 1024))} KB</span>
              <button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"><Icon name="close" size={14} strokeWidth={2} /></button>
            </li>
          ))}
        </ul>
      )}
      {files.length < MAX_FILES && (
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-line-strong bg-surface px-4 text-[15px] font-semibold whitespace-nowrap text-ink/80 hover:bg-surface-2 disabled:opacity-50">
          <Icon name="link" size={18} strokeWidth={2} /> {busy ? "Adding…" : files.length ? "Add another" : "Add a photo or file"}
        </button>
      )}
      <input ref={input} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => add(e.target.files)} />
      {error && <p className="mt-2 text-sm font-medium text-check-text" role="alert">{error}</p>}
      <p className="mt-1.5 text-xs text-subtle">For example lab results, a prescription or a photo of a rash. Up to {MAX_FILES} files.</p>
    </div>
  );
}
