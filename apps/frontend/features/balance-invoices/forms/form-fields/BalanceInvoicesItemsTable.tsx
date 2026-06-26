"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ServerBalanceInvoicesItem } from "../../schemas/BalanceInvoicesResponseSchema";
import { BalanceInvoiceItemRow } from "./BalanceInvoicesItemRow";
import type { ItemsFormData } from "../hooks/useBalanceInvoicesItemsForm";
import type { FieldArrayWithId } from "react-hook-form";

interface BalanceInvoicesItemsTableProps {
  facturaId: number | null;
  fields: FieldArrayWithId<ItemsFormData, "items", "id">[];
  dbItems?: ServerBalanceInvoicesItem[];
  submitHandler: (mode: "add" | "update", itemId?: number) => Promise<void>;
  FGValorTotal?: number;
}

export function BalanceInvoicesItemsTable({
  facturaId,
  fields,
  dbItems,
  submitHandler,
  FGValorTotal,
}: BalanceInvoicesItemsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product (Group 999)</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="text-center text-muted-foreground py-6"
            >
              No items added yet
            </TableCell>
          </TableRow>
        ) : (
          fields.map((field, index) => (
            <BalanceInvoiceItemRow
              key={field.id}
              index={index}
              field={field}
              facturaId={facturaId}
              dbItem={dbItems?.[index]}
              submitHandler={submitHandler}
              FGValorTotal={FGValorTotal}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
