import type { StatementPdfPayload } from "./schema.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Ensures dd-mm-yyyy (day-month-year) for statement table dates. */
function formatStatementDate(value: string): string {
  const ddMmYyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
  if (ddMmYyyy.test(value)) {
    return value;
  }
  const mmDdYyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const mdy = value.match(mmDdYyyy);
  if (mdy) {
    const [, month, day, year] = mdy;
    return `${day!.padStart(2, "0")}-${month!.padStart(2, "0")}-${year}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})/;
  const isoMatch = value.match(iso);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }
  return value;
}

export function buildStatementHtml(payload: StatementPdfPayload): string {
  const hasAnyPastDue = payload.rows.some((row) => row.isPastDue);
  const totalRowStyle = hasAnyPastDue ? " style='color: red;'" : "";

  const rows = payload.rows
    .map((row) => {
      const color = row.isPastDue ? " style='color: red;'" : "";
      return `
      <tr${color}>
        <td>${escapeHtml(formatStatementDate(row.issueDate))}</td>
        <td>${escapeHtml(formatStatementDate(row.dueDate))}</td>
        <td class="center">${escapeHtml(row.invoiceNumber)}</td>
        <td class="center">${formatCurrency(row.amount)}</td>
      </tr>
      `;
    })
    .join("");

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
        gap: 20px;
        margin-bottom: 30px;
      }
      .logo {
        width: 300px;
        max-height: 150px;
        object-fit: contain;
      }
      .company {
        text-align: right;
      }
      .company-title {
        margin: 0 0 5px;
        font-size: 18px;
        font-weight: 700;
        color: hsl(183, 75%, 47%);
      }
      .company-line {
        margin: 0 0 3px;
        font-size: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #999;
        padding: 10px 8px;
      }
      .statement-row td {
        background: #333;
        color: #fff;
        text-align: center;
        font-weight: 700;
      }
      .header-row th {
        background: #e5e5e5;
        text-align: left;
      }
      .center { text-align: center; }
    </style>
  </head>
  <body>
    <div class="header">
      <img class="logo" src="${payload.company.logoDataUrl}" alt="Company logo" />
      <div class="company">
        <p class="company-title">${escapeHtml(payload.company.name)}</p>
        <p class="company-line">${escapeHtml(payload.company.address)}</p>
        <p class="company-line">Email: ${escapeHtml(payload.company.email)}</p>
        <p class="company-line">Phone: ${escapeHtml(payload.company.phone)}</p>
        <p class="company-line">DUMS No: ${escapeHtml(payload.company.dumsNo)}</p>
        <p class="company-line">PACA No: ${escapeHtml(payload.company.pacaNo)}</p>
      </div>
    </div>

    <table>
      <tbody>
        <tr class="statement-row">
          <td colspan="4">STATEMENT ${escapeHtml(payload.clientName)} ${escapeHtml(formatStatementDate(payload.statementDate))}</td>
        </tr>
        <tr class="header-row">
          <th>ISSUE DATE</th>
          <th>DUE DATE</th>
          <th>INVOICE</th>
          <th class="center">AMOUNT</th>
        </tr>
        ${rows}
        <tr${totalRowStyle}>
          <td class="center" colspan="3"><strong>TOTAL</strong></td>
          <td class="center"><strong>${formatCurrency(payload.total)}</strong></td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}
