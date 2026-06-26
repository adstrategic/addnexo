"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FieldContent,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";
import { usePeriod } from "@/lib/context/period-context";
import { useAlmacenes } from "@/features/warehouses/hooks/useAlmacenes";
import type { AlmacenResponse } from "@/features/warehouses/schemas/almacenes.schema";
import type { TipoMovimiento } from "@/features/movement-types";
import { CiudadSelector } from "@/components/shared/selectors/CiudadSelector";
import { ClienteSelector } from "@/components/shared/selectors/ClienteSelector";
import { ProveedorSelector } from "@/components/shared/selectors/ProveedorSelector";
import { TipoMovimientoSelector } from "@/components/shared/selectors/TipoMovimientoSelector";
import { GroupSelector } from "@/features/catalog/selectors/GroupSelector";
import type { Grupo } from "@/features/catalog/types/server-types";
import type { SupplierResponse } from "@/features/suppliers";
import {
  type MovementFormData,
  type LineaFormData,
} from "../schemas/movement-form-schema";
import type { Ciudad } from "@/features/geography";
import { MovementLineRow } from "./MovementLineRow";

function ciudadFromAlmacenApi(
  c: NonNullable<AlmacenResponse["ciudad"]>,
): Ciudad {
  const ciudad = c as {
    id: number;
    nombre?: string;
    estadoId?: number;
  } & typeof c;
  const estadoId =
    typeof ciudad.estadoId === "number" ? ciudad.estadoId : (c.estado?.id ?? 0);
  return {
    id: c.id,
    nombre: c.nombre ?? "",
    estadoId,
    organizacionId: "",
    createdAt: "",
    updatedAt: "",
    fromOrganization: false,
    estado: {
      id: c.estado?.id ?? 0,
      nombre: c.estado?.nombre ?? "",
      label: c.estado?.nombre ?? "",
      pais: {
        id: c.estado?.pais?.id ?? 0,
        nombre: c.estado?.pais?.nombre ?? "",
        codigo:
          (c.estado?.pais as { codigo?: string } | undefined)?.codigo ?? "",
      },
    },
  };
}

interface MovementFormProps {
  form: UseFormReturn<MovementFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  tiposMovimiento?: TipoMovimiento[];
}

