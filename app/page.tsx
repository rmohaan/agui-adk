"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useCoAgent } from "@copilotkit/react-core";
import { useAgent, useCopilotKit } from "@copilotkitnext/react";

import { FormFieldRow } from "@/components/FormFieldRow";
import { SCHEMES } from "@/lib/adk/mock-data";
import { FORM_FIELDS } from "@/lib/forms";
import type { AgentState, FormRecord, FormFieldKey } from "@/lib/types";

const PdfViewer = dynamic(
  () => import("@/components/PdfViewer").then((mod) => mod.PdfViewer),
  { ssr: false },
);

const emptyState: AgentState = {
  fields: {} as AgentState["fields"],
  validation: {},
  nudges: [],
  fieldNudges: {},
  schemeOptions: SCHEMES,
  ifscSuggestions: [],
  feedback: [],
};

export default function Home() {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [ghostIndex, setGhostIndex] = useState(-1);
  const [ghostText, setGhostText] = useState<
    Partial<Record<FormFieldKey, string>>
  >({});

  const agent = useCoAgent<AgentState>({
    name: "adkAgent",
    initialState: emptyState,
  });
  const agentRef = useRef(agent);
  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);
  const { agent: runtimeAgent } = useAgent({ agentId: "adkAgent" });
  const { copilotkit } = useCopilotKit();

  const runPendingRef = useRef(false);
  const runTimerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const wasRunningRef = useRef(false);
  const dirtyFieldsRef = useRef<Set<FormFieldKey>>(new Set());
  const runtimeAgentRef = useRef(runtimeAgent);
  const copilotkitRef = useRef(copilotkit);
  const typingTimersRef = useRef<
    Partial<Record<FormFieldKey, number>>
  >({});

  useEffect(() => {
    runningRef.current = agent.running;
  }, [agent.running]);

  useEffect(() => {
    runtimeAgentRef.current = runtimeAgent;
  }, [runtimeAgent]);

  useEffect(() => {
    copilotkitRef.current = copilotkit;
  }, [copilotkit]);

  const triggerAgentRun = useCallback(() => {
    if (!runtimeAgentRef.current) return;

    if (runTimerRef.current) {
      window.clearTimeout(runTimerRef.current);
    }

    runTimerRef.current = window.setTimeout(async () => {
      if (runningRef.current) {
        runPendingRef.current = true;
        return;
      }
      try {
        await copilotkitRef.current.runAgent({ agent: runtimeAgentRef.current });
      } catch (error) {
        console.error("Agent run failed", error);
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (agent.running) return;
    if (!runPendingRef.current) return;
    runPendingRef.current = false;
    triggerAgentRun();
  }, [agent.running, triggerAgentRun]);

  useEffect(() => {
    const justFinished = wasRunningRef.current && !agent.running;
    if (justFinished && agent.state?.activeField) {
      agent.setState((prev) => {
        if (!prev?.activeField) {
          return prev ?? emptyState;
        }
        return { ...prev, activeField: undefined };
      });
    }
    wasRunningRef.current = agent.running;
  }, [agent.running, agent.state?.activeField, agent]);

  useEffect(() => {
    const loadForms = async () => {
      const response = await fetch("/api/forms");
      const data = (await response.json()) as FormRecord[];
      setForms(data);
      setSelectedId(null);
      setSelectedForm(null);
      setLoading(false);
    };
    loadForms();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const loadForm = async () => {
      const response = await fetch(`/api/forms/${selectedId}`);
      const data = (await response.json()) as FormRecord;
      setSelectedForm(data);
      setGhostIndex(-1);
      setGhostText({});
      dirtyFieldsRef.current.clear();
      Object.values(typingTimersRef.current).forEach((timer) => {
        if (timer) {
          window.clearInterval(timer);
        }
      });
      typingTimersRef.current = {};
      const nextFields = FORM_FIELDS.reduce((acc, field) => {
        acc[field.key] = {
          value: "",
          prefill: data.fields[field.key] ?? "",
          status: "pending",
        };
        return acc;
      }, {} as AgentState["fields"]);

      agentRef.current.setState((prev) => ({
        ...prev,
        formId: data.id,
        activeField: undefined,
        fields: nextFields,
        validation: {},
        nudges: [],
        fieldNudges: {},
        schemeOptions: SCHEMES,
        ifscSuggestions: [],
      }));

      void triggerAgentRun();
    };
    loadForm();
  }, [selectedId, triggerAgentRun]);

  useEffect(() => {
    if (!selectedForm) return;
    let index = -1;
    const timer = window.setInterval(() => {
      index += 1;
      setGhostIndex((current) => (current < index ? index : current));
      if (index >= FORM_FIELDS.length - 1) {
        window.clearInterval(timer);
      }
    }, 2000);
    return () => {
      window.clearInterval(timer);
    };
  }, [selectedForm]);

  useEffect(() => {
    if (!selectedForm) return;
    if (ghostIndex < 0 || ghostIndex >= FORM_FIELDS.length) return;
    const key = FORM_FIELDS[ghostIndex]?.key;
    if (!key) return;
    const prefill = selectedForm.fields[key] ?? "";
    if (!prefill) return;
    if (typingTimersRef.current[key]) return;

    let cursor = 0;
    const timer = window.setInterval(() => {
      cursor += 1;
      setGhostText((prev) => ({
        ...prev,
        [key]: prefill.slice(0, cursor),
      }));
      if (cursor >= prefill.length) {
        window.clearInterval(timer);
        typingTimersRef.current[key] = undefined;
      }
    }, 100);

    typingTimersRef.current[key] = timer;
  }, [ghostIndex, selectedForm]);

  const validation = agent.state?.validation ?? {};
  const nudges = agent.state?.nudges ?? [];
  const fieldNudges = agent.state?.fieldNudges ?? {};
  const schemeOptions =
    agent.state?.schemeOptions && agent.state.schemeOptions.length > 0
      ? agent.state.schemeOptions
      : SCHEMES;

  const clearGhostForField = (key: FormFieldKey) => {
    const typingTimer = typingTimersRef.current[key];
    if (typingTimer) {
      window.clearInterval(typingTimer);
      typingTimersRef.current[key] = undefined;
    }
    setGhostText((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearFieldDerivedState = (
    prev: AgentState,
    key: FormFieldKey,
  ): Pick<AgentState, "validation" | "fieldNudges"> => {
    const nextValidation = { ...(prev.validation ?? {}) };
    delete nextValidation[key];
    const nextFieldNudges = { ...(prev.fieldNudges ?? {}) };
    delete nextFieldNudges[key];
    return {
      validation: nextValidation,
      fieldNudges: nextFieldNudges,
    };
  };

  const updateField = (key: FormFieldKey, value: string) => {
    clearGhostForField(key);
    dirtyFieldsRef.current.add(key);
    agent.setState((prev) => {
      const safePrev = prev ?? emptyState;
      const cleared = clearFieldDerivedState(safePrev, key);
      const field = safePrev.fields[key] ?? {
        value: "",
        prefill: "",
        status: "pending",
      };
      return {
        ...safePrev,
        ...cleared,
        fields: {
          ...safePrev.fields,
          [key]: {
            ...field,
            value,
            status: "rejected",
          },
        },
      };
    });
  };


  const acceptField = (key: FormFieldKey) => {
    agent.setState((prev) => {
      const safePrev = prev ?? emptyState;
      const field = safePrev.fields[key] ?? {
        value: "",
        prefill: "",
        status: "pending",
      };
      return {
        ...safePrev,
        activeField: key,
        fields: {
          ...safePrev.fields,
          [key]: {
            ...field,
            status: "accepted",
            value: field.prefill ?? field.value,
          },
        },
        feedback: [
          ...(safePrev.feedback ?? []),
          {
            field: key,
            action: "accept",
            value: field.value,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    dirtyFieldsRef.current.delete(key);
    void triggerAgentRun();
  };

  const rejectField = (key: FormFieldKey) => {
    agent.setState((prev) => {
      const safePrev = prev ?? emptyState;
      const cleared = clearFieldDerivedState(safePrev, key);
      const field = safePrev.fields[key] ?? {
        value: "",
        prefill: "",
        status: "pending",
      };
      return {
        ...safePrev,
        ...cleared,
        fields: {
          ...safePrev.fields,
          [key]: {
            ...field,
            status: "rejected",
            value: "",
          },
        },
        feedback: [
          ...(safePrev.feedback ?? []),
          {
            field: key,
            action: "reject",
            value: field.value,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    dirtyFieldsRef.current.delete(key);
  };

  const blurField = (key: FormFieldKey) => {
    if (!dirtyFieldsRef.current.has(key)) {
      return;
    }
    dirtyFieldsRef.current.delete(key);
    let shouldRun = false;
    agent.setState((prev) => {
      const safePrev = prev ?? emptyState;
      const cleared = clearFieldDerivedState(safePrev, key);
      const field = safePrev.fields[key] ?? {
        value: "",
        prefill: "",
        status: "pending",
      };
      const hasValue = field.value.trim().length > 0;
      if (!hasValue) {
        return {
          ...safePrev,
          ...cleared,
          fields: {
            ...safePrev.fields,
            [key]: {
              ...field,
              status: "rejected",
            },
          },
          feedback: [
            ...(safePrev.feedback ?? []),
            {
              field: key,
              action: "edit",
              value: field.value,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      }
      shouldRun = true;
      return {
        ...safePrev,
        ...cleared,
        activeField: key,
        fields: {
          ...safePrev.fields,
          [key]: {
            ...field,
            status: field.status === "accepted" ? "accepted" : "rejected",
          },
        },
        feedback: [
          ...(safePrev.feedback ?? []),
          {
            field: key,
            action: "edit",
            value: field.value,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    if (shouldRun) {
      void triggerAgentRun();
    }
  };

  const applySuggestedFieldValue = (key: FormFieldKey, value: string) => {
    clearGhostForField(key);
    dirtyFieldsRef.current.delete(key);
    agent.setState((prev) => {
      const safePrev = prev ?? emptyState;
      const cleared = clearFieldDerivedState(safePrev, key);
      const field = safePrev.fields[key] ?? {
        value: "",
        prefill: "",
        status: "pending",
      };
      return {
        ...safePrev,
        ...cleared,
        activeField: key,
        fields: {
          ...safePrev.fields,
          [key]: {
            ...field,
            value,
            status: "rejected",
          },
        },
        feedback: [
          ...(safePrev.feedback ?? []),
          {
            field: key,
            action: "edit",
            value,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    void triggerAgentRun();
  };

  const statusLabel = useMemo(() => {
    if (agent.running) return "Agent running checks";
    return "Agent idle";
  }, [agent.running]);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Mutual Fund Redemption
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Agent-assisted Form Review
            </h1>
          </div>
          {agent.running ? (
            <div className="agent-status-running transition-all duration-500">
              <div className="agent-status-inner px-4 py-2 text-xs font-semibold text-slate-700">
                {statusLabel}
              </div>
            </div>
          ) : (
            <div className="agent-status-idle px-4 py-2 text-xs font-semibold text-slate-700 transition-all duration-300">
              {statusLabel}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
          <section className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">
                Processed Forms
              </h2>
              <span className="text-xs text-slate-500">
                {forms.length} available
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {loading ? (
                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-500">
                  Loading forms...
                </div>
              ) : (
                forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => setSelectedId(form.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selectedId === form.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 bg-white/80 hover:border-teal-200"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {form.title}
                    </p>
                    <p className="text-xs text-slate-500">{form.id}</p>
                    <p className="text-xs text-slate-400">
                      Submitted: {new Date(form.submittedAt).toDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">
                Form Preview
              </h3>
              {selectedForm ? (
                <PdfViewer url={`/api/forms/${selectedForm.id}/preview-pdf`} />
              ) : (
                <div className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-500">
                  Select a form to preview.
                </div>
              )}
            </div>
          </section>

          <section className="glass rounded-3xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Prefilled Fields
                </h2>
                <p className="text-xs text-slate-500">
                  Accept or reject each field to sync with the agent.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600">
                {agent.state?.formId ?? "No form selected"}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {FORM_FIELDS.map((field, index) => {
                const current = agent.state?.fields?.[field.key];
                if (!current) {
                  return null;
                }
                return (
                  <FormFieldRow
                    key={field.key}
                    field={field}
                    state={current}
                    validation={validation?.[field.key]}
                    nudge={fieldNudges?.[field.key]}
                    ghostActive={index <= ghostIndex}
                    ghostText={ghostText[field.key]}
                    onAccept={() => acceptField(field.key)}
                    onReject={() => rejectField(field.key)}
                    onChange={(value) => updateField(field.key, value)}
                    onBlur={() => blurField(field.key)}
                    onApplySuggestion={(value) =>
                      applySuggestedFieldValue(field.key, value)
                    }
                    options={field.key === "scheme" ? schemeOptions : undefined}
                  />
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4">
              <h3 className="text-sm font-semibold text-slate-800">
                Agent Nudges
              </h3>
              {nudges.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No nudges yet. Agent will flag high-value or KYC requirements.
                </p>
              ) : (
                <ul className="mt-2 list-disc pl-4 text-xs text-slate-600">
                  {nudges.map((nudge, index) => (
                    <li key={`${nudge}-${index}`}>{nudge}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
