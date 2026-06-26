import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { DispatchOrderItem } from "../../schemas/dispatch-order-schema";
import type { DispatchOrderResponse } from "../../schemas/dispatch-order-response.schema";
import {
  serverItemToFormItem,
  serverItemsToFormItems,
} from "../../lib/dispatch-order-mappers";

export type DispatchOrderItemsFormValues = {
  dispatchOrderU: DispatchOrderItem[];
};

const emptyDraftItem = (): DispatchOrderItem => ({
  DOUInvcaruniId: 0,
  DOUCantidad: 1,
  DOUVrUnitario: 0,
  DOUDescuento: 0,
  DOUTieneImpuesto: false,
  DOULote: null,
  DOUNroDocumento: null,
  DOUReservar: false,
});

interface UseDispatchOrderItemsFormProps {
  dispatchOrder?: DispatchOrderResponse;
}

/**
 * Items table form — separate from header form.
 * Rows sync from server query data; drafts (no DOUId) stay local until saved via API.
 */
export function useDispatchOrderItemsForm({
  dispatchOrder,
}: UseDispatchOrderItemsFormProps) {
  const form = useForm<DispatchOrderItemsFormValues>({
    defaultValues: { dispatchOrderU: [] },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "dispatchOrderU",
  });

  useEffect(() => {
    if (!dispatchOrder?.dispatchOrderU) return;

    const serverItems = dispatchOrder.dispatchOrderU;
    const serverMap = new Map(serverItems.map((i) => [i.DOUId, i]));
    const currentRows = form.getValues("dispatchOrderU") ?? [];

    if (!currentRows.length) {
      replace(serverItemsToFormItems(serverItems));
      return;
    }

    let merged = currentRows.filter(
      (row) => row.DOUId == null || serverMap.has(row.DOUId),
    );
    merged = merged.map((row) =>
      row.DOUId != null && serverMap.has(row.DOUId)
        ? serverItemToFormItem(serverMap.get(row.DOUId)!)
        : row,
    );

    for (const id of serverMap.keys()) {
      if (!merged.some((m) => m.DOUId === id)) {
        merged.push(serverItemToFormItem(serverMap.get(id)!));
      }
    }

    replace(merged);
  }, [dispatchOrder, replace, form]);

  const appendDraftRow = () => append(emptyDraftItem());

  return {
    form,
    fields,
    appendDraftRow,
    remove,
  };
}
