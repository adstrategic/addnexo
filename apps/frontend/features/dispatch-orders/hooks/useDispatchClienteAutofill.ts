"use client";

import { useState, useCallback } from "react";
import type { UseFormSetValue } from "react-hook-form";
import type { DispatchOrderHeaderFormData } from "../schemas/dispatch-order-schema";
import type { DispatchOrderResponse } from "../schemas/dispatch-order-response.schema";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";
import type { VendorResponse } from "@/features/vendors/schemas/VendorSchema";
import type { Ciudad } from "@/features/geography";

interface UseDispatchClienteAutofillProps {
  dispatchOrder: DispatchOrderResponse | null | undefined;
  setValue: UseFormSetValue<DispatchOrderHeaderFormData>;
}

interface UseDispatchClienteAutofillReturn {
  selectedCliente: ClienteResponse | null;
  handleClienteSelect: (cliente: ClienteResponse) => void;
  displayVendedor: VendorResponse | null;
  displayCiudad: Ciudad | null;
}

export const useDispatchClienteAutofill = ({
  dispatchOrder,
  setValue,
}: UseDispatchClienteAutofillProps): UseDispatchClienteAutofillReturn => {
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteResponse | null>(dispatchOrder?.cltemae ?? null);

  const [displayVendedor, setDisplayVendedor] = useState<VendorResponse | null>(
    dispatchOrder?.vendedor ?? null,
  );
  const [displayCiudad, setDisplayCiudad] = useState<Ciudad | null>(
    dispatchOrder?.ciudad ?? null,
  );

  const handleClienteSelect = useCallback(
    (cliente: ClienteResponse) => {
      setSelectedCliente(cliente);

      if (cliente.CDireccion) {
        setValue("DOGDireccionEntrega", cliente.CDireccion, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CCiudadId && cliente.ciudad) {
        setValue("DOGCiudadId", cliente.CCiudadId, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setDisplayCiudad(cliente.ciudad as Ciudad);
      }

      if (cliente.CTelefono1) {
        setValue("DOGTelefono1", cliente.CTelefono1, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CCorreo1) {
        setValue("DOGCorreo1", cliente.CCorreo1, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CVendedorVId && cliente.vendedor) {
        setValue("DOGVendedorId", cliente.CVendedorVId, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setDisplayVendedor(cliente.vendedor as VendorResponse);
      }
    },
    [setValue],
  );

  return {
    selectedCliente,
    handleClienteSelect,
    displayVendedor,
    displayCiudad,
  };
};
