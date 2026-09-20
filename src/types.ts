export type Decision = "ALLOW" | "REVIEW" | "BLOCK";
export type Sensitivity = "public" | "internal" | "sensitive";
export type DestinationTrust = "trusted" | "unknown" | "external";
export type Provenance = "trusted" | "user" | "untrusted";

export interface ActionContext {
  sessionId: string;
  action: string;
  resource?: string;
  sensitivity: Sensitivity;
  destinationTrust: DestinationTrust;
  provenance: Provenance;
  privileged: boolean;
}

export interface RecordedAction extends ActionContext {
  decision: Decision;
  reason: string;
}

export interface Evaluation {
  decision: Decision;
  reason: string;
}
