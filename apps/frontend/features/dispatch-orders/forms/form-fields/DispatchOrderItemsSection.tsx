"use client";

import { useState } from "react";
import type { FieldArrayWithId } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Package } from "lucide-react";
import { DispatchOrderItemsTable } from "./DispatchOrderItemsTable";
import type { DispatchOrderItem } from "../../schemas/dispatch-order-schema";
import type { DispatchOrderItemResponse } from "../../schemas/dispatch-order-response.schema";
import { cn } from "@/lib/utils";

interface DispatchOrderItemsSectionProps {
  orderId: number;
  fields: FieldArrayWithId<{ dispatchOrderU: DispatchOrderItem[] }, "dispatchOrderU", "id">[];
  DOGPago: "CONTADO" | "CANJE" | "CREDITO";
  details?: DispatchOrderItemResponse[];
  onAppend: () => void;
  onRemove: (index: number) => void;
}

export function DispatchOrderItemsSection({
  orderId,
  fields,
  DOGPago,
  details,
  onAppend,
  onRemove,
}: DispatchOrderItemsSectionProps) {
  const initialMode =
    details && details.length > 0
      ? (details[details.length - 1]?.DOUModoSalida ?? "AUTOMATICO")
      : "AUTOMATICO";

  const [manualLotSelection, setManualLotSelection] = useState<
    "MANUAL" | "AUTOMATICO"
  >(initialMode);

  const handleToggleChange = (checked: boolean) => {
    setManualLotSelection(checked ? "MANUAL" : "AUTOMATICO");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dispatch Order Items</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="manual-lot-selection"
                checked={manualLotSelection === "MANUAL"}
                onCheckedChange={handleToggleChange}
              />
              <Label
                htmlFor="manual-lot-selection"
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  manualLotSelection === "MANUAL" && "font-medium",
                )}
              >
                <Package className="h-4 w-4" />
                {manualLotSelection === "MANUAL"
                  ? "Manual lot selection"
                  : "Automatic lot selection"}
              </Label>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onAppend}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DispatchOrderItemsTable
          orderId={orderId}
          fields={fields}
          onRemove={onRemove}
          DOGPago={DOGPago}
          details={details}
          manualLotSelection={manualLotSelection}
        />
      </CardContent>
    </Card>
  );
}
