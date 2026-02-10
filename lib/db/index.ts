import type { FormRecord } from "@/lib/types";
import * as mock from "@/lib/db/mock";
import * as pg from "@/lib/db/postgres";

const usePostgres = Boolean(process.env.DATABASE_URL);

export async function listForms(): Promise<FormRecord[]> {
  return usePostgres ? pg.listForms() : mock.listForms();
}

export async function getFormById(id: string): Promise<FormRecord | undefined> {
  return usePostgres ? pg.getFormById(id) : mock.getFormById(id);
}
