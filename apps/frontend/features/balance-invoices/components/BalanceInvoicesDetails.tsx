"use client";

import { useBalanceInvoice } from "../hooks/useBalanceInvoices";
import { useBalanceInvoiceDelete } from "../hooks/useBalanceInvoiceDelete";
import { facturaUtils } from "../service/BalanceInvoicesService";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  EntityDetails,
  EntitySection,
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
import { formatearFecha, formatearMoneda } from "@/lib/utils";

interface BalanceInvoicesDetailsProps {
  facturaSequence: string;
}

export function BalanceInvoicesDetails({
  facturaSequence,
}: BalanceInvoicesDetailsProps) {
  const {
    data: factura,
    isLoading,
    error,
  } = useBalanceInvoice(parseInt(facturaSequence));

  const deleteModal = useBalanceInvoiceDelete({
    onAfterDelete: () => router.push("/balance-invoices"),
  });
  const router = useRouter();

  // Prepare information sections
  const sections: EntitySection[] = factura
    ? [
        {
          title: "Balance Invoice Information",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Balance Invoice Number",
              value: `#${factura.FGNro}`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Purchase Order",
              value: factura.FGPurchaseOrder || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Status",
              value: factura.FGEstado,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Created Date",
              value: formatearFecha(factura.FGFechaCreado, { conTiempo: true }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            ...(factura.FGFechaPago
              ? [
                  {
                    label: "Payment Date",
                    value: formatearFecha(factura.FGFechaPago, {
                      conTiempo: true,
                    }),
                    icon: (
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                ]
              : []),
            {
              label: "Due Date",
              value: formatearFecha(factura.FGFechaVencimiento, {
                conTiempo: true,
              }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Payment Type",
              value: facturaUtils.obtenerTipoPagoLabel(factura.FGPago),
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
              value: factura.cltemae?.CRazonSocial || "N/A",
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Contact Name",
              value: factura.cltemae?.CNombreCliente || "N/A",
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: factura.cltemae?.CNitCedula || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(factura.vendedor
          ? [
              {
                title: "Vendor Information",
                icon: <User className="h-5 w-5" />,
                fields: [
                  {
                    label: "Vendor Name",
                    value: `${factura.vendedor.VNombre}`,
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
              value: factura.FGDireccionEntrega || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Delivery City",
              value: factura.ciudad?.nombre || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 1",
              value: factura.FGTelefono1 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 2",
              value: factura.FGTelefono2 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 1",
              value: factura.FGCorreo1 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 2",
              value: factura.FGCorreo2 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(factura.FGPago === "CREDITO" &&
        (factura.FGCondicion1 || factura.FGCondicion2 || factura.FGCondicion3)
          ? [
              {
                title: "Payment Conditions",
                icon: <FileText className="h-5 w-5" />,
                fields: [
                  ...(factura.FGCondicion1
                    ? [
                        {
                          label: "Condition 1",
                          value: factura.FGCondicion1,
                          icon: (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ),
                        },
                      ]
                    : []),
                  ...(factura.FGCondicion2
                    ? [
                        {
                          label: "Condition 2",
                          value: factura.FGCondicion2,
                          icon: (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          ),
                        },
                      ]
                    : []),
                  ...(factura.FGCondicion3
                    ? [
                        {
                          label: "Condition 3",
                          value: factura.FGCondicion3,
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
          title: "Balance ",
          icon: <FileText className="h-5 w-5" />,
          fields: [],
          customContent: (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Balance Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factura.facturau?.map((item, index) => {
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
                        <TableCell>{item.FUCantidad}</TableCell>

                        <TableCell>
                          {formatearMoneda(Number(item.FUVrUnitario || 0))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">
                      {formatearMoneda(factura.FGValorTotalBruto || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Balance:</span>
                    <span className="font-bold text-lg">
                      {formatearMoneda(factura.FGSaldo || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ]
    : [];

  return (
    <>
      <EntityDetails
        title={
          factura
            ? `Balance Invoice #${factura.FGNro}`
            : "Balance Invoice Details"
        }
        subtitle={
          factura?.cltemae ? `Client: ${factura.cltemae.CRazonSocial}` : ""
        }
        sections={sections}
        isLoading={isLoading}
        error={error}
        notFoundMessage="The invoice you are looking for does not exist or has been deleted."
        notFoundIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        onBack={() => router.push("/balance-invoices")}
      />

      {/* Delete Confirmation Modal */}
      {factura?.FGFacturaDeSaldo && (
        <EntityDeleteModal
          isOpen={deleteModal.isDeleteModalOpen}
          onClose={deleteModal.closeDeleteModal}
          onConfirm={deleteModal.handleDeleteConfirm}
          entity="invoice"
          entityName={
            deleteModal.facturaAEliminar
              ? `Invoice #${deleteModal.facturaAEliminar.number}`
              : ""
          }
          isDeleting={deleteModal.isDeleting}
        />
      )}
    </>
  );
}
