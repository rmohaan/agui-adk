import { listForms } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const forms = await listForms();
  return Response.json(forms);
}
