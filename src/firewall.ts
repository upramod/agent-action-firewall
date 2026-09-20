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
    const evaluation = this.resolveDecision(action, approved);
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
    const evaluation = this.resolveDecision(action, approved);

    if (evaluation.decision !== "ALLOW") {
      this.record(action, evaluation);
      return { ...evaluation };
    }

    // Record an allowed action only after the protected callback succeeds.
    // A failed callback did not create the side effect that future policy
    // should reason about.
    const result = await run();
    this.record(action, evaluation);

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

  private resolveDecision(
    action: ActionContext,
    approved: boolean,
  ): Evaluation {
    const evaluation = this.assess(action);

    if (evaluation.decision === "REVIEW" && approved) {
      return {
        decision: "ALLOW",
        reason: "Human approval granted.",
      };
    }

    return evaluation;
  }
}
