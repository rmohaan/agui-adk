import { getFormById } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const form = await getFormById(id);
  if (!form) {
    return new Response("Form not found", { status: 404 });
  }
  return Response.json(form);
}
