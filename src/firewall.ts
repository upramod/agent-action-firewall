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
    const evaluation = this.assess(action);

    if (evaluation.decision === "BLOCK") {
      this.record(action, evaluation);
      return { ...evaluation };
    }

    if (evaluation.decision === "REVIEW" && !approved) {
      this.record(action, evaluation);
      return { ...evaluation };
    }

    const result = await run();
    this.record(action, {
      decision: "ALLOW",
      reason:
        evaluation.decision === "REVIEW"
          ? "Human approval granted."
          : evaluation.reason,
    });

    return {
      decision: "ALLOW",
      reason:
        evaluation.decision === "REVIEW"
          ? "Human approval granted."
          : evaluation.reason,
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
