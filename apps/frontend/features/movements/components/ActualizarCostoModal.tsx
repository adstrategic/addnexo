"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Loader2,
  AlertTriangle,
  DollarSign,
  Package,
  Calendar,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { movementsUtils } from "../services/movements.services";
import { Movimiento } from "../types/server-types";
import { useActualizarCosto } from "../hooks/useActualizarCosto";
import { formatearFecha } from "@/lib/utils";

// Schema de validación
const actualizarCostoSchema = z.object({
  nuevoCosto: z
    .number({ error: "New cost is required" })
    .min(0.01, "New cost must be greater than 0")
    .max(999999999.99, "New cost is too high"),
});

type ActualizarCostoFormData = z.infer<typeof actualizarCostoSchema>;

interface ActualizarCostoModalProps {
  movimiento: Movimiento | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActualizarCostoModal({
  movimiento,
  isOpen,
  onClose,
}: ActualizarCostoModalProps) {
  const actualizarCosto = useActualizarCosto();

  const form = useForm<ActualizarCostoFormData>({
    resolver: zodResolver(actualizarCostoSchema),
    defaultValues: {
      nuevoCosto: 0,
    },
  });

  const handleSubmit = async (data: ActualizarCostoFormData) => {
    if (!movimiento) return;

    try {
      await actualizarCosto.mutateAsync({
        movimientoId: movimiento.MVId,
        nuevoCosto: data.nuevoCosto,
      });

      // Cerrar modal y resetear formulario
      form.reset();
      onClose();
    } catch (error) {
      // El error ya se maneja en el hook
      console.error("Error al actualizar costo:", error);
    }
  };

  const handleClose = () => {
    if (!actualizarCosto.isPending) {
      form.reset();
      onClose();
    }
  };

  if (!movimiento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="size-5 text-primary" aria-hidden />
            Update Temporary Cost
          </DialogTitle>
          <DialogDescription>
            Complete the cost of the entry that was registered as temporary at
            zero.
          </DialogDescription>
        </DialogHeader>

        {/* Información del movimiento */}
        <div className="space-y-3 py-4">
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sequence:</span>
              <span className="font-semibold">
                #{movimiento.MVOrgSecuencia}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="size-3" aria-hidden />
                Product:
              </span>
              <span className="max-w-[250px] truncate text-right text-sm font-medium">
                {movimiento.invcaruni.CKDescripcion}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="size-3" aria-hidden />
                Date:
              </span>
              <span className="text-sm">
                {formatearFecha(movimiento.MVFecha)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <span className="font-mono text-sm">
                {movementsUtils.formatearCantidad(movimiento.MVCantidad)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lot:</span>
              <span className="font-mono font-semibold">
                {movimiento.MVLote}
              </span>
            </div>
          </div>

          {/* Alert informativo */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              When updating the cost, the weighted average cost will be
              recalculated and <strong>all subsequent exits</strong> of this
              product in the same warehouse will be updated.
            </AlertDescription>
          </Alert>
        </div>

        {/* Formulario */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <Controller
            control={form.control}
            name="nuevoCosto"
            render={({ field, fieldState }) => (
              <Field>
                <FieldLabel>New Cost *</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      className="pl-7"
                      disabled={actualizarCosto.isPending}
                    />
                  </div>
                </FieldContent>
                <FieldDescription>
                  Enter the actual cost of the entry according to the
                  supplier&apos;s invoice
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={actualizarCosto.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={actualizarCosto.isPending}>
              {actualizarCosto.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Cost
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