export function MovementForm({
  form,
  onSubmit,
  onCancel,
  isLoading = false,
  tiposMovimiento,
}: MovementFormProps) {
  const { mes, ano, label: periodLabel } = usePeriod();
  const [origenPaisId, setOrigenPaisId] = useState<number | undefined>(
    undefined,
  );
  const [origenPaisNombre, setOrigenPaisNombre] = useState<string>("N/A");
  const [selectedGroup, setSelectedGroup] = useState<Grupo | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState<TipoMovimiento | null>(null);

  // Hooks para obtener datos
  const { data: almacenesResponse } = useAlmacenes({
    page: 1,
    limit: 30,
  });
  const almacenes = almacenesResponse?.data;

  // Observar campos del formulario
  const tipoMovimientoId = useWatch({
    control: form.control,
    name: "MVTipoMovimientoId",
  });
  const almacenId = useWatch({
    control: form.control,
    name: "almacenId",
  });
  const modoSalida = useWatch({
    control: form.control,
    name: "modoSalida",
  });
  const esCostoTemporalCero = useWatch({
    control: form.control,
    name: "MVEsCostoTemporalCero",
  });
  const ciudadId = useWatch({
    control: form.control,
    name: "ciudadId",
  });
  const grupoNro = useWatch({
    control: form.control,
    name: "grupoNro",
  });
  const proveedorId = useWatch({
    control: form.control,
    name: "MVProveedorId",
  });

  // Preferir el tipo elegido en el selector (puede no estar en la página que
  // recibió el padre); si el valor cambió por fuera, caer al find del prop
  const tipoMovimientoSeleccionado =
    tipoSeleccionado?.TId === tipoMovimientoId
      ? tipoSeleccionado
      : tiposMovimiento?.find((tipo) => tipo.TId === tipoMovimientoId);

  const ciudadDefaultDesdeAlmacen = useMemo((): Ciudad | null => {
    if (!almacenId || almacenId <= 0 || !almacenes?.length) return null;
    const almacen = almacenes.find((a) => a.ALId === almacenId);
    if (!almacen?.ciudad) return null;
    return ciudadFromAlmacenApi(almacen.ciudad);
  }, [almacenes, almacenId]);

  const prevAlmacenIdRef = useRef<number | undefined>(undefined);

  // Default city when warehouse changes, or when almacenes arrive after a preset warehouse.
  // Do not run on almacenes refetch alone (would overwrite a user-picked city).
  useEffect(() => {
    if (!almacenes?.length) return;

    const prev = prevAlmacenIdRef.current;
    const almacenChanged = prev !== almacenId;
    prevAlmacenIdRef.current = almacenId;

    if (!almacenId || almacenId <= 0) return;
    if (!almacenChanged) return;

    const almacen = almacenes.find((a) => a.ALId === almacenId);
    if (!almacen?.ciudad) return;

    form.setValue("ciudadId", almacen.ciudad.id, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [almacenId, almacenes, form]);

  const canShowLines =
    !!tipoMovimientoId &&
    tipoMovimientoId > 0 &&
    !!almacenId &&
    almacenId > 0 &&
    !!ciudadId &&
    ciudadId > 0;

  // Field array for lines (unified for entry and exit)
  const {
    fields: lineasFields,
    append: appendLinea,
    remove: removeLinea,
  } = useFieldArray({
    control: form.control,
    name: "lineas",
  });

  // Ensure at least one line when form is initialized
  useEffect(() => {
    const lineas = form.getValues("lineas");
    if (!lineas || lineas.length === 0) {
      form.setValue("lineas", [
        {
          invcaruniId: 0,
          MVCantidad: 0,
          MVCostoPrecio: 0,
          MVLote: undefined,
          MVLoteNroDocumento: undefined,
        } as LineaFormData,
      ]);
    }
  }, [form]);

  // Lógica condicional para campos de proveedor/cliente (flag-driven)
  const mostrarProveedor = tipoMovimientoSeleccionado?.TProv === true;
  const mostrarCliente = tipoMovimientoSeleccionado?.TCliente === true;

  // Determinar si es una salida, entrada o ajuste de inventario
  const esSalida = tipoMovimientoSeleccionado?.TTipo === 2;
  const esEntrada = tipoMovimientoSeleccionado?.TTipo === 1;
  const esAjuste = tipoMovimientoSeleccionado?.TAjusteInventario === true;

  useEffect(() => {
    if (!mostrarProveedor) {
      setOrigenPaisId(undefined);
      setOrigenPaisNombre("N/A");
    }
  }, [mostrarProveedor]);

  const handleSupplierSelect = (supplier: SupplierResponse) => {
    const country = supplier.ciudad?.estado?.pais;
    setOrigenPaisId(country?.id);
    setOrigenPaisNombre(country?.nombre ?? "N/A");
  };

  useEffect(() => {
    if (!esEntrada) {
      setSelectedGroup(null);
      form.setValue("grupoNro", undefined, { shouldValidate: true });
      form.setValue("MVLote", undefined, { shouldValidate: true });
    }
  }, [esEntrada, form]);

  useEffect(() => {
    if (grupoNro === undefined || grupoNro <= 0) {
      setSelectedGroup(null);
    }
  }, [grupoNro]);

  useEffect(() => {
    if (proveedorId == null || proveedorId <= 0) {
      setOrigenPaisId(undefined);
      setOrigenPaisNombre("N/A");
    }
  }, [proveedorId]);

  const handleGroupSelect = (group: Grupo) => {
    setSelectedGroup(group);
    form.setValue("grupoNro", group.GNro, { shouldValidate: true });
  };

  const newLineaDefault: LineaFormData = {
    invcaruniId: 0,
    MVCantidad: 0,
    MVCostoPrecio: 0,
    MVLote: undefined,
    MVLoteNroDocumento: undefined,
    _hasAvgCost: false,
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Movement details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="MVNroDocumento"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Doc. No. *</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                      placeholder="Document number..."
                      onChange={field.onChange}
                    />
                  </FieldContent>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {esEntrada && (
              <Controller
                control={form.control}
                name="MVLote"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Lot / PO *</FieldLabel>
                    <FieldContent>
                      <Input
                        type="text"
                        placeholder="Lot or purchase order ref..."
                        {...field}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FieldContent>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="MVTipoMovimientoId"
              render={({ field, fieldState }) => (
                <TipoMovimientoSelector
                  field={field}
                  fieldState={fieldState}
                  initialTipoMovimiento={tipoMovimientoSeleccionado ?? null}
                  onTipoMovimientoSelect={setTipoSeleccionado}
                />
              )}
            />
            <Controller
              control={form.control}
              name="almacenId"
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>Warehouse *</FieldLabel>
                  <Select
                    onValueChange={(value) => {
                      const id = parseInt(value, 10);
                      field.onChange(id);
                    }}
                    value={
                      field.value && field.value > 0
                        ? field.value.toString()
                        : undefined
                    }
                  >
                    <FieldContent>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse..." />
                      </SelectTrigger>
                    </FieldContent>
                    <SelectContent>
                      {almacenes?.map((almacen) => (
                        <SelectItem
                          key={almacen.ALId}
                          value={almacen.ALId.toString()}
                        >
                          {almacen.ALNombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="ciudadId"
              render={({ field, fieldState }) => (
                <CiudadSelector
                  key={almacenId ?? 0}
                  field={field}
                  initialCiudad={ciudadDefaultDesdeAlmacen}
                  fieldState={fieldState}
                />
              )}
            />
            <Controller
              control={form.control}
              name="MVFecha"
              render={({ field, fieldState }) => {
                const today = new Date();
                const periodYear = ano >= 100 ? ano : 2000 + ano;
                const isCurrentMonth =
                  mes === today.getMonth() + 1 &&
                  periodYear === today.getFullYear();
                const lastDay = isCurrentMonth
                  ? today.getDate()
                  : new Date(periodYear, mes, 0).getDate();
                const diasDelPeriodo = Array.from(
                  { length: lastDay },
                  (_, i) => i + 1,
                );
                return (
                  <Field>
                    <FieldLabel>Date *</FieldLabel>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 font-medium">
                        {periodLabel}
                      </div>
                      <Select
                        onValueChange={(value) => {
                          const dia = parseInt(value);
                          const fechaSeleccionada = new Date(
                            periodYear,
                            mes - 1,
                            dia,
                          );
                          field.onChange(fechaSeleccionada);
                        }}
                        value={
                          field.value &&
                          field.value.getMonth() === mes - 1 &&
                          field.value.getFullYear() === periodYear
                            ? field.value.getDate().toString()
                            : ""
                        }
                      >
                        <FieldContent>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FieldContent>
                        <SelectContent>
                          {diasDelPeriodo.map((dia) => (
                            <SelectItem key={dia} value={dia.toString()}>
                              {dia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
            <Controller
              control={form.control}
              name="MVEsCostoTemporalCero"
              render={({ field }) => (
                <Field className="flex flex-row items-start space-x-3 space-y-0">
                  <FieldContent>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FieldContent>
                  <div className="space-y-1 leading-none">
                    <FieldLabel className="text-sm font-normal cursor-pointer">
                      Entry without cost (temporary)
                    </FieldLabel>
                    <p className="text-xs text-gray-500">
                      Check if you don&apos;t have the supplier&apos;s invoice
                      yet
                    </p>
                  </div>
                </Field>
              )}
            />
            {esSalida && (
              <Controller
                control={form.control}
                name="modoSalida"
                render={({ field, fieldState }) => (
                  <Field>
                    <FieldLabel>Exit mode *</FieldLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || "automatico"}
                    >
                      <FieldContent>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode..." />
                        </SelectTrigger>
                      </FieldContent>
                      <SelectContent>
                        <SelectItem value="automatico">
                          Automatic (FIFO)
                        </SelectItem>
                        <SelectItem value="manual">
                          Manual (select lots)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            {mostrarProveedor && (
              <Controller
                control={form.control}
                name="MVProveedorId"
                render={({ field, fieldState }) => (
                  <ProveedorSelector
                    field={field}
                    fieldState={fieldState}
                    initialSupplier={null}
                    onSupplierSelect={handleSupplierSelect}
                  />
                )}
              />
            )}
            {mostrarCliente && (
              <Controller
                control={form.control}
                name="MVClienteId"
                render={({ field, fieldState }) => (
                  <ClienteSelector
                    field={field}
                    fieldState={fieldState}
                    initialClient={null}
                  />
                )}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <CardTitle>Items</CardTitle>
            <div className="flex flex-wrap items-end gap-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">Origin country</p>
                <p className="text-sm text-muted-foreground">
                  {origenPaisNombre}
                </p>
              </div>
              {esEntrada && (
                <div className="min-w-[200px]">
                  <Controller
                    control={form.control}
                    name="grupoNro"
                    render={({ field }) => (
                      <GroupSelector
                        field={{
                          value: field.value,
                          onChange: () => {
                            /* GNro set via onGroupSelect */
                          },
                        }}
                        initialGroup={selectedGroup}
                        onGroupSelect={handleGroupSelect}
                        disabled={isLoading}
                      />
                    )}
                  />
                </div>
              )}
              {canShowLines && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => appendLinea(newLineaDefault)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add item
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!canShowLines ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              Select movement type, warehouse, and city above to add items.
            </p>
          ) : (
            <Controller
              control={form.control}
              name="lineas"
              render={() => (
                <Field>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>
                          {esSalida
                            ? "Sale price"
                            : esAjuste
                              ? "Unit cost"
                              : "Inventory cost"}
                        </TableHead>
                        {esSalida && modoSalida === "manual" && (
                          <TableHead colSpan={2}>Lots</TableHead>
                        )}
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineasFields.map((field, index) => (
                        <MovementLineRow
                          key={field.id}
                          control={form.control}
                          setValue={form.setValue}
                          index={index}
                          almacenId={almacenId}
                          grupoNro={
                            grupoNro !== undefined && grupoNro > 0
                              ? grupoNro
                              : undefined
                          }
                          paisId={origenPaisId}
                          esCostoTemporalCero={esCostoTemporalCero}
                          esSalida={esSalida}
                          esAjusteInventario={esAjuste}
                          modoSalida={modoSalida ?? "automatico"}
                          onRemove={() => removeLinea(index)}
                          isLoading={isLoading}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </Field>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Movement
        </Button>
      </div>
    </form>
  );
}
