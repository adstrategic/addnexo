import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { DispatchOrderPdfPayload } from "../../../pdf/pdf-contracts.js";

import { requestDispatchOrderPdf } from "../../../pdf/pdf-service.client.js";
import { getDispatchOrderBySecuencia } from "../dispatch-order.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function getLogoDataUrl(): string {
  const logoPath = path.join(__dirname, "../../../assets/addnexo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${logoBase64}`;
}

const PACA_TERMS =
  "PACA TERMS APPLY. ADDNEXO. Interest at 1.5% per month added to unpaid balance. Interest and attorney’s fees necessary to collect any balance due hereunder shall be considered sums owing in connection with this transaction under the PACA trust. The perishable agricultural commodities listed on this invoice are sold subject to the statutory trust authorized by Section 5 (c) of the Perishable Agricultural Commodities Act, 1930 (7 U.S.C 499e(c)). The seller of these commodities retains a trust claim over these commodities, all inventories of food or other products derived from these commodities, and any receivables or proceeds from the sale of these commodities until full payment is received. All transactions are condition only, no grade contracts and PACA good delivery standards apply, unless a grade is specifically stated. No claims will be honored unless the Buyer notifies ADDNEXO of the claim no later than 24 hours after arrival. All prices are subject to change and availability. All produce is sold FOB Good Delivery.";

export async function buildDispatchOrderPdfPayload(
  secuencia: number,
  organizationId: string,
): Promise<DispatchOrderPdfPayload> {
  const dispatchOrder = await getDispatchOrderBySecuencia(
    secuencia,
    organizationId,
  );

  if (dispatchOrder.dispatchOrderU.length === 0) {
    throw new Error("Dispatch order has no items");
  }

  const issueDate = formatDate(dispatchOrder.DOGFechaCreado);
  const cityInfo = `${dispatchOrder.ciudad.nombre}, ${dispatchOrder.ciudad.estado.nombre}, ${dispatchOrder.ciudad.estado.pais.nombre}`;
  const totalQuantity = dispatchOrder.dispatchOrderU.reduce(
    (sum, item) => sum + Number(item.DOUCantidad),
    0,
  );
  const totalWeightKg = Number(dispatchOrder.DOGPesoTotalKg);

  return {
    cityInfo,
    company: {
      logoDataUrl: getLogoDataUrl(),
    },
    dispatchOrderNumber: String(dispatchOrder.DOGNro),
    issueDate,
    items: dispatchOrder.dispatchOrderU.map((item) => ({
      lot: item.DOULote || "N/A",
      product: item.invcaruni.CKDescripcion || "N/A",
      quantity: Number(item.DOUCantidad),
      totalWeightKg: Number(item.DOUPesoTotalKg),
    })),
    pacaTerms: PACA_TERMS,
    pickUpAddress: dispatchOrder.DOGDireccionEntrega || "",
    ...(dispatchOrder.DOGPurchaseOrder
      ? { purchaseOrderRef: dispatchOrder.DOGPurchaseOrder }
      : {}),
    totalQuantity,
    totalWeightKg,
    vendorName: dispatchOrder.vendedor.VNombre || "N/A",
  };
}

export async function generateDispatchOrderPDF(
  secuencia: number,
  organizationId: string,
): Promise<Buffer> {
  const payload = await buildDispatchOrderPdfPayload(secuencia, organizationId);
  return requestDispatchOrderPdf(payload);
}
