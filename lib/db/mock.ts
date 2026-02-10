import forms from "@/data/forms.json";
import type { FormRecord } from "@/lib/types";

const mockForms = forms as FormRecord[];

export async function listForms(): Promise<FormRecord[]> {
  return mockForms;
}

export async function getFormById(id: string): Promise<FormRecord | undefined> {
  return mockForms.find((form) => form.id === id);
}
