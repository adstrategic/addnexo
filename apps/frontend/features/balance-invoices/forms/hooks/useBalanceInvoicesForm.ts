import { useForm, type Resolver, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateBalanceInvoiceHeaderData,
  type UpdateBalanceInvoiceData,
  createBalanceInvoiceHeaderSchema,
} from "../../schemas/BalanceInvoicesSchema";
import type { Factura } from "../../schemas/BalanceInvoicesResponseSchema";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { toHeaderFormValues } from "../../lib/BalanceInvoicesMappers";

interface UseBalanceInvoicesFormProps {
  initialData?: Factura;
  mode: "create" | "edit" | "emit";
  isLoading?: boolean;
}

export type BalanceInvoicesFormData = CreateBalanceInvoiceHeaderData;

export function useBalanceInvoicesForm({
  initialData,
  mode,
  isLoading = false,
}: UseBalanceInvoicesFormProps) {
  const defaultValues: DefaultValues<CreateBalanceInvoiceHeaderData> = {

    FGPago: "CONTADO",
    FGFechaCreado: new Date(),
    FGFechaVencimiento: new Date(new Date().setDate(new Date().getDate() + 30)),
  };

  const form = useForm<CreateBalanceInvoiceHeaderData>({
    resolver: zodResolver(
      createBalanceInvoiceHeaderSchema,
    ) as Resolver<CreateBalanceInvoiceHeaderData>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues,
    values: toHeaderFormValues(initialData),
  });

  const { getDirtyValues } = useDirtyFields(form);

  const processFormData = (
    data: CreateBalanceInvoiceHeaderData,
  ): UpdateBalanceInvoiceData | CreateBalanceInvoiceHeaderData => {
    if (mode === "create") {
      return data;
    }

    return getDirtyValues(data) as UpdateBalanceInvoiceData;
  };

  return {
    form,
    processFormData,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
    isLoading,
    setValue: form.setValue,
    getValues: form.getValues,
    watch: form.watch,
    clearErrors: form.clearErrors,
    setError: form.setError,
  };
}
