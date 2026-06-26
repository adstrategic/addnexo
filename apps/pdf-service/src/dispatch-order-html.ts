import type { DispatchOrderPdfPayload } from "./schema.js";

const pallet = 70;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildDispatchOrderHtml(
  payload: DispatchOrderPdfPayload,
): string {
  const rows = payload.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.product)}</td>
        <td class="right">${escapeHtml(item.lot)}</td>
        <td class="right">${escapeHtml(String(item.quantity))}</td>
        <td class="right">${escapeHtml((item.quantity / pallet).toFixed(2))}</td>
        <td class="right">${escapeHtml(item.totalWeightKg.toFixed(2))}</td>
      </tr>
    `,
    )
    .join("");

  const purchaseOrderLine = payload.purchaseOrderRef
    ? `<p class="meta"><strong>Ref: PO ${escapeHtml(payload.purchaseOrderRef)}</strong></p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <style>
      @page { size: Letter; margin: 40px 40px 60px; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: #111;
      }
      .header {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 50px;
        margin-bottom: 30px;
      }
      .logo {
        width: 300px;
        max-height: 180px;
        object-fit: contain;
      }
      .title {
        margin: 0 0 5px;
        font-size: 22px;
        font-weight: 700;
      }
      .meta {
        margin: 0 0 5px;
        font-size: 16px;
      }
      .section-title {
        margin: 0 0 5px;
        font-size: 16px;
        font-weight: 700;
      }
      .section-line {
        margin: 0 0 5px;
        font-size: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 30px;
      }
      th, td {
        border: 2px solid #aaa;
        padding: 10px 8px;
      }
      th {
        background: #e5e5e5;
        text-align: center;
      }
      .right { text-align: right; }
      .note {
        margin: 0 0 60px;
      }
      .signature {
        width: 300px;
        border-top: 1px dashed #444;
        margin-bottom: 5px;
      }
      .vendor-title {
        margin: 50px 0 5px;
        font-weight: 700;
      }
      .paca {
        margin: 50px 0 0;
        color: #666;
        font-size: 8px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img class="logo" src="${payload.company.logoDataUrl}" alt="Company logo" />
      <div>
        <p class="title">DISPATCH ORDER No ${escapeHtml(payload.dispatchOrderNumber)}</p>
        ${purchaseOrderLine}
        <p class="meta">Issue Date: ${escapeHtml(payload.issueDate)}</p>
      </div>
    </div>

    <p class="section-title">Pick up information:</p>
    <p class="section-line">${escapeHtml(payload.pickUpAddress || "N/A")}</p>
    <p class="section-line" style="margin-bottom: 30px;">${escapeHtml(payload.cityInfo || "")}</p>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="width: 50px;">Lot</th>
          <th style="width: 50px;">Quantity</th>
          <th style="width: 60px;">Pallets</th>
          <th style="width: 70px;">Weight (KG)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr>
          <td><strong>Total</strong></td>
          <td></td>
          <td class="right"><strong>${escapeHtml(String(payload.totalQuantity))}</strong></td>
          <td class="right"><strong>${escapeHtml((payload.totalQuantity / pallet).toFixed(2))}</strong></td>
          <td class="right"><strong>${escapeHtml(payload.totalWeightKg.toFixed(2))}</strong></td>
        </tr>
      </tbody>
    </table>

    <p class="note">I confirm that all the products received are in good order and conditions.</p>
    <div class="signature"></div>
    <p style="margin: 0;">Receiver's Signature</p>

    <p class="vendor-title">Vendor:</p>
    <p style="margin: 0;">${escapeHtml(payload.vendorName)}</p>

    <p class="paca">${escapeHtml(payload.pacaTerms)}</p>
  </body>
</html>`;
}
