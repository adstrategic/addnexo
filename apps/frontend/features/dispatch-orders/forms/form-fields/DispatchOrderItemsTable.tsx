"use client";

import type { FieldArrayWithId } from "react-hook-form";
import { useWatch, useFormContext } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DispatchOrderItem } from "../../schemas/dispatch-order-schema";
import type { DispatchOrderItemResponse } from "../../schemas/dispatch-order-response.schema";
import type { DispatchOrderItemsFormValues } from "../hooks/useDispatchOrderItemsForm";
import { DispatchOrderItemRow } from "./DispatchOrderItemRow";

interface DispatchOrderItemsTableProps {
  orderId: number;
  fields: FieldArrayWithId<
    DispatchOrderItemsFormValues,
    "dispatchOrderU",
    "id"
  >[];
  onRemove: (index: number) => void;
  DOGPago: "CONTADO" | "CANJE" | "CREDITO";
  details?: DispatchOrderItemResponse[];
  manualLotSelection: "MANUAL" | "AUTOMATICO";
}

export function DispatchOrderItemsTable({
  orderId,
  fields,
  onRemove,
  DOGPago,
  details,
  manualLotSelection,
}: DispatchOrderItemsTableProps) {
  const { control } = useFormContext<DispatchOrderItemsFormValues>();
  const formItems = useWatch({ control, name: "dispatchOrderU" });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Product</TableHead>
            <TableHead className="w-[200px]">Lot</TableHead>
            <TableHead className="w-[100px]">Quantity</TableHead>
            <TableHead className="w-[120px]">Unit Price</TableHead>
            <TableHead className="w-[100px]">Discount (%)</TableHead>
            <TableHead className="w-[80px]">Reserve</TableHead>
            <TableHead className="w-[120px]">Avg KG/Unit</TableHead>
            <TableHead className="w-[120px]">Total KG</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center text-muted-foreground"
              >
                No items added yet
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field, index) => {
              const formRow = formItems?.[index];
              const existingItem: DispatchOrderItemResponse | undefined =
                formRow?.DOUId != null
                  ? details?.find((d) => d.DOUId === formRow.DOUId)
                  : undefined;
              const stableKey = existingItem?.DOUId
                ? `item-${existingItem.DOUId}`
                : field.id;

              return (
                <DispatchOrderItemRow
                  key={stableKey}
                  orderId={orderId}
                  field={field}
                  index={index}
                  onRemove={onRemove}
                  DOGPago={DOGPago}
                  details={details}
                  existingItem={existingItem}
                  manualLotSelection={manualLotSelection}
                />
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
