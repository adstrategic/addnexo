import "dotenv/config";

import { startWorkers } from "./queue/workers.js";
import { processOutboxEvents } from "./workers/outbox-worker.js";

const hasRedis =
  (typeof process.env.REDIS_URL === "string" &&
    process.env.REDIS_URL.trim() !== "") ||
  (typeof process.env.REDIS_HOST === "string" &&
    process.env.REDIS_HOST.trim() !== "");

if (!hasRedis) {
  console.error(
    "[worker] Redis is not configured (REDIS_URL or REDIS_HOST). Exiting.",
  );
  process.exit(1);
}

const {
  authEmailWorker,
  outboxWorker,
  statementEmailWorker,
  dispatchDispatchedEmailWorker,
} = startWorkers();

const OUTBOX_POLL_INTERVAL_MS = 60_000;
const outboxPoller = setInterval(() => {
  processOutboxEvents().catch((err: unknown) => {
    console.error("[outbox-poller] Unhandled error:", err);
  });
}, OUTBOX_POLL_INTERVAL_MS);
console.log("[outbox-poller] Polling every 60s");

async function shutdown(): Promise<void> {
  console.log("[worker] Shutting down...");
  clearInterval(outboxPoller);
  await Promise.all([
    authEmailWorker.close(),
    outboxWorker.close(),
    statementEmailWorker.close(),
    dispatchDispatchedEmailWorker.close(),
  ]);
  console.log("[worker] Workers closed.");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
