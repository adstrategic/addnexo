"use client";

import type { UseFormReturn } from "react-hook-form";

/**
 * Returns only the dirty (changed) field values from the form.
 * Useful for PATCH-style updates where only modified fields are sent.
 */
export function useDirtyFields<T extends Record<string, unknown>>(
  form: UseFormReturn<T>,
) {
  const getDirtyValues = (data: T): Partial<T> => {
    const dirtyFields = form.formState.dirtyFields as Partial<
      Record<keyof T, boolean>
    >;
    if (!dirtyFields || Object.keys(dirtyFields).length === 0) {
      return {};
    }
    const result = {} as Partial<T>;
    for (const key of Object.keys(dirtyFields) as (keyof T)[]) {
      if (dirtyFields[key]) {
        result[key] = data[key];
      }
    }
    return result;
  };
  return { getDirtyValues };
}
