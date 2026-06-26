"use client";

import { FormProvider } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServerBalanceInvoicesItem } from "../../schemas/BalanceInvoicesResponseSchema";
import { BalanceInvoicesItemsTable } from "./BalanceInvoicesItemsTable";
import { useBalanceInvoicesItemsForm } from "../hooks/useBalanceInvoicesItemsForm";

interface BalanceInvoicesItemSectionProps {
  facturaId: number | null;
  dbItems?: ServerBalanceInvoicesItem[];
  enabled?: boolean;
  FGValorTotal?: number;
}

export function BalanceInvoicesItemSection({
  facturaId,
  dbItems,
  enabled = true,
  FGValorTotal,
}: BalanceInvoicesItemSectionProps) {
  const itemsForm = useBalanceInvoicesItemsForm({
    facturaId,
    dbItems,
    enabled,
    FGValorTotal,
  });

  return (
    <FormProvider {...itemsForm.form}>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Item</CardTitle>
        </CardHeader>
        <CardContent>
          <BalanceInvoicesItemsTable
            facturaId={facturaId}
            fields={itemsForm.fields}
            dbItems={dbItems}
            submitHandler={itemsForm.submitHandler}
            FGValorTotal={FGValorTotal}
          />
        </CardContent>
      </Card>
    </FormProvider>
  );
}
