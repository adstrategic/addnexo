"use client";

import { useEffect, useRef } from "react";
import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDispatchOrderFormLogic } from "./hooks/useDispatchOrderFormLogic";
import { useDispatchOrderRealTime } from "./hooks/useDispatchOrderRealTime";
import { DispatchOrderHeaderFields } from "./form-fields/DispatchOrderHeaderFields";
import { DispatchOrderTotals } from "./form-fields/DispatchOrderTotals";
import { DispatchOrderItemsSection } from "./form-fields/DispatchOrderItemsSection";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

interface DispatchOrderFormProps {
  mode: "create" | "edit" | "emit";
  sequence?: number;
}

export function DispatchOrderForm({ mode, sequence }: DispatchOrderFormProps) {
  const router = useRouter();

  const {
    dispatchOrder: currentDispatchOrder,
    isLoading: isLoadingDispatchOrder,
    isError,
    error,
    isHeaderCreated,
    currentOrderId,
  } = useDispatchOrderRealTime({
    mode,
    sequence,
  });

  const {
    form,
    itemsForm,
    fields,
    appendDraftRow,
    remove,
    handleSubmit,
    rootError,
    isSubmitting,
  } = useDispatchOrderFormLogic({
    initialData: currentDispatchOrder,
    mode,
  });

  const initialEstadoRef = useRef<
    "DRAFT" | "EMITTED" | "DISPATCHED" | "INVOICED" | "ANULATED" | null
  >(null);
  if (
    (mode === "edit" || mode === "emit") &&
    currentDispatchOrder &&
    initialEstadoRef.current === null
  ) {
    initialEstadoRef.current = currentDispatchOrder.DOGEstado;
  }

  const shouldRedirect =
    (mode === "edit" || mode === "emit") &&
    currentDispatchOrder &&
    initialEstadoRef.current !== null &&
    initialEstadoRef.current !== "DRAFT";

  useEffect(() => {
    if (!shouldRedirect) return;
    toast.info(
      mode === "edit"
        ? "This order can no longer be edited"
        : "This order has already been emitted or dispatched",
    );
    router.replace("/dispatch-orders");
  }, [shouldRedirect, mode, router]);

  if (shouldRedirect) {
    return null;
  }

  const formTitle =
    mode === "create"
      ? "Create Dispatch Order"
      : mode === "emit"
        ? "Emit Dispatch Order"
        : "Edit Dispatch Order";

  const formDescription =
    mode === "create"
      ? "Fill in the information below to create a new dispatch order. After creating the header, you can add items."
      : mode === "emit"
        ? "Review and update the dispatch order. All products must have a cost greater than 0 to emit."
        : "Update the dispatch order header information below. Items are saved automatically in real-time.";

  const submitButtonText =
    mode === "create"
      ? "Create Order"
      : mode === "edit"
        ? "Update Header"
        : "Emit Dispatch Order";

  if (isLoadingDispatchOrder) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError && error) {
    return (
      <ErrorBoundary
        error={error}
        entityName="Dispatch Orders"
        url={{
          path: "/dispatch-orders",
          displayText: "Back to Dispatch Orders",
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="container mx-auto px-4 sm:px-6 py-6 space-y-6"
    >
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
          <Link href="/dispatch-orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dispatch Orders
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

      <Card>
        <CardHeader>
          <CardTitle>Dispatch Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchOrderHeaderFields
            setValue={form.setValue}
            control={form.control}
            dispatchOrder={currentDispatchOrder}
          />
        </CardContent>
      </Card>

      {mode === "create" && !isHeaderCreated && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Please create the order header first to add items</p>
          </CardContent>
        </Card>
      )}

      {(mode !== "create" || (isHeaderCreated && currentOrderId)) && (
        <FormProvider {...itemsForm}>
          <DispatchOrderItemsSection
            orderId={currentOrderId || sequence || 0}
            fields={fields}
            DOGPago="CONTADO"
            details={currentDispatchOrder?.dispatchOrderU}
            onAppend={appendDraftRow}
            onRemove={remove}
          />
        </FormProvider>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <DispatchOrderTotals dispatchOrder={currentDispatchOrder} />
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
