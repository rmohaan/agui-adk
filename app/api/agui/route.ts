import { EventType, RunAgentInputSchema } from "@ag-ui/core";
import { EventEncoder } from "@ag-ui/encoder";
import { getFunctionCalls, getFunctionResponses, stringifyContent } from "@google/adk";
import type { Content } from "@google/genai";

import { getOrCreateSession, getRunner } from "@/lib/adk/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const escapeJsonPointer = (value: string) =>
  value.replace(/~/g, "~0").replace(/\//g, "~1");

const toText = (content: string | Array<{ type: string; text?: string }>) => {
  if (typeof content === "string") return content;
  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join(" ");
};

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = RunAgentInputSchema.safeParse(payload);

  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 });
  }

  const input = parsed.data;
  const encoder = new EventEncoder({
    accept: request.headers.get("accept") ?? undefined,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encodeBinary(event as never));
      };

      try {
        send({
          type: EventType.RUN_STARTED,
          threadId: input.threadId,
          runId: input.runId,
          parentRunId: input.parentRunId,
          input,
        });

        send({
          type: EventType.STATE_SNAPSHOT,
          snapshot: input.state ?? {},
        });

        const session = await getOrCreateSession(input.threadId, input.state ?? {});
        const runner = getRunner();

        const lastUser = [...input.messages]
          .reverse()
          .find((msg) => msg.role === "user");
        const messageText = lastUser
          ? toText(lastUser.content)
          : `State update: ${JSON.stringify(input.state ?? {})}`;

        const newMessage: Content = {
          role: "user",
          parts: [{ text: messageText }],
        };

        const messageId = `${input.runId}-assistant`;
        let startedText = false;

        for await (const event of runner.runAsync({
          userId: session.userId,
          sessionId: session.id,
          newMessage,
          stateDelta: input.state ?? {},
        })) {
          if (event.actions?.stateDelta && Object.keys(event.actions.stateDelta).length > 0) {
            send({
              type: EventType.STATE_DELTA,
              delta: Object.entries(event.actions.stateDelta).map(([key, value]) => ({
                op: "add",
                path: `/${escapeJsonPointer(key)}`,
                value,
              })),
            });
          }

          const functionCalls = getFunctionCalls(event);
          functionCalls.forEach((call, index) => {
            const toolCallId = call.id ?? `${input.runId}-tool-${index}`;
            send({
              type: EventType.TOOL_CALL_START,
              toolCallId,
              toolCallName: call.name,
              parentMessageId: messageId,
            });
            send({
              type: EventType.TOOL_CALL_ARGS,
              toolCallId,
              delta: JSON.stringify(call.args ?? {}),
            });
            send({
              type: EventType.TOOL_CALL_END,
              toolCallId,
            });
          });

          const functionResponses = getFunctionResponses(event);
          functionResponses.forEach((response, index) => {
            const toolCallId = response.id ?? `${input.runId}-tool-${index}`;
            send({
              type: EventType.TOOL_CALL_RESULT,
              messageId: `${toolCallId}-result`,
              toolCallId,
              content: JSON.stringify(response.response ?? {}),
            });
          });

          const text = stringifyContent(event);
          if (text) {
            if (!startedText) {
              startedText = true;
              send({
                type: EventType.TEXT_MESSAGE_START,
                messageId,
                role: "assistant",
              });
            }
            send({
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: text,
            });
          }
        }

        if (startedText) {
          send({
            type: EventType.TEXT_MESSAGE_END,
            messageId,
          });
        }

        send({
          type: EventType.RUN_FINISHED,
          threadId: input.threadId,
          runId: input.runId,
        });
      } catch (error) {
        send({
          type: EventType.RUN_ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": encoder.getContentType(),
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
