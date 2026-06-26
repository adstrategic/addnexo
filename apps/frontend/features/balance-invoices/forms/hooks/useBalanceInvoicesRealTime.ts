import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useBalanceInvoice } from "../../hooks/useBalanceInvoices";
import { useCreateBalanceInvoiceHeader } from "../../hooks/useBalanceInvoices";
import type { CreateBalanceInvoiceHeaderData } from "../../schemas/BalanceInvoicesSchema";
import { toast } from "sonner";

interface UseFacturaRealTimeProps {
  mode: "create" | "edit" | "emit";
  sequence?: number;
}

/**
 * Hook que maneja todas las operaciones en tiempo real para facturas:
 * - Creación de header y estado
 * - Obtención de datos de factura
 *
 * Nota: La sincronización del formulario se maneja automáticamente por react-hook-form's 'values' prop
 * en useFacturaForm, así que no necesitamos actualizar el formulario manualmente aquí.
 */
export function useFacturaRealTime({
  mode,
  sequence,
}: UseFacturaRealTimeProps) {
  const router = useRouter();

  // Estado para flujo header primero
  const [isHeaderCreated, setIsHeaderCreated] = useState(
    mode === "edit" || mode === "emit" ? true : false,
  );
  const [currentFacturaId, setCurrentFacturaId] = useState<number | null>(
    mode === "edit" || mode === "emit" ? (sequence ?? null) : null,
  );

  // Obtener factura en modo edit/emit
  const facturaQueryEdit = useBalanceInvoice(
    mode === "edit" || mode === "emit" ? (sequence ?? 0) : 0,
    mode === "edit" || mode === "emit",
  );

  // Obtener factura en modo create después de crear header
  const facturaQueryCreate = useBalanceInvoice(
    currentFacturaId || 0,
    mode === "create" ? !!currentFacturaId : false,
  );

  // Obtener factura basado en modo
  const factura = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return facturaQueryEdit.data;
    }
    return facturaQueryCreate.data;
  }, [mode, facturaQueryEdit.data, facturaQueryCreate.data]);

  const isLoading = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return facturaQueryEdit.isLoading;
    }
    return facturaQueryCreate.isLoading;
  }, [mode, facturaQueryEdit.isLoading, facturaQueryCreate.isLoading]);

  const isError = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return facturaQueryEdit.isError;
    }
    return facturaQueryCreate.isError;
  }, [mode, facturaQueryEdit.isError, facturaQueryCreate.isError]);

  const error = useMemo(() => {
    if (mode === "edit" || mode === "emit") {
      return facturaQueryEdit.error;
    }
    return facturaQueryCreate.error;
  }, [mode, facturaQueryEdit.error, facturaQueryCreate.error]);

  // Mutación de creación de header
  const createHeaderMutation = useCreateBalanceInvoiceHeader();

  // Actualizar ID de factura cuando se carga en modo edit/emit
  useEffect(() => {
    if ((mode === "edit" || mode === "emit") && factura) {
      setCurrentFacturaId(factura.FGOrgSecuencia);
      setIsHeaderCreated(true);
    }
  }, [mode, factura]);

  /**
   * Crear header con datos validados del formulario multi-paso
   * Esta función recibe datos ya validados del paso 1
   *
   * Nota: El manejo de errores se hace en FacturasForm via useFacturaFormLogic
   * que tiene acceso a la instancia del formulario para mostrar errores correctamente
   *
   * @returns El número de secuencia de la factura creada
   */
  const handleCreateHeader = async (
    headerData: CreateBalanceInvoiceHeaderData,
  ): Promise<number> => {
    const createdFactura = await createHeaderMutation.mutateAsync(headerData);
    const sequence = createdFactura.FGOrgSecuencia;
    setCurrentFacturaId(sequence);
    setIsHeaderCreated(true);

    toast.success("Invoice created", {
      description: "You can now add items to the invoice",
    });

    return sequence;
  };

  return {
    // Estado
    factura,
    isLoading,
    isError,
    error,
    isHeaderCreated,
    currentFacturaId,

    // Acciones
    handleCreateHeader,
    isCreatingHeader: createHeaderMutation.isPending,
  };
}
