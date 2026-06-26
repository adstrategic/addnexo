import { EstadoFactura, prisma } from "@repo/db";

import {
  BUSINESS_TZ,
  INVOICE_DATE_ONLY_TZ,
  toDateStringInTimezone,
} from "../../lib/business-dates.js";

export function parseMarkOverdueDryRun(): boolean {
  const v = (process.env.MARK_INVOICES_OVERDUE_DRY_RUN ?? "")
    .trim()
    .toLowerCase();
  return ["1", "true", "yes"].includes(v);
}

export interface MarkOverdueRunStats {
  candidates: number;
  dryRun: boolean;
  flipped: number;
  todayBogota: string;
}

export async function runMarkInvoicesOverdue(): Promise<MarkOverdueRunStats> {
  const dryRun = parseMarkOverdueDryRun();
  const now = new Date();
  const todayStr = toDateStringInTimezone(now, BUSINESS_TZ);

  console.log(
    `[mark-overdue] starting today=${todayStr} (${BUSINESS_TZ}) dryRun=${dryRun}`,
  );

  // Permissive narrowing: any ACTIVE invoice with outstanding balance and a due date
  // strictly before "now" is a candidate. The calendar-day check below filters out
  // invoices whose due date is today (so today stays ACTIVE, tomorrow flips). The due
  // date is a @db.Date (stored as UTC midnight) so it is compared in UTC, while "today"
  // is resolved in the business timezone.
  const candidates = await prisma.facturag.findMany({
    where: {
      FGEstado: EstadoFactura.ACTIVE,
      FGSaldo: { gt: 0 },
      FGFechaVencimiento: { lt: now },
    },
    select: {
      FGId: true,
      FGOrganizationId: true,
      FGNro: true,
      FGFechaVencimiento: true,
    },
  });

  const idsToFlip = candidates
    .filter(
      (c) =>
        toDateStringInTimezone(c.FGFechaVencimiento, INVOICE_DATE_ONLY_TZ) <
        todayStr,
    )
    .map((c) => c.FGId);

  console.log(
    `[mark-overdue] today=${todayStr} candidates=${candidates.length} toFlip=${idsToFlip.length}`,
  );

  if (dryRun) {
    if (idsToFlip.length > 0) {
      const previewIds = idsToFlip.slice(0, 20);
      console.log(
        `[mark-overdue] DRY_RUN would flip FGId(s) preview=[${previewIds.join(",")}]${
          idsToFlip.length > previewIds.length
            ? ` ... (+${idsToFlip.length - previewIds.length} more)`
            : ""
        }`,
      );
    } else {
      console.log("[mark-overdue] DRY_RUN nothing to flip");
    }
    return {
      dryRun,
      todayBogota: todayStr,
      candidates: candidates.length,
      flipped: idsToFlip.length,
    };
  }

  let flipped = 0;
  if (idsToFlip.length === 0) {
    console.log("[mark-overdue] nothing to flip");
  } else {
    try {
      const res = await prisma.facturag.updateMany({
        where: { FGId: { in: idsToFlip } },
        data: { FGEstado: EstadoFactura.OVERDUE },
      });
      flipped = res.count;
      const previewIds = idsToFlip.slice(0, 20);
      console.log(
        `[mark-overdue] flipped count=${flipped} FGId(s) preview=[${previewIds.join(",")}]${
          idsToFlip.length > previewIds.length
            ? ` ... (+${idsToFlip.length - previewIds.length} more)`
            : ""
        }`,
      );
    } catch (err) {
      console.error(
        `[mark-overdue] updateMany failed for ${idsToFlip.length} FGId(s):`,
        err,
      );
      throw err;
    }
  }

  return {
    dryRun,
    todayBogota: todayStr,
    candidates: candidates.length,
    flipped,
  };
}
