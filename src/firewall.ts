import { evaluateAction } from "./policy.js";
import type {
  ActionContext,
  Decision,
  Evaluation,
  RecordedAction,
} from "./types.js";

export class AgentActionFirewall {
  private readonly history = new Map<string, RecordedAction[]>();

  assess(action: ActionContext): Evaluation {
    return evaluateAction(action, this.getHistory(action.sessionId));
  }

  authorize(action: ActionContext, approved = false): Evaluation {
    const evaluation = this.assess(action);

    if (evaluation.decision === "REVIEW" && approved) {
      const allowed = {
        decision: "ALLOW" as const,
        reason: "Human approval granted.",
      };
      this.record(action, allowed);
      return allowed;
    }

    this.record(action, evaluation);
    return evaluation;
  }

  record(action: ActionContext, evaluation: Evaluation): void {
    const events = this.getHistory(action.sessionId);
    events.push({
      ...action,
      decision: evaluation.decision,
      reason: evaluation.reason,
    });
    this.history.set(action.sessionId, events);
  }

  async execute<T>(
    action: ActionContext,
    run: () => Promise<T>,
    approved = false,
  ): Promise<{ decision: Decision; result?: T; reason: string }> {
    const evaluation = this.authorize(action, approved);

    if (evaluation.decision !== "ALLOW") {
      return { ...evaluation };
    }

    const result = await run();

    return {
      decision: "ALLOW",
      reason: evaluation.reason,
      result,
    };
  }

  getHistory(sessionId: string): RecordedAction[] {
    return [...(this.history.get(sessionId) ?? [])];
  }

  clear(sessionId: string): void {
    this.history.delete(sessionId);
  }
}
