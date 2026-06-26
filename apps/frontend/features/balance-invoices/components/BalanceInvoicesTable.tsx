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
} from "lucide-react";
import { facturaUtils } from "../service/BalanceInvoicesService";
import { TablePagination } from "@/components/shared/TablePagination";
import {
  EstadoFactura,
  type Factura,
} from "../schemas/BalanceInvoicesResponseSchema";
// import { FacturaDialog } from "./FacturaDialog";
import { useState } from "react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import LoadingComponent from "@/components/loading-component";

interface BalanceInvoicesTableProps {
  facturas: Factura[];
  isLoading: boolean;
  onDelete?: (factura: { sequence: number; number: number }) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const BalanceInvoicesTable = ({
  facturas,
  isLoading,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: BalanceInvoicesTableProps) => {
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

  if (facturas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invoices found
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Purchase Order</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.map((factura) => {
              const isActive = factura.FGEstado === EstadoFactura.ACTIVE;
              const isPaid = factura.FGEstado === EstadoFactura.PAID;
              const isOverdue = factura.FGEstado === EstadoFactura.OVERDUE;
              const isAnulated = factura.FGEstado === EstadoFactura.ANULATED;

              const isEditable = factura.movCXC?.length === 0;

              const getStatusBadgeVariant = () => {
                if (isActive) return "outline";
                if (isPaid) return "default";
                if (isOverdue) return "default";
                if (isAnulated) return "destructive";
                return "default";
              };

              const getStatusBadgeClassName = () => {
                if (isActive) return "border-yellow-500 text-yellow-700";
                if (isPaid) return "bg-blue-600 text-white";
                if (isOverdue) return "bg-red-600 text-white";
                if (isAnulated) return "bg-gray-600 text-white";
              };

              return (
                <TableRow key={factura.FGId}>
                  <TableCell className="font-medium">
                    #{factura.FGNro}
                  </TableCell>
                  <TableCell>{factura.FGPurchaseOrder || "N/A"}</TableCell>
                  <TableCell>{factura.cltemae.CRazonSocial || "N/A"}</TableCell>
                  <TableCell>
                    {formatearFecha(factura.FGFechaCreado, { conTiempo: true })}
                  </TableCell>
                  <TableCell>{factura.vendedor?.VNombre || "N/A"}</TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatearMoneda(factura.FGValorTotalBruto || 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {formatearMoneda(factura.FGSaldo || 0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant()}
                      className={getStatusBadgeClassName()}
                    >
                      {factura.FGEstado}
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
                            href={`/balance-invoices/${factura.FGOrgSecuencia}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        {isEditable && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/balance-invoices/${factura.FGOrgSecuencia}/edit`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isEditable && onDelete && (
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() =>
                              onDelete({
                                sequence: factura.FGOrgSecuencia,
                                number: factura.FGNro,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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
      {/* {selectedDispatchOrderSequence !== null && (
        <FacturaDialog
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
      )} */}
    </div>
  );
};
