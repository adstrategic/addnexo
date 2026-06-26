"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import { dispatchOrdersService } from "../service/dispatch-orders.service";
import { dispatchOrderKeys } from "../hooks/useDispatchOrders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NumericFormat } from "react-number-format";

interface ReturnItem {
  DOUId: number;
  producto: {
    CKId: number;
    CKDescripcion: string;
    grupo?: any;
    unidadDeMedida?: any;
  };
  lote: number;
  loteDocumento: string;
  cantidadOriginal: number;
  cantidadYaDevuelta: number;
  cantidadDisponible: number;
  precioUnitario: number;
  tieneImpuesto: boolean;
}

interface DispatchOrderReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dispatchOrder: DispatchOrderResponse;
}

export function DispatchOrderReturnDialog({
  open,
  onOpenChange,
  dispatchOrder,
}: DispatchOrderReturnDialogProps) {
  const [returnQuantities, setReturnQuantities] = useState<
    Record<number, number>
  >({});
  const queryClient = useQueryClient();
  const secuencia = dispatchOrder.DOGOrgSecuencia;
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value || 0);

  // Fetch available items for return
  const { data: items, isLoading } = useQuery<ReturnItem[]>({
    queryKey: [
      ...dispatchOrderKeys.detail(secuencia),
      "devoluciones",
      "items-disponibles",
    ],
    queryFn: async () =>
      (await dispatchOrdersService.getItemsDisponiblesParaDevolucion(
        secuencia,
      )) as unknown as ReturnItem[],
    enabled:
      open &&
      (dispatchOrder.DOGEstado === "DISPATCHED" ||
        dispatchOrder.DOGEstado === "EMITTED"),
  });

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setReturnQuantities({});
    }
  }, [open]);

  const handleQuantityChange = (DOUId: number, cantidad: number) => {
    const item = items?.find((i) => i.DOUId === DOUId);
    if (!item) return;

    // Validate that it doesn't exceed available quantity
    if (cantidad > item.cantidadDisponible) {
      toast.error("Quantity cannot exceed available quantity", {
        description: `Quantity cannot exceed ${item.cantidadDisponible}`,
      });
    }

    setReturnQuantities((prev) => ({
      ...prev,
      [DOUId]: cantidad,
    }));
  };

  // Mutation to create returns
  const createReturnsMutation = useMutation({
    mutationFn: async (
      devoluciones: Array<{ DOUId: number; DOUCantidad: number }>,
    ) => {
      return dispatchOrdersService.crearDevoluciones(secuencia, devoluciones);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: dispatchOrderKeys.detail(secuencia),
      });
      queryClient.invalidateQueries({ queryKey: dispatchOrderKeys.lists() });
      // Also invalidate available items query
      queryClient.invalidateQueries({
        queryKey: [
          ...dispatchOrderKeys.detail(secuencia),
          "devoluciones",
          "items-disponibles",
        ],
      });
      toast.success("Returns created successfully", {
        description: "Returns created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error creating returns", {
        description: error.message || "Error creating returns",
      });
    },
  });

  const handleConfirm = () => {
    // Filter only items with quantity > 0
    const devoluciones = Object.entries(returnQuantities)
      .filter(([_, cantidad]) => cantidad > 0)
      .map(([DOUId, cantidad]) => ({
        DOUId: Number(DOUId),
        DOUCantidad: cantidad,
      }));

    if (devoluciones.length === 0) {
      toast.error(
        "You must select at least one item with quantity greater than 0",
        {
          description:
            "You must select at least one item with quantity greater than 0",
        },
      );
      return;
    }

    createReturnsMutation.mutate(devoluciones);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create Return - Dispatch Order #{dispatchOrder.DOGNro}
          </DialogTitle>
          <DialogDescription>
            Select the quantity to return for each item. Inventory movements
            will be created upon confirmation.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading items...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {!items || items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No items available for return
              </p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Lot Document #</TableHead>
                      <TableHead className="text-right">
                        Original Quantity
                      </TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">
                        Already Returned
                      </TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">
                        Quantity to Return
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.DOUId}>
                        <TableCell className="font-medium">
                          {item.producto.CKDescripcion}
                        </TableCell>
                        <TableCell>{item.lote}</TableCell>
                        <TableCell>{item.loteDocumento}</TableCell>
                        <TableCell className="text-right">
                          {item.cantidadOriginal}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.precioUnitario)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.cantidadYaDevuelta}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.cantidadDisponible}
                        </TableCell>
                        <TableCell>
                          {/* <Input
                            type="number"
                            min={0}
                            max={item.cantidadDisponible}
                            value={returnQuantities[item.DOUId] || 0}
                            onChange={(e) =>
                              handleQuantityChange(
                                item.DOUId,
                                Number(e.target.value),
                              )
                            }
                            className="w-24 ml-auto"
                            disabled={createReturnsMutation.isPending}
                          /> */}
                          <NumericFormat
                            value={returnQuantities[item.DOUId] || 0}
                            onValueChange={(values) => {
                              handleQuantityChange(
                                item.DOUId,
                                values.floatValue || 0,
                              );
                            }}
                            min={0}
                            max={item.cantidadDisponible}
                            disabled={createReturnsMutation.isPending}
                            placeholder="0,00"
                            thousandSeparator="."
                            decimalSeparator=","
                            customInput={Input}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createReturnsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={
                  createReturnsMutation.isPending ||
                  !items ||
                  items.length === 0
                }
              >
                {createReturnsMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Return"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
