import type { FormRecord } from "@/lib/types";

type PgClient = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: FormRecord[] }>;
  end: () => Promise<void>;
};

async function getClient(): Promise<PgClient> {
  const { Client } = await import("pg");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  return client;
}

export async function listForms(): Promise<FormRecord[]> {
  const client = await getClient();
  try {
    const result = await client.query("SELECT * FROM forms ORDER BY submitted_at DESC");
    return result.rows as FormRecord[];
  } finally {
    await client.end();
  }
}

export async function getFormById(id: string): Promise<FormRecord | undefined> {
  const client = await getClient();
  try {
    const result = await client.query("SELECT * FROM forms WHERE id = $1", [id]);
    return result.rows[0] as FormRecord | undefined;
  } finally {
    await client.end();
  }
}
