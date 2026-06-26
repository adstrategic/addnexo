import { useRouter } from "next/navigation";
import { useDispatchOrderForm } from "./useDispatchOrderForm";
import { useDispatchOrderItemsForm } from "./useDispatchOrderItemsForm";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";
import type { DispatchOrderResponse } from "../../schemas/dispatch-order-response.schema";
import type {
  CreateDispatchOrderHeaderData,
  UpdateDispatchOrderData,
} from "../../schemas/dispatch-order-schema";
import { useDispatchOrderActions } from "../../hooks/useDispatchOrderActions";

interface UseDispatchOrderFormLogicProps {
  initialData?: DispatchOrderResponse;
  mode: "create" | "edit" | "emit";
}

export function useDispatchOrderFormLogic({
  initialData,
  mode,
}: UseDispatchOrderFormLogicProps) {
  const router = useRouter();

  const { form, processFormData, isDirty } = useDispatchOrderForm({
    initialData,
    mode,
  });

  const actions = useDispatchOrderActions(form.setError);

  const {
    form: itemsForm,
    fields,
    appendDraftRow,
    remove,
  } = useDispatchOrderItemsForm({ dispatchOrder: initialData });

  const { scrollToField } = useFormScroll();

  const handleSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "create") {
        actions.handleCreate(apiData as CreateDispatchOrderHeaderData, {
          onSuccess: (order) => {
            router.push(`/dispatch-orders/${order.DOGOrgSecuencia}/edit`);
          },
        });
        return;
      }

      if (!initialData) {
        handleMutationError(new Error("No dispatch order data loaded"));
        return;
      }

      const secuencia = initialData.DOGOrgSecuencia;

      if (mode === "edit") {
        actions.handleUpdate(secuencia, apiData as UpdateDispatchOrderData, {
          onSuccess: (order) => {
            router.push(`/dispatch-orders/${order.DOGOrgSecuencia}`);
          },
        });
        return;
      }

      if (mode === "emit") {
        actions.handleEmit(secuencia, apiData as UpdateDispatchOrderData, {
          onSuccess: (order) => {
            router.push(`/dispatch-orders/${order.DOGOrgSecuencia}`);
          },
        });
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  return {
    form,
    itemsForm,
    fields,
    appendDraftRow,
    remove,
    handleSubmit,
    isDirty,
    rootError: form.formState.errors.root,
    isSubmitting: actions.isMutating,
  };
}
