import { Queue } from "bullmq";

import { type AuthEmailJobData } from "./auth-email.js";
import { getProducerConnectionOptions } from "./connection.js";
export type { AuthEmailJobData } from "./auth-email.js";

const connection = getProducerConnectionOptions();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    delay: 5000,
    type: "exponential" as const,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};

// Processes a single OutboxEvent by ID (INVOICE_CREATED, DISPATCH_ORDER_EMITTED)
export const outboxProcessQueue = new Queue("outbox-process", {
  connection,
  defaultJobOptions,
});

// Sends a statement PDF email to a client
export const emailStatementQueue = new Queue("email-statement", {
  connection,
  defaultJobOptions,
});

// Notifies the client when a dispatch order is marked DISPATCHED
export const emailDispatchDispatchedQueue = new Queue(
  "email-dispatch-dispatched",
  { connection, defaultJobOptions },
);

export const authEmailQueue = new Queue<AuthEmailJobData>("auth-email", {
  connection,
  defaultJobOptions,
});

export interface OutboxProcessJobData {
  eventId: number;
}

export interface EmailStatementJobData {
  clienteId: number;
  email: string;
  organizationId: string;
}

export interface EmailDispatchDispatchedJobData {
  clientDisplayName: string;
  clienteEmail1: string;
  clienteEmail2: null | string;
  dispatchOrderGId: number;
  DOGNro: number;
  organizationId: string;
}
