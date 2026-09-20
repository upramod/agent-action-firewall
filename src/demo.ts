import { AgentActionFirewall } from "./firewall.js";
import type { ActionContext } from "./types.js";

const firewall = new AgentActionFirewall();
const sessionId = "demo-session";

async function run(action: ActionContext): Promise<void> {
  const outcome = await firewall.execute(action, async () => "tool executed");
  console.log(
    `${outcome.decision.padEnd(6)} | ${action.action.padEnd(18)} | ${outcome.reason}`,
  );
}

await run({
  sessionId,
  action: "read_calendar",
  resource: "calendar",
  sensitivity: "internal",
  destinationTrust: "trusted",
  provenance: "user",
  privileged: false,
});

await run({
  sessionId,
  action: "read_customer_records",
  resource: "customer-records",
  sensitivity: "sensitive",
  destinationTrust: "trusted",
  provenance: "user",
  privileged: false,
});

await run({
  sessionId,
  action: "upload_file",
  resource: "customer-export.csv",
  sensitivity: "internal",
  destinationTrust: "external",
  provenance: "user",
  privileged: false,
});
