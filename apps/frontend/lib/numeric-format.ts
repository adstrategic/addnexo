import type { FocusEvent, MouseEvent } from "react";

function isZeroValue(value: number | string | null | undefined): boolean {
  return value === 0 || value === "0";
}

/**
 * Select all text when the numeric value is 0 so typing replaces it
 * regardless of where the user clicks in the input.
 */
export function numericFormatSelectAllIfZero(
  value: number | string | null | undefined,
) {
  return {
    onFocus: (e: FocusEvent<HTMLInputElement>) => {
      if (isZeroValue(value)) e.currentTarget.select();
    },
    onMouseUp: (e: MouseEvent<HTMLInputElement>) => {
      if (isZeroValue(value)) e.currentTarget.select();
    },
  };
}
