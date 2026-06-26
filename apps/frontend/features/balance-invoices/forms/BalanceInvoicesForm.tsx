"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFacturaFormLogic } from "./hooks/useBalanceInvoicesFormLogic";
import { useFacturaRealTime } from "./hooks/useBalanceInvoicesRealTime";
import { BalanceInvoicesHeaderFields } from "./form-fields/BalanceInvoicesHeaderFields";
import { BalanceInvoiceTotals } from "./form-fields/BalanceInvoicesTotals";
import { BalanceInvoicesItemSection } from "./form-fields/BalanceInvoicesItemSection";

import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BalanceInvoicesFormProps {
  mode: "create" | "edit";
  sequence?: number;
}

/**
 * FacturasForm - Componente de presentación puro
 * Responsabilidad única: Componer y renderizar UI del formulario
 * Toda la lógica de negocio se delega a hooks siguiendo principios SOLID
 */
export function BalanceInvoicesForm({
  mode,
  sequence,
}: BalanceInvoicesFormProps) {
  const router = useRouter();

  // Hook de operaciones en tiempo real (obtener datos, creación de header)
  // Este hook maneja la obtención de datos y creación de header
  const {
    factura: currentFactura,
    isLoading: isLoadingFactura,
    isError,
    error,
    isHeaderCreated,
    currentFacturaId,
  } = useFacturaRealTime({
    mode,
    sequence,
  });

  // Crear formulario con currentFactura como initialData
  // React Hook Form sincronizará automáticamente cuando currentFactura cambie vía prop 'values'
  // NOTA: Este formulario solo maneja el HEADER, items se manejan en un formulario separado
  const { form, handleSubmit, isDirty, rootError, isSubmitting } =
    useFacturaFormLogic({
      initialData: currentFactura, // El formulario se sincroniza automáticamente cuando esto cambia
      mode,
    });

  const FGPago = form.watch("FGPago") || "CONTADO";
  // Watch FGValorTotal to pass to items form for validation
  const FGValorTotal = form.watch("FGValorTotal");

  // Configuración del header del formulario
  const formTitle =
    mode === "create" ? "Create Balance Invoice" : "Edit Balance Invoice";

  const formDescription =
    mode === "create"
      ? "Fill in the information below to create a new balance invoice for past transactions. After creating the header, you can add items."
      : "Update the balance invoice header information below. Items are saved automatically in real-time.";

  // Configuración de acciones del formulario
  // CREATE mode: Crea header vía form submit, luego redirige a página de edición
  // EDIT mode: Items guardados en tiempo real, header actualizado vía form submit
  const submitButtonText =
    mode === "create" ? "Create Invoice" : "Update Header";

  if (isLoadingFactura) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Manejar estado de error - solo mostrar error en modo edit/emit cuando se requieren datos
  if (error) {
    return (
      <ErrorBoundary
        error={error}
        entityName="Invoices"
        url={{
          path: "/balance-invoices",
          displayText: "Back to Balance Invoices",
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="m-12 space-y-6">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/balance-invoices">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Balance Invoices
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{formTitle}</h1>
        <p className="text-sm text-muted-foreground">{formDescription}</p>
      </div>

      <Separator />

      {rootError?.message && (
        <Alert variant="destructive">
          <AlertDescription>{rootError.message}</AlertDescription>
        </Alert>
      )}

      {/* Header - Mostrar en todos los modos */}
      <Card>
        <CardHeader>
          <CardTitle>Balance Invoice Information</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceInvoicesHeaderFields
            setValue={form.setValue}
            control={form.control}
            factura={currentFactura}
            FGPago={FGPago}
          />
        </CardContent>
      </Card>

      {/* Paso 2: Item - Mostrar en modo create después de crear header, o siempre en edit/emit */}
      {mode === "create" && !isHeaderCreated && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Please create the invoice header first to add item</p>
          </CardContent>
        </Card>
      )}

      {/* Sección de Items - Formulario INDEPENDIENTE */}
      {(mode !== "create" || (isHeaderCreated && currentFacturaId)) && (
        <BalanceInvoicesItemSection
          facturaId={currentFacturaId || sequence || null}
          dbItems={currentFactura?.facturau} // Items de React Query
          enabled={isHeaderCreated}
          FGValorTotal={FGValorTotal}
        />
      )}

      {/* Totales - Derivado de React Query (items guardados en DB) */}
      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceInvoiceTotals factura={currentFactura} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
