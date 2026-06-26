"use client";

import {
  Control,
  useWatch,
  Controller,
  type UseFormSetValue,
} from "react-hook-form";
import { useEffect, useRef } from "react";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovementTypeFormData } from "../../schemas/movement-type-schema";
import { useNextAvailableClass } from "../../hooks/useMovementTypes";

interface BasicInfoFieldsProps {
  control: Control<MovementTypeFormData>;
  setValue: UseFormSetValue<MovementTypeFormData>;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function BasicInfoFields({
  control,
  setValue,
  isLoading = false,
  mode,
}: BasicInfoFieldsProps) {
  // Watch TTipo to fetch next available class
  const tTipo = useWatch({ control, name: "TTipo" });
  const tClase = useWatch({ control, name: "TClase" });

  // Track the last TTipo we auto-filled for
  const lastAutoFilledTipo = useRef<number | null>(null);

  // Fetch next available class when TTipo is selected
  const { data: nextClassData, isLoading: isLoadingNextClass } =
    useNextAvailableClass(tTipo);

  // Auto-fill TClase when TTipo changes (only in create mode)
  useEffect(() => {
    if (mode === "create" && tTipo && nextClassData?.nextClass) {
      // Auto-fill if field is empty or 0, or if TTipo changed (update to new type's next class)
      const shouldAutoFill =
        !tClase ||
        tClase === 0 ||
        (lastAutoFilledTipo.current !== null &&
          lastAutoFilledTipo.current !== tTipo);

      if (shouldAutoFill) {
        setValue("TClase", nextClassData.nextClass, {
          shouldValidate: true,
          shouldDirty: false,
        });
        lastAutoFilledTipo.current = tTipo;
      }
    }
  }, [tTipo, nextClassData, mode, setValue, tClase]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Movement Type */}
        <Controller
          control={control}
          name="TTipo"
          disabled={mode === "edit"}
          render={({ field, fieldState }) => {
            // Safely convert value to string, handling NaN and invalid values
            const safeValue =
              typeof field.value === "number" && !Number.isNaN(field.value)
                ? field.value.toString()
                : "";

            return (
              <Field>
                <FieldLabel>Movement Type *</FieldLabel>
                <FieldContent>
                  <Select
                    value={safeValue}
                    onValueChange={(value) => {
                      const parsed = parseInt(value, 10);
                      field.onChange(Number.isNaN(parsed) ? 1 : parsed);
                    }}
                    disabled={isLoading || mode === "edit"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Entry</SelectItem>
                      <SelectItem value="2">2 - Exit</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />

        {/* Movement Class */}
        <Controller
          control={control}
          name="TClase"
          disabled={mode === "edit"}
          render={({ field, fieldState }) => {
            // Safely convert value for display, handling NaN and invalid values
            const safeValue =
              typeof field.value === "number" && !Number.isNaN(field.value)
                ? field.value.toString()
                : "";

            return (
              <Field>
                <FieldLabel>Movement Class *</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    placeholder={
                      isLoadingNextClass
                        ? "Loading..."
                        : nextClassData?.nextClass
                          ? `Suggested: ${nextClassData.nextClass}`
                          : "Enter value (1-99)"
                    }
                    disabled={isLoading || mode === "edit"}
                    ref={field.ref}
                    name={field.name}
                    onBlur={field.onBlur}
                    value={safeValue}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      field.onChange(Number.isNaN(parsed) ? 0 : parsed);
                    }}
                  />
                </FieldContent>
                {tTipo && nextClassData && mode === "create" && (
                  <p className="text-xs text-muted-foreground">
                    Next available class for {tTipo === 1 ? "Entry" : "Exit"}:{" "}
                    {nextClassData.nextClass}
                  </p>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            );
          }}
        />

        {/* Description */}
        <Controller
          control={control}
          name="TDescripcion"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Description *</FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  placeholder="Ex: Entry"
                  disabled={isLoading}
                  maxLength={50}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Abbreviation */}
        <Controller
          control={control}
          name="TAbreviatura"
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel>Abbreviation *</FieldLabel>
              <FieldContent>
                <Input
                  type="text"
                  placeholder="Ex: ENT"
                  disabled={isLoading}
                  maxLength={10}
                  {...field}
                />
              </FieldContent>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
