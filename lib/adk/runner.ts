import { InMemoryRunner } from "@google/adk";
import { adkAgent } from "@/lib/adk/agent";

const appName = "agui-adk";
const defaultUserId = "user";

const runner = new InMemoryRunner({
  agent: adkAgent,
  appName,
});

export async function getOrCreateSession(threadId: string, state: Record<string, unknown>) {
  const session = await runner.sessionService.getSession({
    appName,
    userId: defaultUserId,
    sessionId: threadId,
  });

  if (session) {
    return session;
  }

  return runner.sessionService.createSession({
    appName,
    userId: defaultUserId,
    sessionId: threadId,
    state,
  });
}

export function getRunner() {
  return runner;
}
