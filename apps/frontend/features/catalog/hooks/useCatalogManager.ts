"use client";

import { useState, useEffect } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  productFormSchema,
  type ProductFormData,
  type ActualizarProductoData,
  transformFromApiFormat,
} from "../schemas/CatalogSchema";
import { useProduct } from "./useCatalog";
import { useProductActions } from "./useCatalogActions";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseProductManagerOptions {
  onAfterSubmit?: () => void;
}

export function useProductManager(options?: UseProductManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [productSequence, setProductSequence] = useState<number | null>(null);

  const {
    data: existingProduct,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProduct(productSequence, mode === "edit" && !!productSequence);

  const defaultValues: DefaultValues<ProductFormData> = {
    CKGrupoId: 0,
    CKDescripcion: "",
    CKOrigenId: 0,
    CKPesoPromedioKg: 0,
    CKUnidadMedidaId: 0,
    CKPrecioPublico: 0,
    CKPrecioVenta1: 0,
    CKPrecioVenta2: 0,
    CKPorcenMargen: 0,
    CKPorcenMargenTopeDesc: 0,
    CKTopeDescuento: 0,
    CKIva: 0,
    CKExento: true,
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useProductActions(form.setError);

  useEffect(() => {
    if (mode === "edit" && existingProduct) {
      form.reset(transformFromApiFormat(existingProduct));
    }
  }, [existingProduct, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const exempt = form.watch("CKExento");
  const marginDiscount = form.watch("CKPorcenMargenTopeDesc");
  const discountLimit = form.watch("CKTopeDescuento");

  useEffect(() => {
    if (exempt) {
      form.setValue("CKIva", 0, { shouldValidate: false });
    }
  }, [exempt, form]);

  useEffect(() => {
    if (marginDiscount > 0) {
      form.setValue("CKTopeDescuento", 0, { shouldValidate: false });
    }
  }, [marginDiscount, form]);

  useEffect(() => {
    if (discountLimit > 0) {
      form.setValue("CKPorcenMargenTopeDesc", 0, { shouldValidate: false });
    }
  }, [discountLimit, form]);

  const openCreate = () => {
    setMode("create");
    setProductSequence(null);
    setIsOpen(true);
    form.reset(defaultValues);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setProductSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setProductSequence(null);
  };

  const processFormData = (data: ProductFormData) => {
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "edit") {
        if (!existingProduct) {
          handleMutationError(new Error("No product data loaded"));
          return;
        }
        actions.handleUpdate(
          existingProduct.CKId,
          apiData as ActualizarProductoData,
          { onSuccess: onSuccessCallback },
        );
      } else {
        actions.handleCreate(apiData as ProductFormData, {
          onSuccess: onSuccessCallback,
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
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,
    product: existingProduct,
    isLoadingProduct,
    productError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
