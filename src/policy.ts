import type { ActionContext, Evaluation, RecordedAction } from "./types.js";

export function evaluateAction(
  current: ActionContext,
  history: RecordedAction[],
): Evaluation {
  const previouslyReadSensitive = history.some(
    (event) =>
      event.decision !== "BLOCK" &&
      event.sensitivity === "sensitive" &&
      isReadLike(event.action),
  );

  const previouslyUsedUntrustedInput = history.some(
    (event) => event.decision !== "BLOCK" && event.provenance === "untrusted",
  );

  if (
    isExportLike(current.action) &&
    current.destinationTrust === "external" &&
    (current.sensitivity === "sensitive" || previouslyReadSensitive)
  ) {
    return {
      decision: "BLOCK",
      reason:
        "Sensitive data would cross an external trust boundary after being accessed in this session.",
    };
  }

  if (
    current.privileged &&
    (current.provenance === "untrusted" || previouslyUsedUntrustedInput)
  ) {
    return {
      decision: "REVIEW",
      reason:
        "A privileged action is influenced by untrusted input and requires human confirmation.",
    };
  }

  if (
    current.sensitivity === "sensitive" &&
    current.destinationTrust === "unknown"
  ) {
    return {
      decision: "REVIEW",
      reason:
        "Sensitive data is involved and the destination trust level is unknown.",
    };
  }

  return {
    decision: "ALLOW",
    reason: "No configured policy rule requires review or blocking.",
  };
}

function isReadLike(action: string): boolean {
  return /read|fetch|get|query|list|load/i.test(action);
}

function isExportLike(action: string): boolean {
  return /send|upload|export|post|publish|forward/i.test(action);
}
