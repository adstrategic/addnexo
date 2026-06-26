import fs from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { InvoicePdfPayload } from "../../../pdf/pdf-contracts.js";

import { requestInvoicePdf } from "../../../pdf/pdf-service.client.js";
import { getFacturaBySecuencia } from "../invoices.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

function getLogoDataUrl(): string {
  const logoPath = path.join(__dirname, "../../../assets/addnexo.png");
  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  return `data:image/png;base64,${logoBase64}`;
}

const INVOICE_COMPANY = {
  address: "1309 Diner Dr, Cedar Park",
  email: "adstrategicbusiness@gmail.com",
  name: "ADDNEXO",
  phone: "+1 754 254 9069",
};

const WIRE_TRANSFER_INSTRUCTIONS =
  "Wire Transfer Instruction - Account Name: ADDNEXO Account No 000000000000 ACH: 000000000 WIRE: 000000000 [Bank Name]";

const PACA_TERMS =
  "PACA TERMS APPLY. ADDNEXO. Interest at 1.5% per month added to unpaid balance. Interest and attorney's fees necessary to collect any balance due hereunder shall be considered sums owing in connection with this transaction under the PACA trust. The perishable agricultural commodities listed on this invoice are sold subject to the statutory trust authorized by Section 5 (c) of the Perishable Agricultural Commodities Act, 1930 (7 U.S.C 499e(c)). The seller of these commodities retains a trust claim over these commodities, all inventories of food or other products derived from these commodities, and any receivables or proceeds from the sale of these commodities until full payment is received. All transactions are condition only, no grade contracts and PACA good delivery standards apply, unless a grade is specifically stated. No claims will be honored unless the Buyer notifies ADDNEXO of the claim no later than 24 hours after arrival. All prices are subject to change and availability. All produce is sold FOB Good Delivery.";

export async function buildInvoicePdfPayload(
  secuencia: number,
  organizationId: string,
): Promise<InvoicePdfPayload> {
  const factura = await getFacturaBySecuencia(secuencia, organizationId);
  if (!factura) {
    throw new Error("Invoice not found");
  }
  if (!factura.facturau || factura.facturau.length === 0) {
    throw new Error("Invoice has no items");
  }

  const invoiceDate = formatDate(factura.FGFechaCreado);
  const dueDate = formatDate(factura.FGFechaVencimiento);
  const clientName =
    factura.cltemae?.CRazonSocial || factura.cltemae?.CNombreCliente || "N/A";
  const clientAddress =
    factura.cltemae?.CDireccion || factura.FGDireccionEntrega || "N/A";
  const clientPhone =
    factura.cltemae?.CTelefono1 || factura.FGTelefono1 || "N/A";
  const clientContact = factura.cltemae?.CNombreCliente || "N/A";
  const clientEmail = factura.cltemae?.CCorreo1 || factura.FGCorreo1 || "N/A";
  const invoiceMessage =
    factura.FGCondicion1 || factura.FGCondicion2 || factura.FGCondicion3 || "";
  const purchaseOrder = factura.FGPurchaseOrder || "";

  const subtotal =
    Number(factura.FGValorTotalNeto) + Number(factura.FGTotalDescuento);
  const discount = Number(factura.FGTotalDescuento);
  const total = Number(factura.FGValorTotalNeto);

  return {
    client: {
      address: clientAddress,
      contact: clientContact,
      email: clientEmail,
      name: clientName,
      phone: clientPhone,
    },
    company: {
      ...INVOICE_COMPANY,
      logoDataUrl: getLogoDataUrl(),
    },
    invoice: {
      dueDate,
      issueDate: invoiceDate,
      ...(invoiceMessage ? { message: invoiceMessage } : {}),
      number: factura.FGNro.toString().padStart(4, "0"),
      ...(purchaseOrder ? { purchaseOrder } : {}),
    },
    items: factura.facturau.map((item, index) => ({
      amount: Number(item.FUVrNeto),
      description: item.invcaruni.CKDescripcion,
      index: index + 1,
      quantity: Number(item.FUCantidad),
      unitPrice: Number(item.FUVrUnitario),
    })),
    pacaTerms: PACA_TERMS,
    totals: {
      discount,
      subtotal,
      total,
    },
    wireTransferInstructions: WIRE_TRANSFER_INSTRUCTIONS,
  };
}

export async function generateInvoicePDF(
  secuencia: number,
  organizationId: string,
): Promise<Buffer> {
  const payload = await buildInvoicePdfPayload(secuencia, organizationId);
  return requestInvoicePdf(payload);
}
