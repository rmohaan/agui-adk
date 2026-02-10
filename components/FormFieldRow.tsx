"use client";

import type { FieldDefinition } from "@/lib/forms";
import type { AgentFieldState, FieldNudge, ValidationResult } from "@/lib/types";

type FormFieldRowProps = {
  field: FieldDefinition;
  state: AgentFieldState;
  validation?: ValidationResult;
  nudge?: FieldNudge;
  onAccept: () => void;
  onReject: () => void;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function FormFieldRow({
  field,
  state,
  validation,
  nudge,
  onAccept,
  onReject,
  onChange,
  onBlur,
}: FormFieldRowProps) {
  const borderStyle =
    state.status === "accepted"
      ? "border-green-500"
      : state.status === "rejected"
        ? "border-amber-500"
        : "border-slate-200";

  const bgStyle =
    state.status === "accepted"
      ? "bg-green-50"
      : state.status === "rejected"
        ? "bg-amber-50"
        : "bg-white/80";

  const textStyle =
    state.status === "pending" && !state.value
      ? "text-slate-500"
      : "text-slate-900";

  const nudgeStyle =
    nudge?.severity === "good"
      ? "bg-gradient-to-r from-emerald-400 to-emerald-600 text-white"
      : nudge?.severity === "bad"
        ? "bg-gradient-to-r from-rose-500 to-red-600 text-white"
        : nudge?.severity === "unknown"
          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
          : "bg-slate-100 text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">{field.label}</p>
          {validation ? (
            <p
              className={`mt-1 text-xs font-medium ${
                validation.valid ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {validation.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Awaiting check</p>
          )}
        </div>
        {nudge ? (
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${nudgeStyle}`}>
            {nudge.message}
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <div
          className={`relative rounded-xl border px-3 py-2 transition ${borderStyle} ${bgStyle}`}
        >
          {state.status === "pending" && !state.value && state.prefill ? (
            <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-300">
              {state.prefill}
            </span>
          ) : null}
          <input
            type={field.type}
            value={state.value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            className={`w-full bg-transparent text-sm outline-none ${textStyle}`}
          />
        </div>

        {state.status === "pending" ? (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onAccept}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 transition hover:bg-emerald-100"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onReject}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 transition hover:bg-amber-100"
            >
              Reject
            </button>
            <span className="text-slate-400">
              Ghost-filled from extracted form data
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            {state.status === "accepted"
              ? "Accepted and synced with agent."
              : "User edited value will be validated by the agent."}
          </p>
        )}
      </div>
    </div>
  );
}
