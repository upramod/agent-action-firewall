# Judge Testing Instructions

Agent Action Firewall is a self-hosted MCP server.

## Public MCP endpoint

```text
https://agent-action-firewall.wonderfuldesert-89e7468a.westus2.azurecontainerapps.io/mcp
```

Transport: Streamable HTTP

No authentication is required for the hackathon demo endpoint.

A simple deployment health check is also available at:

```text
https://agent-action-firewall.wonderfuldesert-89e7468a.westus2.azurecontainerapps.io/healthz
```

Expected response:

```json
{"status":"ok"}
```

The exposed demo tool performs no destructive or external side effect. It only simulates whether a protected callback would execute.

## Recommended test

Use an MCP client or MCP Inspector.

Call `execute_guarded_demo_action` twice with the same session.

### Step 1 - sensitive read

```json
{
  "sessionId": "judge-demo",
  "action": "read_customer_records",
  "sensitivity": "sensitive",
  "destinationTrust": "trusted",
  "provenance": "user",
  "privileged": false
}
```

Expected:

```text
ALLOW
executed=true
```

### Step 2 - external upload

```json
{
  "sessionId": "judge-demo",
  "action": "upload_file",
  "resource": "customer-export.csv",
  "sensitivity": "internal",
  "destinationTrust": "external",
  "provenance": "user",
  "privileged": false
}
```

Expected:

```text
BLOCK
executed=false
```

The second call is blocked because the same session previously executed a sensitive read.

## Local test

```bash
npm install
npm test
npm run build
npm run demo
npm start
```

The local endpoint is:

```text
http://127.0.0.1:3000/mcp
```

## Notes

Opening the MCP URL directly in a normal browser may return a JSON-RPC `Method not allowed` response because the browser sends a plain GET rather than an MCP request.
