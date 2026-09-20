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

Point out that the third action is not blocked because uploads are always forbidden. It is blocked because the current action crosses an external trust boundary after sensitive data was accessed earlier in the same session.

## 4. Show MCP

Open the MCP Inspector against:

```text
http://127.0.0.1:3000/mcp
```

Call `guard_action` twice using the same `sessionId`.

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

Expected: `ALLOW`.

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

Expected: `BLOCK`.

## 5. Close

Show the execution-gate test in GitHub Actions and state:

> The protected tool is never invoked when the firewall blocks the action.
