import { useBalanceInvoicesForm } from "./useBalanceInvoicesForm";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";
import type { Factura } from "../../schemas/BalanceInvoicesResponseSchema";
import { useBalanceInvoiceActions } from "../../hooks/useBalanceInvoicesActions";
import type {
  CreateBalanceInvoiceHeaderData,
  UpdateBalanceInvoiceData,
} from "../../schemas/BalanceInvoicesSchema";

interface UseFacturaFormLogicProps {
  initialData?: Factura;
  mode: "create" | "edit";
}

export function useFacturaFormLogic({
  initialData,
  mode,
}: UseFacturaFormLogicProps) {
  const { form, processFormData, isDirty } = useBalanceInvoicesForm({
    initialData,
    mode,
  });

  const actions = useBalanceInvoiceActions();

  const { scrollToField } = useFormScroll();

  const handleSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "create") {
        actions.handleCreate(apiData as CreateBalanceInvoiceHeaderData);
        return;
      }

      if (!initialData) {
        handleMutationError(new Error("Invoice not found"));
        return;
      }

      actions.handleUpdate(
        initialData.FGOrgSecuencia,
        apiData as UpdateBalanceInvoiceData,
      );
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
    handleSubmit,
    isDirty,
    rootError: form.formState.errors.root,
    isSubmitting: actions.isMutating,
  };
}
