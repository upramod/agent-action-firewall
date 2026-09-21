import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { toNodeHandler } from "@modelcontextprotocol/node";

import { createFirewallMcpHandler } from "./mcp.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "127.0.0.1";

const allowedHosts = new Set(
  (process.env.ALLOWED_HOSTS ?? "localhost,127.0.0.1")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const handler = createFirewallMcpHandler();
const nodeHandler = toNodeHandler(handler);

function reject(res: ServerResponse, message: string): void {
  res.statusCode = 403;
  res.setHeader("content-type", "application/json");
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message },
      id: null,
    }),
  );
}

function requestHost(req: IncomingMessage): string | undefined {
  const raw = req.headers.host?.trim().toLowerCase();
  if (!raw) return undefined;
  return raw.replace(/:\d+$/, "");
}

function validateRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const reqHost = requestHost(req);
  if (!reqHost || !allowedHosts.has(reqHost)) {
    reject(res, `Invalid Host: ${reqHost ?? "missing"}`);
    return false;
  }

  const origin = req.headers.origin;
  if (!origin) return true;

  if (allowedOrigins.has(origin)) return true;

  try {
    const parsed = new URL(origin);
    const originHost = parsed.hostname.toLowerCase();

    // Local MCP Inspector uses a localhost browser origin while proxying to
    // the configured MCP endpoint.
    if (
      originHost === "localhost" ||
      originHost === "127.0.0.1" ||
      allowedHosts.has(originHost)
    ) {
      return true;
    }
  } catch {
    // Fall through to the explicit rejection below.
  }

  reject(res, `Invalid Origin: ${origin}`);
  return false;
}

const httpServer = createServer((req, res) => {
  if (!validateRequest(req, res)) return;
  void nodeHandler(req, res);
});

httpServer.listen(port, host, () => {
  console.error(
    `Agent Action Firewall MCP server listening on http://${host}:${port}/mcp`,
  );
  console.error(`Allowed hosts: ${[...allowedHosts].join(", ")}`);
});

async function shutdown(): Promise<void> {
  await handler.close();
  httpServer.close(() => process.exit(0));
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
