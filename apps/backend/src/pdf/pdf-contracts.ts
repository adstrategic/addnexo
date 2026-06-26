export interface InvoicePdfPayload {
  client: {
    address: string;
    contact: string;
    email: string;
    name: string;
    phone: string;
  };
  company: {
    address: string;
    email: string;
    logoDataUrl: string;
    name: string;
    phone: string;
  };
  invoice: {
    dueDate: string;
    issueDate: string;
    message?: string;
    number: string;
    purchaseOrder?: string;
  };
  items: Array<{
    amount: number;
    description: string;
    index: number;
    quantity: number;
    unitPrice: number;
  }>;
  pacaTerms: string;
  totals: {
    discount: number;
    subtotal: number;
    total: number;
  };
  wireTransferInstructions: string;
}

export interface DispatchOrderPdfPayload {
  cityInfo: string;
  company: {
    logoDataUrl: string;
  };
  dispatchOrderNumber: string;
  issueDate: string;
  items: Array<{
    lot: string;
    product: string;
    quantity: number;
    totalWeightKg: number;
  }>;
  pacaTerms: string;
  pickUpAddress: string;
  purchaseOrderRef?: string;
  totalQuantity: number;
  totalWeightKg: number;
  vendorName: string;
}

export interface StatementPdfPayload {
  clientName: string;
  company: {
    address: string;
    dumsNo: string;
    email: string;
    logoDataUrl: string;
    name: string;
    pacaNo: string;
    phone: string;
  };
  rows: Array<{
    amount: number;
    dueDate: string;
    invoiceNumber: string;
    isPastDue: boolean;
    issueDate: string;
  }>;
  statementDate: string;
  total: number;
}
