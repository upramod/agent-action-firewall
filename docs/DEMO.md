# Demo Script

Target length: about 90 seconds.

## 1. Problem

Explain one sentence:

> A tool call can be safe by itself but unsafe because of what the agent already did in the session.

## 2. Start the server

```bash
npm install
npm start
```

The MCP endpoint is:

```text
http://127.0.0.1:3000/mcp
```

## 3. Show the policy sequence

In another terminal:

```bash
npm run demo
```

The sequence demonstrates:

1. reading a calendar is allowed
2. reading sensitive customer records is allowed
3. uploading a file to an external destination is blocked

Point out that uploads are not globally forbidden. The third action is blocked because it crosses an external trust boundary after sensitive data was accessed earlier in the same session.

## 4. Show MCP enforcement

Open an MCP client or Inspector against:

```text
http://127.0.0.1:3000/mcp
```

Use `execute_guarded_demo_action` twice with the same session identity.

First call:

```json
{
  "sessionId": "demo",
  "action": "read_customer_records",
  "sensitivity": "sensitive",
  "destinationTrust": "trusted",
  "provenance": "user",
  "privileged": false
}
```

Expected: `ALLOW` and `executed=true`.

Second call:

```json
{
  "sessionId": "demo",
  "action": "upload_file",
  "resource": "customer-export.csv",
  "sensitivity": "internal",
  "destinationTrust": "external",
  "provenance": "user",
  "privileged": false
}
```

Expected: `BLOCK` and `executed=false`.

## 5. Show trusted session binding

Explain that a production host can set `x-agent-session-id` as transport metadata. When present, the server ignores a model-authored session ID, preventing the agent from escaping history by choosing a new ID.

## 6. Close

Show the green GitHub Actions run and state:

> The blocked action never reaches the protected callback.
