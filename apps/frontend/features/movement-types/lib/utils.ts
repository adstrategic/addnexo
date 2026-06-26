/**
 * Utility functions for the movement types module
 * These functions are reusable across components within the movement types feature
 */

import { TipoPropositoMovkar } from "../types/server-types";

/** English labels for movement purpose enum values */
const PURPOSE_LABELS: Record<TipoPropositoMovkar, string> = {
  [TipoPropositoMovkar.DISPATCH_ORDER]: "Dispatch Order",
  [TipoPropositoMovkar.DISPATCH_ORDER_DEVOLUCION]: "Dispatch Order Return",
  [TipoPropositoMovkar.DISPATCH_ORDER_ANULACION]: "Dispatch Order Cancellation",
  [TipoPropositoMovkar.FACTURA_DEVOLUCION]: "Invoice Return",
  [TipoPropositoMovkar.NOTA_CREDITO]: "Credit Note",
  [TipoPropositoMovkar.NOTA_CREDITO_CON_DEVOLUCION]: "Credit Note with Return",
  [TipoPropositoMovkar.NOTA_DEBITO]: "Debit Note",
  [TipoPropositoMovkar.ABONO]: "Payment",
};

/**
 * Get movement type label (Entry/Exit)
 */
export function getMovementTypeLabel(tipo: number): string {
  return tipo === 1 ? "Entry" : "Exit";
}

/**
 * Get full movement type description
 */
export function getMovementTypeDescription(tipo: number): string {
  return tipo === 1 ? "1 - Entry" : "2 - Exit";
}

/**
 * Check if purpose can be edited
 */
export function canEditPurpose(
  purpose: TipoPropositoMovkar | null | undefined,
): boolean {
  return purpose === null || purpose === undefined;
}

/**
 * Format purpose for display (English labels)
 */
export function formatPurpose(
  purpose: TipoPropositoMovkar | null | undefined,
): string {
  if (!purpose) return "No purpose assigned";
  return PURPOSE_LABELS[purpose] ?? purpose.replace(/_/g, " ");
}

/**
 * Get badge variant for boolean field
 */
export function getBooleanBadgeVariant(
  value: boolean,
): "default" | "secondary" {
  return value ? "default" : "secondary";
}

/**
 * Get boolean display text
 */
export function getBooleanDisplayText(value: boolean): string {
  return value ? "Yes" : "No";
}
