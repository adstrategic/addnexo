"use client";

import { useState } from "react";
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { movementsUtils } from "../services/movements.services";
import {
  Eye,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
} from "lucide-react";
import { formatearFecha, formatearMoneda } from "@/lib/utils";
import { ActualizarCostoModal } from "./ActualizarCostoModal";
import { cn } from "@/lib/utils";
import { Movimiento } from "../types/server-types";
import { useRouter } from "next/navigation";
import { TablePagination } from "@/components/shared/TablePagination";

interface MovementTableProps {
  movimientos: Movimiento[];
  isLoading: boolean;
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const MovementTable = ({
  movimientos,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: MovementTableProps) => {
  // Estado para el modal de actualizar costo
  const [movimientoParaActualizar, setMovimientoParaActualizar] =
    useState<Movimiento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleActualizarCosto = (movimiento: Movimiento) => {
    setMovimientoParaActualizar(movimiento);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMovimientoParaActualizar(null);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!movimientos.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ArrowUpRight className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No movements</h3>
        <p className="text-gray-500 mb-4">
          No movements found with the applied filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="rounded-md border ">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="bg-gray-50">
              <TableHead className="w-20">No.</TableHead>
              <TableHead className="w-24">Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-24">Lot</TableHead>
              <TableHead className="w-24">Lot Document #</TableHead>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-20 text-right">Qty.</TableHead>
              <TableHead className="w-28 text-right">Cost/Price</TableHead>
              <TableHead className="w-32">Supplier/Customer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movimientos.map((movimiento) => {
              const esCostoTemporalCero =
                movimiento.MVEsCostoTemporalCero &&
                movimiento.tmovkar.TTipo === 1;

              return (
                <TableRow
                  key={movimiento.MVId}
                  className={cn(
                    "hover:bg-gray-50",
                    esCostoTemporalCero && "bg-amber-50 hover:bg-amber-100",
                  )}
                >
                  {/* Secuencial */}
                  <TableCell className="font-medium">
                    {movimiento.MVNroDocumento}
                  </TableCell>

                  {/* Tipo de Movimiento */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={movementsUtils.obtenerColorTipo(
                          movimiento.tmovkar.TTipo,
                        )}
                      >
                        <span className="mr-1">
                          {movimiento.tmovkar.TTipo === 1 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                        </span>
                        {movimiento.tmovkar.TTipo === 1 ? "Entry" : "Exit"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {movimiento.tmovkar.TDescripcion}
                    </div>
                  </TableCell>

                  {/* Producto */}
                  <TableCell>
                    <div className="max-w-48">
                      <div className="font-medium text-sm truncate">
                        {movimiento.invcaruni.CKDescripcion}
                      </div>
                      <div className="text-xs text-gray-500">
                        Ref:{" "}
                        {movimiento.invcaruni.origenPais?.nombre ??
                          `#${movimiento.invcaruni.CKOrigenId}`}
                      </div>
                    </div>
                  </TableCell>

                  {/* Lote */}
                  <TableCell className="font-mono text-sm">
                    {movimiento.MVLote}
                  </TableCell>

                  {/* Lot Document */}
                  <TableCell className="font-mono text-sm">
                    {" "}
                    {movimiento.MVNroDocumento || "N/A"}
                  </TableCell>

                  {/* Fecha */}
                  <TableCell className="text-sm">
                    {formatearFecha(movimiento.MVFecha)}
                  </TableCell>

                  {/* Cantidad */}
                  <TableCell className="text-right font-mono">
                    {movementsUtils.formatearCantidad(movimiento.MVCantidad)}
                  </TableCell>

                  {/* Costo de Inventario / Precio de Venta */}
                  <TableCell className="text-right font-mono text-sm">
                    <div className="flex flex-col items-end gap-1">
                      {movimiento.tmovkar.TTipo === 1 ? (
                        // Entries: Show MVCostoPrecio (inventory cost)
                        <>
                          {formatearMoneda(movimiento.MVCostoUltimo)}
                          {esCostoTemporalCero && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-100 text-amber-700 border-amber-300"
                            >
                              Pending
                            </Badge>
                          )}
                        </>
                      ) : (
                        // Exits: Show MVCostoSalida (inventory cost) and optionally MVCostoPrecio (sale price)
                        <>
                          <span className="text-xs text-green-950">
                            Average cost:{" "}
                          </span>
                          {formatearMoneda(movimiento.MVCostoSalida ?? 0)}
                          {movimiento.MVCostoPrecio &&
                            movimiento.MVCostoPrecio > 0 && (
                              <span className="text-xs text-gray-500">
                                Sale price:{" "}
                                {formatearMoneda(movimiento.MVCostoPrecio)}
                              </span>
                            )}
                        </>
                      )}
                    </div>
                  </TableCell>

                  {/* Proveedor/Cliente */}
                  <TableCell>
                    <div className="max-w-32">
                      {movimiento.mproved ? (
                        <div>
                          <div className="text-sm font-medium truncate">
                            {movimiento.mproved.MPDescripcion}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movimiento.mproved.MPNro}
                          </div>
                        </div>
                      ) : movimiento.cltemae ? (
                        <div>
                          <div className="text-sm font-medium truncate">
                            {movimiento.cltemae.CNombreCliente}
                          </div>
                          <div className="text-xs text-gray-500">
                            {movimiento.cltemae.CNitCedula.toString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/movements/${movimiento.MVOrgSecuencia}`,
                            )
                          }
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>

                        {esCostoTemporalCero && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleActualizarCosto(movimiento)}
                              className="cursor-pointer text-amber-600 focus:text-amber-700 focus:bg-amber-50"
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Update Cost
                            </DropdownMenuItem>
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
        {/* </ScrollArea> */}
      </div>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />

      {/* Modal de actualizar costo */}
      <ActualizarCostoModal
        movimiento={movimientoParaActualizar}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
