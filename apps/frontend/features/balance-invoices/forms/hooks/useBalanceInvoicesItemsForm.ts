import { useEffect } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  saldosFacturaItemSchema,
  type BalanceInvoiceItem,
} from "../../schemas/BalanceInvoicesSchema";
import type { Factura } from "../../schemas/BalanceInvoicesResponseSchema";
import {
  useAddBalanceInvoiceItem,
  useUpdateBalanceInvoiceItem,
  useDeleteBalanceInvoiceItem,
  balanceInvoiceKeys,
} from "../../hooks/useBalanceInvoices";
import { useQueryClient } from "@tanstack/react-query";

import { serverItemsToFormItems } from "../../lib/BalanceInvoicesMappers";
import { toast } from "sonner";

interface UseBalanceInvoicesItemsFormProps {
  facturaId: number | null;
  dbItems?: Factura["facturau"]; // Items guardados en DB (de React Query)
  enabled?: boolean; // Solo habilitar cuando header esté creado
  FGValorTotal?: number; // Total amount from header form for validation
}

// Schema factory para validar items con FGValorTotal
const createItemsFormSchema = (FGValorTotal?: number) => {
  const baseSchema = z.object({
    items: z
      .array(saldosFacturaItemSchema)
      .min(1, "At least one item is required")
      .max(1, "Manual invoices can only have 1 item"), // Para facturas manuales
  });

  // Add validation that each item's FUVrUnitario is less than FGValorTotal
  if (FGValorTotal !== undefined && FGValorTotal !== null) {
    return baseSchema.superRefine((data, ctx) => {
      data.items.forEach((item, index) => {
        if (item.FUVrUnitario > FGValorTotal) {
          ctx.addIssue({
            code: "custom",
            message: `Unit price must be less than or equal to total amount (${FGValorTotal})`,
            path: ["items", index, "FUVrUnitario"],
          });
        }
      });
    });
  }

  return baseSchema;
};

// Type will be inferred from the schema created by the factory
export type ItemsFormData = {
  items: Array<{
    FUInvcaruniId: number;
    FUVrUnitario: number;
  }>;
};

/**
 * Hook independiente para gestionar el formulario de items
 * Separado completamente del formulario del header
 */
export function useBalanceInvoicesItemsForm({
  facturaId,
  dbItems,
  enabled = true,
  FGValorTotal,
}: UseBalanceInvoicesItemsFormProps) {
  const queryClient = useQueryClient();

  // Create schema with FGValorTotal validation (memoized)
  const itemsFormSchema = createItemsFormSchema(FGValorTotal);

  // Inicializar formulario INDEPENDIENTE
  const form = useForm<ItemsFormData>({
    resolver: zodResolver(itemsFormSchema) as Resolver<ItemsFormData>,
    mode: "onChange", // Validar en tiempo real
    defaultValues: {
      items: [],
    },
  });

  // Re-validate when FGValorTotal changes
  useEffect(() => {
    if (FGValorTotal !== undefined && FGValorTotal !== null) {
      form.trigger("items");
    }
  }, [FGValorTotal, form]);

  // Field array para items
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Sincronizar con items de DB cuando cambian
  useEffect(() => {
    if (!enabled || !dbItems) {
      // Si no hay items en DB, limpiar el formulario
      if (!dbItems || dbItems.length === 0) {
        replace([]);
      }
      return;
    }

    replace(serverItemsToFormItems(dbItems));
  }, [dbItems, enabled, replace]);

  // Mutations
  const addItemMutation = useAddBalanceInvoiceItem();
  const updateItemMutation = useUpdateBalanceInvoiceItem();
  const deleteItemMutation = useDeleteBalanceInvoiceItem();

  /**
   * Handler para submit usando form.handleSubmit
   * Retorna Promise para poder usar await en el caller
   */
  const submitHandler = async (mode: "add" | "update", itemId?: number) => {
    if (!facturaId) {
      toast.error("Error", {
        description: "Invoice ID is required",
      });
      return;
    }

    await form.handleSubmit(
      // onValid - callback async que se ejecuta si la validación pasa
      async (data) => {
        try {
          // The schema enforces exactly one item; guard so TS narrows away undefined.
          const firstItem = data.items[0];
          if (!firstItem) return;

          if (mode === "add") {
            await addItemMutation.mutateAsync({
              facturaId,
              itemData: firstItem, // ✅ Ya parseado por Zod
            });

            toast.success("Item added", {
              description: "The item has been added to the invoice",
            });
          } else if (mode === "update" && itemId) {
            await updateItemMutation.mutateAsync({
              facturaId,
              itemId,
              updateData: {
                FUVrUnitario: firstItem.FUVrUnitario, // ✅ Ya parseado, solo precio
              },
            });

            toast.success("Item updated", {
              description: "The item has been updated",
            });
          }
        } catch (error: any) {
          // Error de API
          form.setError("items.0", {
            type: "server",
            message: error.message || `Failed to ${mode} item`,
          });
          toast.error(`Error ${mode === "add" ? "adding" : "updating"} item`, {
            description: error.message || `Failed to ${mode} item`,
          });
        }
      },
    )();
  };

  /**
   * Eliminar un item
   */
  const deleteItem = async (index: number, itemId?: number): Promise<void> => {
    if (!facturaId) return;

    if (itemId) {
      // Item existe en DB, eliminarlo
      try {
        await deleteItemMutation.mutateAsync({
          facturaId,
          itemId,
        });

        // Invalidar query para refrescar items de DB
        await queryClient.invalidateQueries({
          queryKey: balanceInvoiceKeys.detail(facturaId),
        });

        toast.success("Item deleted", {
          description: "The item has been removed from the invoice",
        });
      } catch (error: any) {
        toast.error("Error deleting item", {
          description: "Failed to delete item",
        });
      }
    } else {
      // Item solo está en form, solo removerlo
      remove(index);
    }
  };

  // Observar items para cálculo de totales
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  return {
    form,
    fields,
    append,
    remove,
    submitHandler,
    deleteItem,
    watchedItems: watchedItems || [],
    errors: form.formState.errors,
    isValid: form.formState.isValid,
    isSubmitting:
      addItemMutation.isPending ||
      updateItemMutation.isPending ||
      deleteItemMutation.isPending,
  };
}
