"use client";

import { useState } from "react";
import {
  useDispatchOrder,
  useRegenerateEmittedDispatchPdf,
  useDownloadDispatchPdf,
} from "../hooks/useDispatchOrders";
import { useDispatchOrderDelete } from "../hooks/useDispatchOrderDelete";
import { useDispatchOrderDocuments } from "../hooks/useDispatchOrderDocuments";
import { DispatchOrderDocumentList } from "./DispatchOrderDocumentList";
import { DispatchOrderReturnDialog } from "./DispatchOrderReturnDialog";
import { DispatchOrderDialog } from "./DispatchOrderDialog";
import { DispatchOrderToInvoiceModal } from "./DispatchOrderToInvoiceModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import {
  EntityDetails,
  EntitySection,
  EntityField,
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
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  Package,
  Mail,
  RotateCcw,
  Truck,
  XCircle,
  RefreshCw,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { dispatchOrderUtils } from "../lib/utils";
import { useDispatchOrderToInvoice } from "../hooks/useDispatchOrderToInvoice";
import { useDispatchOrderAnnulment } from "../hooks/useDispatchOrderAnnulment";
import { DispatchOrderAnnulModal } from "./DispatchOrderAnnulModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { TipoPropositoMovkar } from "@/features/movement-types";
import { toast } from "sonner";
import { hasClientPermissions } from "@/lib/permissions";
import { INVOICE_CONVERSION_ENABLED } from "../lib/utils";

interface DispatchOrderDetailsProps {
  dispatchOrderSequence: string;
}

