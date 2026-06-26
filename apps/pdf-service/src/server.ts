import "dotenv/config";
import express, { type Request, type Response } from "express";

import { generateInvoicePdf } from "./invoice-pdf.js";
import { generateDispatchOrderPdf } from "./dispatch-order-pdf.js";
import { generateStatementPdf } from "./statement-pdf.js";
import {
  dispatchOrderPdfPayloadSchema,
  invoicePdfPayloadSchema,
  statementPdfPayloadSchema,
} from "./schema.js";
import { requirePdfServiceSecret } from "./validate-secret.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post(
  "/generate-invoice",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = invoicePdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    try {
      const pdfBuffer = await generateInvoicePdf(parsed.data);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${parsed.data.invoice.number}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Invoice PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

app.post(
  "/generate-dispatch-order",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = dispatchOrderPdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    try {
      const pdfBuffer = await generateDispatchOrderPdf(parsed.data);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="dispatch-order-${parsed.data.dispatchOrderNumber}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Dispatch order PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

app.post(
  "/generate-statement",
  requirePdfServiceSecret,
  async (req: Request, res: Response) => {
    const parsed = statementPdfPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        details: parsed.error.flatten(),
        error: "Invalid payload",
      });
      return;
    }

    try {
      const pdfBuffer = await generateStatementPdf(parsed.data);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="statement-${parsed.data.clientName}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (err) {
      console.error("Statement PDF generation failed:", err);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

const portNum = Number(process.env.PORT);
const PORT = Number.isFinite(portNum) ? portNum : 4001;

app.listen(PORT, () => {
  console.log(`PDF service listening on port ${String(PORT)}`);
});
