import { getFormById } from "@/lib/db";
import {
  convertTiffAssetToPdf,
  isPdfAsset,
  isTiffAsset,
} from "@/lib/documents/preview-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await getFormById(id);
  if (!form) {
    return new Response("Form not found", { status: 404 });
  }

  const sourceUrl = form.pdfUrl;
  if (isPdfAsset(sourceUrl)) {
    return Response.redirect(new URL(sourceUrl, request.url), 307);
  }

  if (!isTiffAsset(sourceUrl)) {
    return new Response("Unsupported document format.", { status: 415 });
  }

  try {
    const pdfBytes = await convertTiffAssetToPdf(sourceUrl);
    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=60",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to convert TIFF to PDF.";
    return new Response(message, { status: 500 });
  }
}
