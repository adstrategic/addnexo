import { useEffect, useRef, useCallback } from "react";
import { Control, useWatch } from "react-hook-form";
import type { DispatchOrderItemsFormValues } from "./useDispatchOrderItemsForm";

type FieldName = "DOUCantidad" | "DOUVrUnitario" | "DOUDescuento";

interface UseDebouncedFieldUpdateOptions<T = unknown> {
  control: Control<DispatchOrderItemsFormValues>;
  index: number;
  fieldName: FieldName;
  serverValue: T | undefined;
  itemExistsInDb: boolean;
  onUpdate: (fieldName: FieldName, value: T) => Promise<void>;
  delayMs?: number;
}

/**
 * Hook that watches a form field and triggers an update callback after a debounce delay.
 * Skips update if value hasn't changed from server value or if item doesn't exist in DB.
 */
export function useDebouncedFieldUpdate<T = any>({
  control,
  index,
  fieldName,
  serverValue,
  itemExistsInDb,
  onUpdate,
  delayMs = 600,
}: UseDebouncedFieldUpdateOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastServerValueRef = useRef<T | undefined>(serverValue);
  const isFirstRenderRef = useRef(true);
  // Store onUpdate in a ref to avoid re-triggering effect when callback reference changes
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Watch the specific field value
  const currentValue = useWatch({
    control,
    name: `dispatchOrderU.${index}.${fieldName}` as const,
  });

  // Update server value ref when it changes (from successful mutation)
  useEffect(() => {
    lastServerValueRef.current = serverValue;
  }, [serverValue]);

  // Debounced update effect
  useEffect(() => {
    // Skip on first render
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Skip if item doesn't exist in DB yet
    if (!itemExistsInDb) {
      return;
    }

    // Parse current value as number
    // Use current value directly without forced parsing
    const valueToUpdate = currentValue as T;

    // Skip if value is same as last known server value
    if (Number(valueToUpdate) === Number(lastServerValueRef.current)) {
      return;
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      onUpdateRef.current(fieldName, valueToUpdate);
      // Update ref to prevent re-triggering
      lastServerValueRef.current = valueToUpdate;
    }, delayMs);

    // Cleanup on unmount or value change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentValue, itemExistsInDb, fieldName, delayMs]);

  // Function to cancel pending update (useful when component unmounts or user navigates away)
  const cancelPendingUpdate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { cancelPendingUpdate };
}
