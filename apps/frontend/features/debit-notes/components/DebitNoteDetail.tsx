"use client";

import { useDebitNote } from "../hooks/useDebitNotes";
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

interface DebitNoteDetailProps {
  debitNoteSequence: string;
}

export function DebitNoteDetail({ debitNoteSequence }: DebitNoteDetailProps) {
  const {
    data: debitNote,
    isLoading,
    error,
  } = useDebitNote(parseInt(debitNoteSequence));

  const router = useRouter();

  const handleViewInvoice = () => {
    if (debitNote?.facturag.FGOrgSecuencia) {
      router.push(`/invoices/${debitNote.facturag.FGOrgSecuencia}`);
    }
  };

  const handleViewClient = () => {
    if (debitNote?.facturag.cltemae.COrgSecuencia) {
      router.push(`/clients/${debitNote.facturag.cltemae.COrgSecuencia}`);
    }
  };

  // Prepare information sections
  const sections: EntitySection[] = debitNote
    ? [
        {
          title: "General Information",
          icon: <Receipt className="h-5 w-5" />,
          fields: [
            {
              label: "Debit Note Number",
              value: debitNote.MCNroDocumento,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Description",
              value: debitNote.MCDescripcion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Amount",
              value: formatearMoneda(Number(debitNote.MCValor)),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Issue Date",
              value: debitNote.MCFecha
                ? formatearFecha(debitNote.MCFecha, { conTiempo: false })
                : "—",
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Payment Type",
              value: invoiceUtils.obtenerTipoPagoLabel(debitNote.MCTipoPago),
              icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Movement Type",
              value: debitNote.tipoMovimiento?.TDescripcion ?? "—",
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
              value: `#${debitNote.facturag.FGNro}`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Invoice Status",
              value: (
                <InvoiceStatusBadge status={debitNote.facturag.FGEstado} />
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
              value: debitNote.facturag.cltemae.CRazonSocial,
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: debitNote.facturag.cltemae.CNitCedula,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            ...(debitNote.facturag.vendedor
              ? [
                  {
                    label: "Vendor",
                    value: debitNote.facturag.vendedor.VNombre,
                    icon: <User className="h-4 w-4 text-muted-foreground" />,
                  },
                ]
              : []),
          ],
        },
        ...(debitNote.walletPayment
          ? [
              {
                title: "Payment Details - Wallet",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: debitNote.walletPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Wallet Name",
                    value: debitNote.walletPayment.WPNombreWallet,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Phone/Key",
                    value: debitNote.walletPayment.WPTelefonoOClave,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(debitNote.creditCardPayment
          ? [
              {
                title: "Payment Details - Credit Card",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: debitNote.creditCardPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Card (last 4)",
                    value: debitNote.creditCardPayment.CCPUltimos4Digitos
                      ? `•••• ${debitNote.creditCardPayment.CCPUltimos4Digitos}`
                      : "—",
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Brand",
                    value: debitNote.creditCardPayment.CCPMarca ?? "—",
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(debitNote.transferPayment
          ? [
              {
                title: "Payment Details - Transfer",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: debitNote.transferPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Account Number",
                    value: debitNote.transferPayment.TPNumeroCuenta,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Account Type",
                    value: debitNote.transferPayment.TPTipoCuenta,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ],
              },
            ]
          : []),
        ...(debitNote.checkPayment
          ? [
              {
                title: "Payment Details - Check",
                icon: <DollarSign className="h-5 w-5" />,
                fields: [
                  {
                    label: "Bank",
                    value: debitNote.checkPayment.bank?.BNombre ?? "—",
                    icon: (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Check Number",
                    value: debitNote.checkPayment.CHPNumeroCheque,
                    icon: (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    label: "Check Date",
                    value: debitNote.checkPayment.CHPFechaCheque
                      ? formatearFecha(debitNote.checkPayment.CHPFechaCheque, {
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
      title={debitNote?.MCNroDocumento || ""}
      subtitle={
        debitNote ? `Debit Note for Invoice #${debitNote.facturag.FGNro}` : ""
      }
      sections={sections}
      isLoading={isLoading}
      error={error}
      showEditButton={false}
      showDeleteButton={false}
      notFoundMessage="The debit note you are looking for does not exist or has been deleted."
      notFoundIcon={<Receipt className="h-12 w-12 text-muted-foreground" />}
      quickActions={quickActions}
      onBack={() => router.push("/debit-notes")}
    />
  );
}
