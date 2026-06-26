"use client";

import { useInvoice } from "../hooks/useInvoices";
import { useDocumentsForDocument } from "@/features/documents/hooks/useDocuments";
import { invoiceUtils } from "../services/invoices.api";
import { InvoicesDocumentList } from "./InvoicesDocumentList";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import {
  FileText,
  Building2,
  User,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Mail,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatearFecha,
  formatearMoneda,
  getDaysFromDueDate,
} from "@/lib/utils";
import { EstadoInvoice } from "../schemas/invoices-response.schema";
import {
  usePaymentManager,
  useDebitNoteManager,
  useCreditNoteManager,
  useCreditNoteWithReturnManager,
  PaymentFormModal,
  DebitNoteFormModal,
  CreditNoteFormModal,
  CreditNoteWithReturnDialog,
} from "../mov-cxc";
import { TipoPropositoMovkar } from "@/features/movement-types";

interface InvoicesDetailsProps {
  invoiceSequence: string;
}

export function InvoicesDetails({ invoiceSequence }: InvoicesDetailsProps) {
  const {
    data: invoice,
    isLoading,
    error,
  } = useInvoice(parseInt(invoiceSequence));

  // Hook for page actions
  const router = useRouter();
  const isActive = invoice?.FGEstado === EstadoInvoice.ACTIVE;
  const isPaid = invoice?.FGEstado === EstadoInvoice.PAID;

  // Payment and Debit Note managers
  const paymentManager = usePaymentManager();
  const debitNoteManager = useDebitNoteManager();
  const creditNoteManager = useCreditNoteManager();
  const creditNoteWithReturnManager = useCreditNoteWithReturnManager();

  const { data: documentsData } = useDocumentsForDocument(
    "invoice",
    invoice?.FGOrgSecuencia ?? 0,
    !!invoice,
  );

  // Prepare information sections
  const dueDaysInfo = invoice
    ? getDaysFromDueDate(invoice.FGFechaVencimiento)
    : { days: null, isOverdue30: false };
  const isOverdue = invoice?.FGEstado === EstadoInvoice.OVERDUE;
  const showRedAmounts =
    !!invoice && (isActive || isOverdue) && dueDaysInfo.isOverdue30;

  const sections: EntitySection[] = invoice
    ? [
        {
          title: "Invoice Information",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Invoice Number",
              value: `#${invoice.FGNro}`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Purchase Order",
              value: invoice.FGPurchaseOrder || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Status",
              value: invoice.FGEstado,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Created Date",
              value: formatearFecha(invoice.FGFechaCreado, {
                conTiempo: true,
              }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Due Date",
              value: (
                <>
                  {formatearFecha(invoice.FGFechaVencimiento, {
                    conTiempo: true,
                  })}
                  {isPaid ? (
                    " Paid"
                  ) : dueDaysInfo.days === null ? (
                    " —"
                  ) : dueDaysInfo.days < 0 ? (
                    <span className="text-blue-600">
                      {" "}
                      (- {Math.abs(dueDaysInfo.days)})
                    </span>
                  ) : (
                    <span className="text-red-600"> ({dueDaysInfo.days})</span>
                  )}
                </>
              ),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            ...(invoice.FGFechaPago
              ? [
                  {
                    label: "Dispatch Date",
                    value: formatearFecha(invoice.FGFechaPago, {
                      conTiempo: true,
                    }),
                    icon: (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ]
              : []),
            {
              label: "Payment Type",
              value: invoiceUtils.obtenerTipoPagoLabel(invoice.FGPago),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Client Information",
          icon: <Building2 className="h-5 w-5" />,
          fields: [
            {
              label: "Business Name",
              value: invoice.cltemae?.CRazonSocial || "N/A",
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Contact Name",
              value: invoice.cltemae?.CNombreCliente || "N/A",
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: invoice.cltemae?.CNitCedula || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(invoice.vendedor
          ? [
              {
                title: "Vendor Information",
                icon: <User className="h-5 w-5" />,
                fields: [
                  {
                    label: "Vendor Name",
                    value: `${invoice.vendedor.VNombre}`,
                    icon: <User className="h-4 w-4 text-muted-foreground" />,
                  },
                ],
              },
            ]
          : []),
        {
          title: "Delivery Information",
          icon: <MapPin className="h-5 w-5" />,
          fields: [
            {
              label: "Delivery Address",
              value: invoice.FGDireccionEntrega || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Delivery City",
              value: invoice.ciudad?.nombre || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 1",
              value: invoice.FGTelefono1 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 2",
              value: invoice.FGTelefono2 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 1",
              value: invoice.FGCorreo1 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 2",
              value: invoice.FGCorreo2 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(invoice.FGPago === "CREDITO" &&
        (invoice.FGCondicion1 || invoice.FGCondicion2 || invoice.FGCondicion3)
          ? [
              {
                title: "Payment Conditions",
                icon: <FileText className="h-5 w-5" />,
                fields: [
                  ...(invoice.FGCondicion1
                    ? [
                        {
                          label: "Condition 1",
                          value: invoice.FGCondicion1,
                          icon: (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ),
                        },
                      ]
                    : []),
                  ...(invoice.FGCondicion2
                    ? [
                        {
                          label: "Condition 2",
                          value: invoice.FGCondicion2,
                          icon: (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ),
                        },
                      ]
                    : []),
                  ...(invoice.FGCondicion3
                    ? [
                        {
                          label: "Condition 3",
                          value: invoice.FGCondicion3,
                          icon: (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ),
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
        {
          title: "Invoice Items",
          icon: <FileText className="h-5 w-5" />,
          fields: [],
          customContent: (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Quantity</TableHead>

                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>IVA</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.facturau
                    ?.filter((item) => Number(item.FUCantidad) > 0)
                    .map((item, index) => {
                      const subtotal =
                        Number(item.FUCantidad) *
                        Number(item.FUVrUnitario || 0);
                      const descuento =
                        subtotal * (Number(item.FUDescuento) / 100);
                      const subtotalConDescuento = subtotal - descuento;
                      const iva = Number(item.FUDetalle);
                      const total = subtotalConDescuento + iva;

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {item.invcaruni?.CKDescripcion || "N/A"}
                            {item.invcaruni?.origenPais?.nombre && (
                              <div className="text-xs text-muted-foreground">
                                Origin: {item.invcaruni.origenPais.nombre}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{item.FULote}</TableCell>
                          <TableCell>{item.FUCantidad}</TableCell>

                          <TableCell>
                            {formatearMoneda(Number(item.FUVrUnitario || 0))}
                          </TableCell>
                          <TableCell>{item.FUDescuento}%</TableCell>
                          <TableCell>
                            {item.FUTieneImpuesto
                              ? formatearMoneda(iva)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatearMoneda(total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatearMoneda(invoice.FGValorTotalBruto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Discounts:
                    </span>
                    <span className="font-medium">
                      - {formatearMoneda(invoice.FGTotalDescuento)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA:</span>
                    <span className="font-medium">
                      {formatearMoneda(invoice.FGTotalIVA)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total:</span>
                    <span
                      className={
                        showRedAmounts
                          ? "font-bold text-lg text-red-600"
                          : "font-bold text-lg"
                      }
                    >
                      {formatearMoneda(invoice.FGValorTotalNeto)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        ...(invoice.facturau &&
        invoice.facturau.some((item) => Number(item.FUCantidad) < 0)
          ? [
              {
                title: "Returned Items",
                icon: <RotateCcw className="h-5 w-5" />,
                fields: [],
                customContent: (
                  <div className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document #</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Lot #</TableHead>
                          <TableHead>Lot Document #</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.facturau
                          ?.filter((item) => Number(item.FUCantidad) < 0)
                          .map((item, index) => {
                            const cantidad = Math.abs(Number(item.FUCantidad));

                            const movCXC = invoice.movCXC?.find(
                              (mov) => mov.MCId === item.FUMovCXCId,
                            );

                            return (
                              <TableRow key={index}>
                                <TableCell>{movCXC?.MCNroDocumento}</TableCell>
                                <TableCell>
                                  {item.invcaruni?.CKDescripcion || "N/A"}
                                  {item.invcaruni?.origenPais?.nombre && (
                                    <div className="text-xs text-muted-foreground">
                                      Origin: {item.invcaruni.origenPais.nombre}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>{item.FULote}</TableCell>
                                <TableCell>{item.FULoteNroDocumento}</TableCell>
                                <TableCell className="text-red-600">
                                  -{cantidad}
                                </TableCell>
                                <TableCell>
                                  {formatearMoneda(
                                    Number(item.FUVrUnitario || 0),
                                  )}
                                </TableCell>

                                <TableCell className="font-medium text-red-600">
                                  {formatearMoneda(item.FUVrNeto)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                ),
              },
            ]
          : []),
        ...(invoice.movCXC && invoice.movCXC.length > 0
          ? [
              {
                title: "Payments, Debit Notes, and Credit Notes",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [],
                customContent: (() => {
                  const payments = invoice.movCXC.filter(
                    (mov) =>
                      mov.tipoMovimiento?.TProposito ===
                      TipoPropositoMovkar.ABONO,
                  );
                  const debitNotes = invoice.movCXC.filter(
                    (mov) =>
                      mov.tipoMovimiento?.TProposito ===
                      TipoPropositoMovkar.NOTA_DEBITO,
                  );
                  const creditNotes = invoice.movCXC.filter(
                    (mov) =>
                      mov.tipoMovimiento?.TProposito ===
                        TipoPropositoMovkar.NOTA_CREDITO ||
                      mov.tipoMovimiento?.TProposito ===
                        TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION,
                  );

                  const totalPayments = payments.reduce(
                    (sum, p) => sum + Number(p.MCValor),
                    0,
                  );
                  const totalDebitNotes = debitNotes.reduce(
                    (sum, d) => sum + Number(d.MCValor),
                    0,
                  );
                  const totalCreditNotes = creditNotes.reduce(
                    (sum, c) => sum + Number(c.MCValor),
                    0,
                  );

                  return (
                    <div className="mt-4 space-y-6">
                      {/* Payments Table */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Payments</h4>
                        {payments.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Payment Type</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payments.map((payment) => (
                                <TableRow key={payment.MCId}>
                                  <TableCell>
                                    {payment.MCFecha
                                      ? formatearFecha(payment.MCFecha, {
                                          conTiempo: true,
                                        })
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {payment.MCNroDocumento}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div>{payment.MCDescripcion}</div>
                                      {/* Payment Details */}
                                      {payment.walletPayment && (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            Bank:{" "}
                                            {payment.walletPayment.bank
                                              ?.BNombre ?? "—"}
                                          </div>
                                          <div>
                                            Wallet:{" "}
                                            {
                                              payment.walletPayment
                                                .WPNombreWallet
                                            }
                                          </div>
                                          <div>
                                            Phone/Key:{" "}
                                            {
                                              payment.walletPayment
                                                .WPTelefonoOClave
                                            }
                                          </div>
                                        </div>
                                      )}
                                      {payment.creditCardPayment && (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            Bank:{" "}
                                            {payment.creditCardPayment.bank
                                              ?.BNombre ?? "—"}
                                          </div>
                                          <div>
                                            Brand:{" "}
                                            {payment.creditCardPayment.CCPMarca}
                                          </div>
                                          <div>
                                            Card ending in: ••••{" "}
                                            {
                                              payment.creditCardPayment
                                                .CCPUltimos4Digitos
                                            }
                                          </div>
                                        </div>
                                      )}
                                      {payment.transferPayment && (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            Bank:{" "}
                                            {payment.transferPayment.bank
                                              ?.BNombre ?? "—"}
                                          </div>

                                          <div>
                                            Account:{" "}
                                            {
                                              payment.transferPayment
                                                .TPTipoCuenta
                                            }{" "}
                                            ••••
                                            {payment.transferPayment.TPNumeroCuenta.slice(
                                              -4,
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {payment.checkPayment && (
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            Bank:{" "}
                                            {payment.checkPayment.bank
                                              ?.BNombre ?? "—"}
                                          </div>
                                          <div>
                                            Check #:{" "}
                                            {
                                              payment.checkPayment
                                                .CHPNumeroCheque
                                            }
                                          </div>
                                          <div>
                                            Date:{" "}
                                            {payment.checkPayment.CHPFechaCheque
                                              ? formatearFecha(
                                                  payment.checkPayment
                                                    .CHPFechaCheque,
                                                  { conTiempo: true },
                                                )
                                              : "N/A"}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {invoiceUtils.obtenerTipoPagoLabel(
                                      payment.MCTipoPago,
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatearMoneda(Number(payment.MCValor))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No payments recorded
                          </p>
                        )}
                      </div>

                      {/* Debit Notes Table */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Debit Notes
                        </h4>
                        {debitNotes.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Payment Type</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {debitNotes.map((debitNote) => (
                                <TableRow key={debitNote.MCId}>
                                  <TableCell>
                                    {debitNote.MCFecha
                                      ? formatearFecha(debitNote.MCFecha, {
                                          conTiempo: true,
                                        })
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {debitNote.MCNroDocumento}
                                  </TableCell>
                                  <TableCell>
                                    {debitNote.MCDescripcion}
                                  </TableCell>
                                  <TableCell>
                                    {invoiceUtils.obtenerTipoPagoLabel(
                                      debitNote.MCTipoPago,
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {formatearMoneda(Number(debitNote.MCValor))}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No debit notes recorded
                          </p>
                        )}
                      </div>

                      {/* Credit Notes Table */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Credit Notes
                        </h4>
                        {creditNotes.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Document #</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {creditNotes.map((creditNote) => (
                                <TableRow key={creditNote.MCId}>
                                  <TableCell>
                                    {creditNote.MCFecha
                                      ? formatearFecha(creditNote.MCFecha, {
                                          conTiempo: true,
                                        })
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {creditNote.MCNroDocumento}
                                  </TableCell>
                                  <TableCell>
                                    {creditNote.MCDescripcion}
                                  </TableCell>
                                  <TableCell>
                                    {creditNote.tipoMovimiento?.TProposito ===
                                    TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION
                                      ? "With Return"
                                      : "Simple"}
                                  </TableCell>
                                  <TableCell className="font-medium text-red-600">
                                    -
                                    {formatearMoneda(
                                      Number(creditNote.MCValor),
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No credit notes recorded
                          </p>
                        )}
                      </div>

                      {/* Summary Section */}
                      <div className="mt-4 flex justify-end">
                        <div className="w-64 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Invoice Total:
                            </span>
                            <span
                              className={
                                showRedAmounts
                                  ? "font-medium text-red-600"
                                  : "font-medium"
                              }
                            >
                              {formatearMoneda(invoice.FGValorTotalNeto)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Payments:
                            </span>
                            <span className="font-medium text-red-600">
                              - {formatearMoneda(totalPayments)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Debit Notes:
                            </span>
                            <span className="font-medium text-green-600">
                              + {formatearMoneda(totalDebitNotes)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total Credit Notes:
                            </span>
                            <span className="font-medium text-red-600">
                              - {formatearMoneda(totalCreditNotes)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-semibold">
                              Current Balance:
                            </span>
                            <span
                              className={
                                showRedAmounts
                                  ? "font-bold text-lg text-red-600"
                                  : "font-bold text-lg"
                              }
                            >
                              {formatearMoneda(invoice.FGSaldo)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })(),
              },
            ]
          : []),
        ...(invoice
          ? [
              {
                title: "Invoice Documents",
                icon: <FileText className="h-5 w-5" />,
                fields: [],
                customContent: (
                  <div className="mt-4">
                    <InvoicesDocumentList
                      documents={documentsData?.documents ?? []}
                    />
                  </div>
                ),
              },
            ]
          : []),
      ]
    : [];

  // Prepare quick actions
  const baseActions: EntityAction[] = invoice ? [] : [];

  const transactionActions: EntityAction[] =
    invoice && !isPaid
      ? [
          {
            label: "Add Payment",
            icon: <DollarSign className="h-6 w-6" />,
            onClick: () => {
              paymentManager.open(
                invoice.FGId,
                new Date(invoice.FGFechaCreado),
                invoice.FGPago,
              );
            },
            variant: "outline" as const,
          },
          {
            label: "Debit Note",
            icon: <FileText className="h-6 w-6" />,
            onClick: () => {
              debitNoteManager.open(
                invoice.FGId,
                new Date(invoice.FGFechaCreado),
              );
            },
            variant: "outline" as const,
          },
          {
            label: "Credit Note",
            icon: <FileText className="h-6 w-6" />,
            onClick: () => {
              creditNoteManager.open(
                invoice.FGId,
                new Date(invoice.FGFechaCreado),
              );
            },
            variant: "outline" as const,
          },
          // TODO: make it work
          // ...(invoice.FGFacturaDeSaldo
          //   ? []
          //   : [
          //       {
          //         label: "Return Inventory",
          //         icon: <RotateCcw className="h-6 w-6" />,
          //         onClick: () => {
          //           creditNoteWithReturnManager.open(
          //             invoice.FGId,
          //             new Date(invoice.FGFechaCreado),
          //           );
          //         },
          //         variant: "outline" as const,
          //       },
          //     ]),
        ]
      : [];

  const quickActions: EntityAction[] = [...baseActions, ...transactionActions];

  return (
    <>
      <EntityDetails
        title={invoice ? `Invoice #${invoice.FGNro}` : "Invoice Details"}
        subtitle={
          invoice?.cltemae ? `Client: ${invoice.cltemae.CRazonSocial}` : ""
        }
        sections={sections}
        isLoading={isLoading}
        error={error}
        quickActions={quickActions}
        notFoundMessage="The invoice you are looking for does not exist or has been deleted."
        notFoundIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        onBack={() => router.push("/invoices")}
      />

      {/* Emit Confirmation Modal */}
      {/* <DispatchOrderEmitModal
        isOpen={dispatchOrderModal.isEmitModalOpen}
        onClose={dispatchOrderModal.closeEmitModal}
        onConfirm={dispatchOrderModal.handleEmitWithConfirmation}
        dispatchOrder={dispatchOrderModal.dispatchOrderAEmitir}
        isEmitting={dispatchOrderModal.isEmitting}
      /> */}

      {/* Return Inventory Dialog */}
      {/* {invoice && (
        <InvoicesReturnDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          invoice={invoice}
        />
      )} */}

      {/* Payment Modal */}
      <PaymentFormModal
        isOpen={paymentManager.isOpen}
        onClose={paymentManager.close}
        form={paymentManager.form}
        onSubmit={paymentManager.onSubmit}
        isLoading={paymentManager.isMutating}
        invoiceCreatedAt={paymentManager.invoiceCreatedAt}
      />

      {/* Debit Note Modal */}
      <DebitNoteFormModal
        isOpen={debitNoteManager.isOpen}
        onClose={debitNoteManager.close}
        form={debitNoteManager.form}
        onSubmit={debitNoteManager.onSubmit}
        isLoading={debitNoteManager.isMutating}
        invoiceCreatedAt={debitNoteManager.invoiceCreatedAt}
      />

      {/* Credit Note Modal */}
      <CreditNoteFormModal
        isOpen={creditNoteManager.isOpen}
        onClose={creditNoteManager.close}
        form={creditNoteManager.form}
        onSubmit={creditNoteManager.onSubmit}
        isLoading={creditNoteManager.isMutating}
        invoiceCreatedAt={creditNoteManager.invoiceCreatedAt}
      />

      {/* Credit Note with Return Dialog */}
      <CreditNoteWithReturnDialog
        open={creditNoteWithReturnManager.isOpen}
        onOpenChange={creditNoteWithReturnManager.close}
        invoiceId={creditNoteWithReturnManager.invoiceId || 0}
        form={creditNoteWithReturnManager.form}
        onSubmit={creditNoteWithReturnManager.onSubmit}
        isLoading={creditNoteWithReturnManager.isMutating}
        invoiceCreatedAt={creditNoteWithReturnManager.invoiceCreatedAt}
      />
    </>
  );
}
