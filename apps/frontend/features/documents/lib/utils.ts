import type { DocumentType } from "../schemas/documents-response.schema";

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case "dispatch-order":
      return "Dispatch Order";
    case "purchase-order":
      return "Purchase Order";
    case "invoice":
      return "Invoice";
  }
}

export function getDocumentEntityLabel(type: DocumentType): string {
  return type === "purchase-order" ? "Supplier" : "Client";
}