export function DispatchOrderDetails({
  dispatchOrderSequence,
}: DispatchOrderDetailsProps) {
  const {
    data: dispatchOrder,
    isLoading,
    error,
  } = useDispatchOrder(parseInt(dispatchOrderSequence));

  const router = useRouter();
  const dispatchOrderDelete = useDispatchOrderDelete({
    onAfterDelete: () => router.push("/dispatch-orders"),
  });
  const canViewPrices =
    hasClientPermissions("admin", "organization", ["read"]) ||
    hasClientPermissions("admin", "organization", ["read"]);
  const isDraft = dispatchOrder?.DOGEstado === "DRAFT";
  const isEmitted = dispatchOrder?.DOGEstado === "EMITTED";
  const isDispatched = dispatchOrder?.DOGEstado === "DISPATCHED";
  const isAnulated = dispatchOrder?.DOGEstado === "ANULATED";
  const needsPdfRefresh =
    Boolean(isEmitted) &&
    Boolean(dispatchOrder?.DOGEmittedPdfNeedsWarehouseRefresh);

  const regenerateEmittedPdf = useRegenerateEmittedDispatchPdf();
  const downloadPdf = useDownloadDispatchPdf();

  // State for return dialog
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  // State for dispatch dialog
  const [isDispatchDialogOpen, setIsDispatchDialogOpen] = useState(false);

  // Hook for invoice conversion
  const invoiceConversion = useDispatchOrderToInvoice();
  // Hook for annulment
  const annulment = useDispatchOrderAnnulment();

  // Fetch documents if dispatched
  const { data: documentsData, isLoading: isLoadingDocuments } =
    useDispatchOrderDocuments(
      parseInt(dispatchOrderSequence),
      isDispatched && !!dispatchOrder,
    );

  // Prepare information sections
  const sections: EntitySection[] = dispatchOrder
    ? [
        {
          title: "Dispatch Order Information",
          icon: <FileText className="h-5 w-5" />,
          fields: [
            {
              label: "Dispatch Order Number",
              value: `#${dispatchOrder.DOGNro}`,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Purchase Order",
              value: dispatchOrder.DOGPurchaseOrder || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Status",
              value: dispatchOrderUtils.obtenerEstadoLabel(
                dispatchOrder.DOGEstado,
              ),
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Created Date",
              value: formatearFecha(dispatchOrder.DOGFechaCreado, {
                conTiempo: true,
              }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Issue Date",
              value: formatearFecha(dispatchOrder.DOGFechaEmision ?? null, {
                conTiempo: true,
              }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
            ...(dispatchOrder.DOGFechaDespacho
              ? [
                  {
                    label: "Dispatch Date",
                    value: formatearFecha(dispatchOrder.DOGFechaDespacho, {
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
              value: formatearFecha(dispatchOrder.DOGFechaVencimiento ?? null, {
                conTiempo: true,
              }),
              icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Client Information",
          icon: <Building2 className="h-5 w-5" />,
          fields: [
            {
              label: "Business Name",
              value: dispatchOrder.cltemae?.CRazonSocial || "N/A",
              icon: <Building2 className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Contact Name",
              value: dispatchOrder.cltemae?.CNombreCliente || "N/A",
              icon: <User className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "NIT/ID",
              value: dispatchOrder.cltemae?.CNitCedula || "N/A",
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        ...(dispatchOrder.vendedor
          ? [
              {
                title: "Vendor Information",
                icon: <User className="h-5 w-5" />,
                fields: [
                  {
                    label: "Vendor Name",
                    value: `${dispatchOrder.vendedor.VNombre}`,
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
              value: dispatchOrder.DOGDireccionEntrega || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Delivery City",
              value: dispatchOrder.ciudad?.nombre || "N/A",
              icon: <MapPin className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 1",
              value: dispatchOrder.DOGTelefono1 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Phone 2",
              value: dispatchOrder.DOGTelefono2 || "N/A",
              icon: <Phone className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 1",
              value: dispatchOrder.DOGCorreo1 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Email 2",
              value: dispatchOrder.DOGCorreo2 || "N/A",
              icon: <Mail className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
        {
          title: "Dispatch Order Items",
          icon: <FileText className="h-5 w-5" />,
          fields: [],
          customContent: (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Lot #</TableHead>
                    <TableHead>Lot Document #</TableHead>
                    <TableHead>Quantity</TableHead>
                    {canViewPrices && (
                      <>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>IVA</TableHead>
                        <TableHead>Total</TableHead>
                      </>
                    )}

                    <TableHead>Avg KG/Unit</TableHead>
                    <TableHead>Total KG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatchOrder.dispatchOrderU?.map((item, index) => {
                    const subtotal =
                      Number(item.DOUCantidad) *
                      Number(item.DOUVrUnitario || 0);
                    const descuento =
                      subtotal * (Number(item.DOUDescuento) / 100);
                    const subtotalConDescuento = subtotal - descuento;
                    const iva = Number(item.DOUDetalle);
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
                        <TableCell>{item.DOULote}</TableCell>
                        <TableCell>{item.DOUNroDocumento || "N/A"}</TableCell>
                        <TableCell>{item.DOUCantidad}</TableCell>
                        {canViewPrices && (
                          <>
                            <TableCell>
                              {formatearMoneda(Number(item.DOUVrUnitario || 0))}
                            </TableCell>
                            <TableCell>{item.DOUDescuento}%</TableCell>
                            <TableCell>
                              {item.DOUTieneImpuesto
                                ? formatearMoneda(iva)
                                : "N/A"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatearMoneda(Number(item.DOUVrNeto ?? 0))}
                            </TableCell>
                            <TableCell>
                              {Number(
                                item.invcaruni?.CKPesoPromedioKg ?? 0,
                              ).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {Number(item.DOUPesoTotalKg ?? 0).toFixed(2)}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {canViewPrices && (
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        {formatearMoneda(
                          Number(dispatchOrder.DOGValorTotalBruto ?? 0),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Discounts:
                      </span>
                      <span className="font-medium">
                        -{" "}
                        {formatearMoneda(
                          Number(dispatchOrder.DOGTotalDescuento ?? 0),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA:</span>
                      <span className="font-medium">
                        {formatearMoneda(
                          Number(dispatchOrder.DOGTotalIVA ?? 0),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">
                        {formatearMoneda(
                          Number(dispatchOrder.DOGValorTotalNeto ?? 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Weight (KG):
                    </span>
                    <span className="font-medium">
                      {Number(dispatchOrder.DOGPesoTotalKg ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        ...(dispatchOrder.dispatchOrderReturns &&
        dispatchOrder.dispatchOrderReturns.length > 0
          ? [
              {
                title: "Inventory Returns",
                icon: <RotateCcw className="h-5 w-5" />,
                fields: [],
                customContent: (() => {
                  const returns = dispatchOrder.dispatchOrderReturns.filter(
                    (item) =>
                      item.tipoMovimiento?.TProposito ===
                      TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION,
                  );

                  const totalReturns = returns.reduce(
                    (sum, r) => sum + Number(r.DOUVrNeto),
                    0,
                  );
                  const totalQuantityReturned = returns.reduce(
                    (sum, r) => sum + Number(r.DOUCantidad),
                    0,
                  );

                  return (
                    <div className="mt-4 space-y-6">
                      {/* Returns Table */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          Returned Items
                        </h4>
                        {returns.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Lot #</TableHead>
                                <TableHead>Lot Document #</TableHead>
                                <TableHead>Quantity</TableHead>
                                {canViewPrices && (
                                  <>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Total Value</TableHead>
                                  </>
                                )}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {returns.map((returnItem) => (
                                <TableRow key={returnItem.DOUId}>
                                  <TableCell>
                                    {returnItem.creadoOModificado
                                      ? formatearFecha(
                                          returnItem.creadoOModificado,
                                        )
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {returnItem.invcaruni?.CKDescripcion ||
                                      "N/A"}
                                    {returnItem.invcaruni?.origenPais
                                      ?.nombre && (
                                      <div className="text-xs text-muted-foreground">
                                        Ref:{" "}
                                        {returnItem.invcaruni.origenPais.nombre}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {returnItem.DOULote || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {returnItem.DOUNroDocumento || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {returnItem.DOUCantidad}
                                  </TableCell>
                                  {canViewPrices && (
                                    <>
                                      <TableCell>
                                        {formatearMoneda(
                                          Number(returnItem.DOUVrUnitario || 0),
                                        )}
                                      </TableCell>
                                      <TableCell className="font-medium text-red-600">
                                        {formatearMoneda(
                                          Number(returnItem.DOUVrNeto),
                                        )}
                                      </TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No returns recorded
                          </p>
                        )}
                      </div>

                      {/* Summary Section */}
                      {canViewPrices && (
                        <div className="mt-4 flex justify-end">
                          <div className="w-64 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Total Items Returned:
                              </span>
                              <span className="font-medium">
                                {totalQuantityReturned}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold">
                                Total Value of Returns:
                              </span>
                              <span className="font-bold text-lg text-red-600">
                                {formatearMoneda(totalReturns)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })(),
              },
            ]
          : []),
        ...(documentsData?.documents
          ? [
              {
                title: "Dispatch Documents",
                icon: <Package className="h-5 w-5" />,
                fields: [],
                customContent: (
                  <div className="mt-4">
                    <DispatchOrderDocumentList
                      documents={documentsData.documents}
                    />
                  </div>
                ),
              },
            ]
          : []),
      ]
    : [];

  // Prepare quick actions
  const quickActions: EntityAction[] = [
    ...(dispatchOrder
      ? [
          {
            label: downloadPdf.isPending ? "Downloading…" : "Download PDF",
            icon: <Download className="h-6 w-6" />,
            onClick: () => {
              downloadPdf.mutate(dispatchOrder.DOGOrgSecuencia);
            },
          },
        ]
      : []),
    ...(isAnulated
      ? [] // No further actions available for anulated orders
      : [
        ...(isDraft
          ? [
              {
                label: "Edit Dispatch Order",
                icon: <Edit className="h-6 w-6" />,
                onClick: () => {
                  router.push(`/dispatch-orders/${dispatchOrderSequence}/edit`);
                },
              },
              {
                label: "Emit Dispatch Order",
                icon: <Send className="h-6 w-6" />,
                onClick: () => {
                  router.push(`/dispatch-orders/${dispatchOrderSequence}/emit`);
                },
              },
              {
                label: "Delete Dispatch Order",
                icon: <Trash2 className="h-6 w-6" />,
                onClick: () => {
                  dispatchOrder &&
                    dispatchOrderDelete.openDeleteModal(
                      dispatchOrder.DOGOrgSecuencia,
                      dispatchOrder.DOGNro,
                    );
                },
              },
            ]
          : []),
        ...(isEmitted && dispatchOrder
          ? [
              {
                label: "Dispatch",
                icon: <Truck className="h-6 w-6" />,
                onClick: () => {
                  if (needsPdfRefresh) {
                    toast.error("PDF refresh required", {
                      description:
                        "Regenerate the dispatch PDF and notify the warehouse before dispatching.",
                    });
                    return;
                  }
                  setIsDispatchDialogOpen(true);
                },
              },
              ...(needsPdfRefresh
                ? [
                    {
                      label: "Regenerate PDF & notify warehouse",
                      icon: <RefreshCw className="h-6 w-6" />,
                      onClick: () => {
                        regenerateEmittedPdf.mutate(
                          dispatchOrder.DOGOrgSecuencia,
                          {
                            onSuccess: () => {
                              toast.success("PDF updated", {
                                description:
                                  "The warehouse has been sent the updated dispatch PDF.",
                              });
                            },
                            onError: (err: unknown) => {
                              toast.error("Regeneration failed", {
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Could not regenerate the dispatch PDF.",
                              });
                            },
                          },
                        );
                      },
                    },
                  ]
                : []),
            ]
          : []),
        ...((isDispatched || isEmitted) && dispatchOrder
          ? [
              ...(INVOICE_CONVERSION_ENABLED && isDispatched
                ? [
                    {
                      label: "Convert to Invoice",
                      icon: <FileText className="h-6 w-6" />,
                      onClick: () => {
                        dispatchOrder &&
                          invoiceConversion.openModal(dispatchOrder);
                      },
                    },
                  ]
                : []),
              {
                label: "Return Inventory",
                icon: <RotateCcw className="h-6 w-6" />,
                onClick: () => {
                  setIsReturnDialogOpen(true);
                },
              },
              {
                label: "Annul",
                icon: <XCircle className="h-6 w-6" />,
                onClick: () => {
                  dispatchOrder && annulment.openModal(dispatchOrder);
                },
                variant: "destructive" as const,
              },
            ]
          : []),
      ]),
  ];

  return (
    <>
      <EntityDetails
        title={
          dispatchOrder
            ? `Dispatch Order #${dispatchOrder.DOGNro}`
            : "Dispatch Order Details"
        }
        subtitle={
          dispatchOrder?.cltemae
            ? `Client: ${dispatchOrder.cltemae.CRazonSocial}`
            : ""
        }
        sections={sections}
        isLoading={isLoading}
        error={error}
        quickActions={quickActions}
        notFoundMessage="The dispatch order you are looking for does not exist or has been deleted."
        notFoundIcon={<FileText className="h-12 w-12 text-muted-foreground" />}
        onBack={() => router.push("/dispatch-orders")}
      />

      <EntityDeleteModal
        isOpen={dispatchOrderDelete.isDeleteModalOpen}
        onClose={dispatchOrderDelete.closeDeleteModal}
        onConfirm={dispatchOrderDelete.handleDeleteConfirm}
        entity="dispatch order"
        entityName={
          dispatchOrderDelete.dispatchOrderAEliminar
            ? `Dispatch Order #${dispatchOrderDelete.dispatchOrderAEliminar.number}`
            : ""
        }
        isDeleting={dispatchOrderDelete.isDeleting}
      />
      {dispatchOrder && (
        <DispatchOrderReturnDialog
          open={isReturnDialogOpen}
          onOpenChange={setIsReturnDialogOpen}
          dispatchOrder={dispatchOrder}
        />
      )}

      {/* Dispatch Dialog */}
      {dispatchOrder && isEmitted && (
        <DispatchOrderDialog
          open={isDispatchDialogOpen}
          onOpenChange={setIsDispatchDialogOpen}
          dispatchOrderSequence={dispatchOrder.DOGOrgSecuencia}
          onSuccess={() => {
            // Optionally refresh or navigate
          }}
        />
      )}

      {/* Convert to Invoice Modal */}
      {INVOICE_CONVERSION_ENABLED &&
        invoiceConversion.selectedDispatchOrder && (
          <DispatchOrderToInvoiceModal
            isOpen={invoiceConversion.isModalOpen}
            onClose={invoiceConversion.closeModal}
            onConfirm={invoiceConversion.handleConfirm}
            dispatchOrder={invoiceConversion.selectedDispatchOrder}
            isCreating={invoiceConversion.isCreating}
          />
        )}

      {/* Annul Modal */}
      {annulment.selectedDispatchOrder && (
        <DispatchOrderAnnulModal
          isOpen={annulment.isModalOpen}
          onClose={annulment.closeModal}
          onConfirm={annulment.handleConfirm}
          dispatchOrder={annulment.selectedDispatchOrder}
          isAnulling={annulment.isAnulling}
        />
      )}
    </>
  );
}
