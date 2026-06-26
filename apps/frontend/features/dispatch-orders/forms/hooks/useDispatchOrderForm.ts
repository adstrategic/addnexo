import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDispatchOrderHeaderSchema,
  type UpdateDispatchOrderData,
  type CreateDispatchOrderHeaderData,
} from "../../schemas/dispatch-order-schema";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import type { DispatchOrderResponse } from "../../schemas/dispatch-order-response.schema";
import { toHeaderFormValues } from "../../lib/dispatch-order-mappers";
import { startOfDay } from "date-fns";

interface UseDispatchOrderFormProps {
  initialData?: DispatchOrderResponse;
  mode: "create" | "edit" | "emit";
  isLoading?: boolean;
}

export function useDispatchOrderForm({
  initialData,
  mode,
  isLoading = false,
}: UseDispatchOrderFormProps) {
  const defaultValues: CreateDispatchOrderHeaderData = {
    DOGClienteId: 0,
    DOGVendedorId: 0,
    DOGPurchaseOrder: null,
    DOGTipo: 1,
    DOGZona: 0,
    DOGTelefono1: "",
    DOGTelefono2: null,
    DOGCorreo1: "",
    DOGCorreo2: null,
    DOGDireccionEntrega: "",
    DOGCiudadId: 0,
    DOGFechaCreado: startOfDay(new Date()),
    DOGCondicion1: "",
    DOGCondicion2: "",
    DOGCondicion3: "",
  };

  const form = useForm<CreateDispatchOrderHeaderData>({
    resolver: zodResolver(
      createDispatchOrderHeaderSchema,
    ) as Resolver<CreateDispatchOrderHeaderData>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues,
    values: toHeaderFormValues(initialData),
  });

  const { getDirtyValues } = useDirtyFields(form);

  const processFormData = (
    data: CreateDispatchOrderHeaderData,
  ): UpdateDispatchOrderData | CreateDispatchOrderHeaderData => {
    if (mode === "create") {
      return data;
    }

    return getDirtyValues(data) as UpdateDispatchOrderData;
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
