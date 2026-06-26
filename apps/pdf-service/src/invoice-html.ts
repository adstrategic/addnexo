import type { InvoicePdfPayload } from "./schema.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function buildInvoiceHtml(payload: InvoicePdfPayload): string {
  const rows = payload.items
    .map(
      (item) => `
        <tr>
          <td class="center">${item.index}</td>
          <td>${escapeHtml(item.description)}</td>
          <td class="right">${escapeHtml(String(item.quantity))}</td>
          <td class="right">${formatCurrency(item.unitPrice)}</td>
          <td class="right">${formatCurrency(item.amount)}</td>
        </tr>
      `,
    )
    .join("");

  const messageBlock = payload.invoice.message
    ? `<div class="invoice-meta-row">MESSAGE: ${escapeHtml(payload.invoice.message)}</div>`
    : "";
  const purchaseOrderBlock = payload.invoice.purchaseOrder
    ? `<div class="invoice-meta-row">P.O. ${escapeHtml(payload.invoice.purchaseOrder)}</div>`
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
        position: relative;
        font-family: Helvetica, Arial, sans-serif;
        font-size: 14px;
        color: #111;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background-image: url("${payload.company.logoDataUrl}");
        background-repeat: no-repeat;
        background-position: center;
        background-size: 70% auto;
        filter: grayscale(1);
        opacity: 0.12;
        z-index: 0;
        pointer-events: none;
      }
      .invoice-content {
        position: relative;
        z-index: 1;
      }
      .header {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
        margin-bottom: 30px;
      }
      .logo-wrap {
        width: 300px;
        height: 150px;
        display: flex;
        align-items: flex-start;
      }
      .logo-wrap img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .company {
        text-align: right;
      }
      .company-title {
        margin: 0 0 5px;
        font-size: 18px;
        color: hsl(183, 75%, 47%);
        font-weight: 700;
      }
      .company-line {
        margin: 0 0 3px;
      }
      .billing {
        display: grid;
        grid-template-columns: 1fr 1fr;
        margin-bottom: 12px;
      }
      .section-title {
        font-weight: 700;
        margin: 0 0 5px;
        
      }
      .billing-line {
        margin: 0 0 3px;
        
      }
      .invoice-meta {
        text-align: right;
      }
      .invoice-meta-row {
        margin: 0 0 3px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      th, td {
        border: 1px solid #aaa;
        padding: 8px 6px;
        vertical-align: top;
        font-size: 12px;
      }
      th {
        text-align: center;
        background: #e5e5e5;
        font-weight: 700;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .totals {
        margin-left: auto;
        width: 260px;
        margin-bottom: 30px;
      }
      .totals-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        margin-bottom: 8px;
        
      }
      .totals-row strong {
        font-weight: 700;
      }
      .remarks-title {
        margin: 0 0 5px;
        
        font-weight: 700;
      }
      .remarks-text {
        margin: 0 0 20px;
        color: #666;
        font-size: 10px;
      }
      .paca {
        margin: 0;
        color: #666;
        font-size: 9px;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <div class="invoice-content">
    <div class="header">
      <div class="logo-wrap">
        <img src="${payload.company.logoDataUrl}" alt="Company logo" />
      </div>
      <div class="company">
        <p class="company-title">${escapeHtml(payload.company.name)}</p>
        <p class="company-line">${escapeHtml(payload.company.address)}</p>
        <p class="company-line">Email: ${escapeHtml(payload.company.email)}</p>
        <p class="company-line">Phone: ${escapeHtml(payload.company.phone)}</p>
      </div>
    </div>

    <div class="billing">
      <div>
        <p class="section-title">BILLED TO:</p>
        <p class="billing-line">${escapeHtml(payload.client.name)}</p>
        <p class="billing-line">${escapeHtml(payload.client.address)}</p>
        <p class="billing-line">Phone: ${escapeHtml(payload.client.phone)}</p>
        <p class="billing-line">Contact Person: ${escapeHtml(payload.client.contact)}</p>
        <p class="billing-line">Email: ${escapeHtml(payload.client.email)}</p>
      </div>
      <div class="invoice-meta">
        <p class="invoice-meta-row"><strong>INVOICE No: ${escapeHtml(payload.invoice.number)}</strong></p>
        <p class="invoice-meta-row">Issue date: ${escapeHtml(payload.invoice.issueDate)}</p>
        <p class="invoice-meta-row">Due date: ${escapeHtml(payload.invoice.dueDate)}</p>
        ${purchaseOrderBlock}
        ${messageBlock}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 100px;">ITEM</th>
          <th>DESCRIPTION</th>
          <th style="width: 100px;">BOXES</th>
          <th style="width: 100px;">PRICE PER UNIT</th>
          <th style="width: 100px;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row"><span>Sub total:</span><span>${formatCurrency(payload.totals.subtotal)}</span></div>
      <div class="totals-row"><span>Discount:</span><span>${formatCurrency(payload.totals.discount)}</span></div>
      <div class="totals-row"><strong>Invoice total:</strong><strong>${formatCurrency(payload.totals.total)}</strong></div>
    </div>

    <p class="remarks-title">REMARKS:</p>
    <p class="remarks-text">${escapeHtml(payload.wireTransferInstructions)}</p>

    <p class="paca">${escapeHtml(payload.pacaTerms)}</p>
    </div>
  </body>
</html>`;
}
