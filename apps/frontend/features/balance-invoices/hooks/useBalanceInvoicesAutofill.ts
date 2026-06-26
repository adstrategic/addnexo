"use client";

import { useState, useCallback } from "react";
import { UseFormSetValue } from "react-hook-form";
import type { CreateBalanceInvoiceHeaderData } from "../schemas/BalanceInvoicesSchema";
import type { Factura } from "../schemas/BalanceInvoicesResponseSchema";
import type { ClienteResponse } from "@/features/clients/schemas/ClientSchema";
import type { VendorResponse } from "@/features/vendors/schemas/VendorSchema";
import type { Ciudad } from "@/features/geography";

interface UseSaldosClienteAutofillProps {
  factura: Factura | null | undefined;
  setValue: UseFormSetValue<CreateBalanceInvoiceHeaderData>;
}

interface UseSaldosClienteAutofillReturn {
  selectedCliente: ClienteResponse | null;
  handleClienteSelect: (cliente: ClienteResponse) => void;
  displayVendedor: VendorResponse | null;
  displayCiudad: Ciudad | null;
}

/**
 * Manages autofill when a customer is selected in the balance invoice form.
 *
 * displayVendedor and displayCiudad are intentionally initialized from factura
 * (not from factura.cltemae) to avoid showing stale client relationship data
 * in edit mode when the saved vendor/city differs from the client's defaults.
 */
export const useSaldosClienteAutofill = ({
  factura,
  setValue,
}: UseSaldosClienteAutofillProps): UseSaldosClienteAutofillReturn => {
  const [selectedCliente, setSelectedCliente] =
    useState<ClienteResponse | null>(factura?.cltemae ?? null);

  const [displayVendedor, setDisplayVendedor] = useState<VendorResponse | null>(
    (factura?.vendedor as VendorResponse | null) ?? null,
  );
  const [displayCiudad, setDisplayCiudad] = useState<Ciudad | null>(
    (factura?.ciudad as Ciudad | null) ?? null,
  );

  const handleClienteSelect = useCallback(
    (cliente: ClienteResponse) => {
      setSelectedCliente(cliente);

      if (cliente.CDireccion) {
        setValue("FGDireccionEntrega", cliente.CDireccion, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CCiudadId && cliente.ciudad) {
        setValue("FGCiudadId", cliente.CCiudadId, {
          shouldValidate: true,
          shouldDirty: true,
        });
        setDisplayCiudad(cliente.ciudad as Ciudad);
      }

      if (cliente.CTelefono1) {
        setValue("FGTelefono1", cliente.CTelefono1, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CCorreo1) {
        setValue("FGCorreo1", cliente.CCorreo1, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      if (cliente.CVendedorVId && cliente.vendedor) {
        setValue("FGVendedorId", cliente.CVendedorVId, {
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
