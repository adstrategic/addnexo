import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * Master switch for the dispatch-order → invoice conversion UI.
 * Backed end-to-end by the POST /invoices endpoint; flip to `false` to hide.
 */
export const INVOICE_CONVERSION_ENABLED = true;

/**
 * Combines a date-only value with the current UTC time for API submission.
 */
export function combineDateWithCurrentTimeUTC(date: Date): string {
  const now = dayjs.utc();
  const d = dayjs(date);
  return dayjs
    .utc()
    .year(d.year())
    .month(d.month())
    .date(d.date())
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond())
    .toISOString();
}

export const dispatchOrderUtils = {
  obtenerEstadoLabel: (
    estado: "DRAFT" | "EMITTED" | "DISPATCHED" | "INVOICED" | "ANULATED",
  ): string => {
    switch (estado) {
      case "DRAFT":
        return "Unissued";
      case "EMITTED":
        return "Issued";
      case "DISPATCHED":
        return "Dispatched";
      case "INVOICED":
        return "Invoiced";
      case "ANULATED":
        return "Anulated";
      default:
        return estado;
    }
  },

  obtenerTipoPagoLabel: (tipo: "CONTADO" | "CANJE" | "CREDITO"): string => {
    if (tipo === "CONTADO") return "Cash";
    if (tipo === "CANJE") return "Exchange";
    return "Credit";
  },
};
