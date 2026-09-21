# Friction Log

These entries document real setup friction encountered while building the project.

## 1. Alexa+ integration path was not immediately obvious

**Task attempted:** Determine how to qualify for the Alexa+ track.

**Expected:** One clear path from project type to required runtime integration.

**Actual:** Documentation exposed several concepts, including Agent Skills and MCP add-on tooling, which made it easy to assume private Alexa+ CLI access was required.

**Severity:** Important

**Workaround:** Re-read the hackathon rules and confirmed that a self-hosted MCP server implementing MCP 2025-11-25+ over Streamable HTTP is itself an accepted Alexa+ submission.

**Suggestion:** Put a decision table at the top of the Alexa+ hackathon guide:

- Agent Skill
- Self-hosted MCP server
- Simulated Alexa+ experience

and explicitly state which paths require partner-only tooling.

## 2. Public MCP host validation

**Task attempted:** Deploy the local MCP server to a public HTTPS host.

**Expected:** The same server configuration to work behind a public host.

**Actual:** Localhost-only host/origin validation correctly rejected the Azure Container Apps hostname.

**Severity:** Moderate

**Workaround:** Replaced localhost-only validation with an explicit configurable `ALLOWED_HOSTS` allowlist.

**Suggestion:** Include a production-host validation example in MCP deployment documentation.

## 3. Browser testing of an MCP endpoint

**Task attempted:** Verify the public URL in a normal browser.

**Expected:** A simple indication that the MCP server was healthy.

**Actual:** The endpoint returned a JSON-RPC method error because a browser GET is not an MCP request.

**Severity:** Minor

**Workaround:** Used MCP Inspector to validate Streamable HTTP behavior.

**Suggestion:** A small optional health endpoint in starter templates would make deployment checks easier.

## 4. Session identity is security-sensitive

**Task attempted:** Preserve sequence-aware policy across tool calls.

**Expected:** A session ID would be enough to correlate action history.

**Actual:** If a model can freely choose the session ID, it can potentially start a new history and evade sequence-aware rules.

**Severity:** Important

**Workaround:** Added trusted transport-bound session identity through `x-agent-session-id`, which overrides model-authored session IDs.

**Suggestion:** Agent-runtime guidance should treat execution/session identity as trusted host metadata, not ordinary model-provided tool input.
