"use client";

import { useCreditNote } from "../hooks/useCreditNotes";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import {
  FileText,
  Calendar,
  DollarSign,
  Building2,
  User,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { invoiceUtils } from "@/features/invoices";
import { InvoiceStatusBadge } from "@/features/invoices/components/InvoiceStatusBadge";

interface CreditNoteDetailProps {
  creditNoteSequence: string;
}

export function CreditNoteDetail({
  creditNoteSequence,
}: CreditNoteDetailProps) {
  const {
    data: creditNote,
    isLoading,
    error,
  } = useCreditNote(parseInt(creditNoteSequence));

  const router = useRouter();

  const handleViewInvoice = () => {
    if (creditNote?.facturag.FGOrgSecuencia) {
      router.push(`/invoices/${creditNote.facturag.FGOrgSecuencia}`);
    }
  };

  const handleViewClient = () => {
    if (creditNote?.facturag.cltemae.COrgSecuencia) {
      router.push(`/clients/${creditNote.facturag.cltemae.COrgSecuencia}`);
    }
  };

  // Prepare information sections
  const sections: EntitySection[] = creditNote
    ? [
        {
          title: "General Information",
          icon: <Receipt className="h-5 w-5" />,
          fields: [
            {
              label: "Credit Note Number",
              value: creditNote.MCNroDocumento,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Description",
              value: creditNote.MCDescripcion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Amount",
              value: formatearMoneda(Number(creditNote.MCValor)),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Issue Date",
              value: creditNote.MCFecha
                ? formatearFecha(creditNote.MCFecha, { conTiempo: false })
                : "—",
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Payment Type",
              value: invoiceUtils.obtenerTipoPagoLabel(creditNote.MCTipoPago),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Movement Type",
              value: creditNote.tipoMovimiento?.TDescripcion ?? "—",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Related Invoice",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Invoice Number",
              value: `#${creditNote.facturag.FGNro}`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Invoice Status",
              value: (
                <InvoiceStatusBadge status={creditNote.facturag.FGEstado} />
              ),
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Client Information",
          icon: <Building2 className="h-5 w-5" />,
          fields: [
            {
              label: "Business Name",
              value: creditNote.facturag.cltemae.CRazonSocial,
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: creditNote.facturag.cltemae.CNitCedula,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            ...(creditNote.facturag.vendedor
              ? [
                  {
                    label: "Vendor",
                    value: creditNote.facturag.vendedor.VNombre,
                    icon: <User className="h-4 w-4 text-muted-foreground" />,
                  },
                ]
              : []),
          ],
        },
        ...(creditNote.facturaReturnItems &&
        creditNote.facturaReturnItems.length > 0
          ? [
              {
                title: "Returned Items",
                icon: <FileText className="h-5 w-5" />,
                fields: [],
                customContent: (
                  <div className="space-y-2">
                    {creditNote.facturaReturnItems.map((item) => (
                      <div
                        key={item.FUId}
                        className="border rounded-lg p-4 space-y-1"
                      >
                        <div className="font-medium">
                          {item.invcaruni?.CKDescripcion ?? "—"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {Math.abs(item.FUCantidad)} | Unit Price:{" "}
                          {formatearMoneda(Number(item.FUVrUnitario))} | Total:{" "}
                          {formatearMoneda(Number(item.FUVrNeto))}
                        </div>
                        {item.FUDetalle && (
                          <div className="text-sm text-muted-foreground">
                            {item.FUDetalle}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ),
              },
            ]
          : []),
        ...(creditNote.walletPayment
          ? [
              {
                title: "Payment Details - Wallet",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: creditNote.walletPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Wallet Name",
                    value: creditNote.walletPayment.WPNombreWallet,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Phone/Key",
                    value: creditNote.walletPayment.WPTelefonoOClave,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(creditNote.creditCardPayment
          ? [
              {
                title: "Payment Details - Credit Card",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: creditNote.creditCardPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Card (last 4)",
                    value: creditNote.creditCardPayment.CCPUltimos4Digitos
                      ? `•••• ${creditNote.creditCardPayment.CCPUltimos4Digitos}`
                      : "—",
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Brand",
                    value: creditNote.creditCardPayment.CCPMarca ?? "—",
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(creditNote.transferPayment
          ? [
              {
                title: "Payment Details - Transfer",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: creditNote.transferPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Account Number",
                    value: creditNote.transferPayment.TPNumeroCuenta,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Account Type",
                    value: creditNote.transferPayment.TPTipoCuenta,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(creditNote.checkPayment
          ? [
              {
                title: "Payment Details - Check",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: creditNote.checkPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Check Number",
                    value: creditNote.checkPayment.CHPNumeroCheque,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Check Date",
                    value: creditNote.checkPayment.CHPFechaCheque
                      ? formatearFecha(creditNote.checkPayment.CHPFechaCheque, {
                          conTiempo: false,
                        })
                      : "—",
                    icon: (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
      ]
    : [];

  // Prepare quick actions
  const quickActions: EntityAction[] = [
    {
      label: "View Invoice",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewInvoice,
    },
    {
      label: "View Client",
      icon: <Building2 className="h-6 w-6" />,
      onClick: handleViewClient,
    },
  ];

  return (
    <EntityDetails
      title={creditNote?.MCNroDocumento || ""}
      subtitle={
        creditNote
          ? `Credit Note for Invoice #${creditNote.facturag.FGNro}`
          : ""
      }
      sections={sections}
      isLoading={isLoading}
      error={error}
      showEditButton={false}
      showDeleteButton={false}
      notFoundMessage="The credit note you are looking for does not exist or has been deleted."
      notFoundIcon={<Receipt className="h-12 w-12 text-muted-foreground" />}
      quickActions={quickActions}
      onBack={() => router.push("/credit-notes")}
    />
  );
}
