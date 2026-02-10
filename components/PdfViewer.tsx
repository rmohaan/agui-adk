"use client";

type PdfViewerProps = {
  url: string;
};

export function PdfViewer({ url }: PdfViewerProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/70">
      <object
        data={url}
        type="application/pdf"
        className="h-[640px] w-full"
      >
        <div className="flex h-[640px] items-center justify-center text-sm text-slate-500">
          Failed to load PDF file.
        </div>
      </object>
    </div>
  );
}
