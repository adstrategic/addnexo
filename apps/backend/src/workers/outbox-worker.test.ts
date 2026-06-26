import test from "node:test";
import assert from "node:assert/strict";

import {
  filterPendingEmails,
  normalizeDispatchRecipientEmails,
} from "./outbox-worker.helpers.js";

test("normalizeDispatchRecipientEmails filters invalid and deduplicates", () => {
  const result = normalizeDispatchRecipientEmails([
    "warehouse@example.com",
    "",
    null,
    undefined,
    "N/A",
    "warehouse@example.com",
    "manager@example.com",
  ]);

  assert.deepEqual(result, ["warehouse@example.com", "manager@example.com"]);
});

test("filterPendingEmails excludes already sent and permanent failures", () => {
  const result = filterPendingEmails(
    ["one@example.com", "two@example.com", "three@example.com"],
    {
      sent: ["one@example.com"],
      permanentFailed: [{ email: "two@example.com", error: "Mailbox not found" }],
    },
  );

  assert.deepEqual(result, ["three@example.com"]);
});
