"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  Truck,
  RotateCcw,
  FileText,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { dispatchOrdersService } from "../service/dispatch-orders.service";
import { dispatchOrderUtils, INVOICE_CONVERSION_ENABLED } from "../lib/utils";
import { TablePagination } from "@/components/shared/TablePagination";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { DispatchOrderDialog } from "./DispatchOrderDialog";
import { DispatchOrderReturnDialog } from "./DispatchOrderReturnDialog";
import { DispatchOrderToInvoiceModal } from "./DispatchOrderToInvoiceModal";
import { DispatchOrderAnnulModal } from "./DispatchOrderAnnulModal";
import { useState } from "react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { useDispatchOrderToInvoice } from "../hooks/useDispatchOrderToInvoice";
import { useDispatchOrderAnnulment } from "../hooks/useDispatchOrderAnnulment";
import { useRegenerateEmittedDispatchPdf } from "../hooks/useDispatchOrders";
import { hasClientPermissions } from "@/lib/permissions";
import { toast } from "sonner";

interface DispatchOrdersTableProps {
  dispatchOrders: DispatchOrderResponse[];
  isLoading: boolean;
  onDelete?: ({
    sequence,
    number,
  }: {
    sequence: number;
    number: number;
  }) => void;
  onDispatch?: () => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const DispatchOrdersTable = ({
  dispatchOrders,
  isLoading,
  onDelete,
  onDispatch,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: DispatchOrdersTableProps) => {
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [selectedDispatchOrderSequence, setSelectedDispatchOrderSequence] =
    useState<number | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedDispatchOrderForReturn, setSelectedDispatchOrderForReturn] =
    useState<DispatchOrderResponse | null>(null);
  const [regeneratingPdfSecuencia, setRegeneratingPdfSecuencia] = useState<
    number | null
  >(null);

  const invoiceConversion = useDispatchOrderToInvoice();
  const annulment = useDispatchOrderAnnulment();
  const regenerateEmittedPdf = useRegenerateEmittedDispatchPdf();
  const canViewPrices =
    hasClientPermissions("admin", "organization", ["read"]) ||
    hasClientPermissions("admin", "organization", ["read"]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (dispatchOrders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No dispatch orders found
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispatch Order Number</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              {canViewPrices && <TableHead>Total Amount</TableHead>}

              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dispatchOrders.map((dispatchOrder) => {
              const isDraft = dispatchOrder.DOGEstado === "DRAFT";
              const isEmitted = dispatchOrder.DOGEstado === "EMITTED";
              const isDispatched = dispatchOrder.DOGEstado === "DISPATCHED";
              const isAnulated = dispatchOrder.DOGEstado === "ANULATED";

              const getStatusBadgeVariant = () => {
                if (isDraft) return "outline";
                if (isDispatched) return "default";
                return "default";
              };

              const getStatusBadgeClassName = () => {
                if (isDraft) return "border-yellow-500 text-yellow-700";
                if (isDispatched) return "bg-blue-600 text-white";
                if (isAnulated) return "bg-gray-600 text-white";
                if (isEmitted) return "bg-purple-600 text-white";
                return "bg-green-600 text-white";
              };

              return (
                <TableRow key={dispatchOrder.DOGId}>
                  <TableCell className="font-medium">
                    #{dispatchOrder.DOGNro}
                  </TableCell>
                  <TableCell>
                    {dispatchOrder.DOGPurchaseOrder || "N/A"}
                  </TableCell>
                  <TableCell>
                    {dispatchOrder.cltemae.CRazonSocial || "N/A"}
                  </TableCell>
                  <TableCell>
                    {formatearFecha(dispatchOrder.DOGFechaCreado, {
                      conTiempo: true,
                    })}
                  </TableCell>
                  <TableCell>
                    {dispatchOrder.vendedor?.VNombre || "N/A"}
                  </TableCell>
                  {canViewPrices && (
                    <TableCell>
                      <span className="text-muted-foreground">
                        {formatearMoneda(
                          Number(dispatchOrder.DOGValorTotalNeto ?? 0),
                        )}
                      </span>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant()}
                      className={getStatusBadgeClassName()}
                    >
                      {dispatchOrderUtils.obtenerEstadoLabel(
                        dispatchOrder.DOGEstado,
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            className="text-green-800"
                            href={`/dispatch-orders/${dispatchOrder.DOGOrgSecuencia}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        {!isAnulated && (
                          <>
                            {isDraft && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dispatch-orders/${dispatchOrder.DOGOrgSecuencia}/edit`}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isDraft && (
                              <DropdownMenuItem
                                asChild
                                className="text-blue-600"
                              >
                                <Link
                                  href={`/dispatch-orders/${dispatchOrder.DOGOrgSecuencia}/emit`}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Emit
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {isEmitted && (
                              <DropdownMenuItem
                                className="text-purple-600"
                                disabled={
                                  dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh
                                }
                                title={
                                  dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh
                                    ? "Regenerate the dispatch PDF and notify the warehouse before dispatching."
                                    : undefined
                                }
                                onClick={() => {
                                  if (
                                    dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh
                                  ) {
                                    return;
                                  }
                                  setSelectedDispatchOrderSequence(
                                    dispatchOrder.DOGOrgSecuencia,
                                  );
                                  setDispatchDialogOpen(true);
                                }}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Dispatch
                              </DropdownMenuItem>
                            )}
                            {isEmitted &&
                              dispatchOrder.DOGEmittedPdfNeedsWarehouseRefresh && (
                                <DropdownMenuItem
                                  className="text-amber-700"
                                  disabled={
                                    regenerateEmittedPdf.isPending &&
                                    regeneratingPdfSecuencia ===
                                      dispatchOrder.DOGOrgSecuencia
                                  }
                                  onClick={() => {
                                    setRegeneratingPdfSecuencia(
                                      dispatchOrder.DOGOrgSecuencia,
                                    );
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
                                        onSettled: () => {
                                          setRegeneratingPdfSecuencia(null);
                                        },
                                      },
                                    );
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Regenerate PDF & notify warehouse
                                </DropdownMenuItem>
                              )}
                            {INVOICE_CONVERSION_ENABLED && isDispatched && (
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() => {
                                  invoiceConversion.openModal(dispatchOrder);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Convert to Invoice
                              </DropdownMenuItem>
                            )}
                            {(isDispatched || isEmitted) && (
                              <DropdownMenuItem
                                className="text-orange-600"
                                onClick={() => {
                                  setSelectedDispatchOrderForReturn(
                                    dispatchOrder,
                                  );
                                  setReturnDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Return Inventory
                              </DropdownMenuItem>
                            )}
                            {(isEmitted || isDispatched) && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  annulment.openModal(dispatchOrder);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Annul
                              </DropdownMenuItem>
                            )}
                            {isDraft && onDelete && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  onDelete({
                                    sequence: dispatchOrder.DOGOrgSecuencia,
                                    number: dispatchOrder.DOGNro,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
        emptyMessage="No dispatch orders found"
        itemLabel="dispatch orders"
      />

      {/* Dispatch Dialog */}
      {selectedDispatchOrderSequence !== null && (
        <DispatchOrderDialog
          open={dispatchDialogOpen}
          onOpenChange={(open) => {
            setDispatchDialogOpen(open);
            if (!open) {
              setSelectedDispatchOrderSequence(null);
            }
          }}
          dispatchOrderSequence={selectedDispatchOrderSequence}
          onSuccess={() => {
            onDispatch?.();
          }}
        />
      )}

      {/* Return Inventory Dialog */}
      {selectedDispatchOrderForReturn && (
        <DispatchOrderReturnDialog
          open={returnDialogOpen}
          onOpenChange={(open) => {
            setReturnDialogOpen(open);
            if (!open) {
              setSelectedDispatchOrderForReturn(null);
            }
          }}
          dispatchOrder={selectedDispatchOrderForReturn}
        />
      )}

      {/* Convert to Invoice Modal */}
      {invoiceConversion.selectedDispatchOrder && (
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
    </div>
  );
};
