import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper for optional nullable fields in Zod schemas.
 * Empty strings and undefined are coerced to null; provided values are validated.
 */
export const nullableOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    schema.nullable().optional(),
  );

export async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate page numbers for pagination
export const getPageNumbers = (totalPages: number, currentPage: number) => {
  const pages = [];
  const maxVisiblePages = 5;

  if (totalPages <= 1) {
    // Only one page or no pages
    return [1];
  }

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination with ellipsis
    if (currentPage <= 3) {
      // Near start: show 1, 2, 3, ..., last
      for (let i = 1; i <= 3; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near end: show 1, ..., last-2, last-1, last
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Middle: show 1, ..., current-1, current, current+1, ..., last
      pages.push(1);
      pages.push("ellipsis");
      pages.push(currentPage - 1);
      pages.push(currentPage);
      pages.push(currentPage + 1);
      pages.push("ellipsis");
      pages.push(totalPages);
    }
  }

  return pages;
};

/**
 * Parsea una fecha ISO string sin problemas de zona horaria.
 * Útil cuando solo necesitas la fecha (sin hora) y quieres evitar
 * que se muestre el día anterior debido a conversiones de zona horaria.
 *
 * @param fechaISO - String de fecha en formato ISO (ej: "2025-12-02T00:00:00.000Z" o "2025-12-02")
 * @returns Date object en hora local sin problemas de zona horaria
 */
export const parsearFechaSinZonaHoraria = (fechaISO: string): Date => {
  // Extrae solo la parte de la fecha (YYYY-MM-DD) y la parsea con dayjs
  // dayjs parsea fechas en formato YYYY-MM-DD en hora local por defecto
  const fechaSolo = fechaISO.split("T")[0];
  return dayjs(fechaSolo).toDate();
};

/**
 * Formatea una fecha para mostrar en la UI.
 * Acepta tanto strings ISO como Date objects.
 *
 * @param fecha - String ISO o Date object
 * @param conTiempo - Si true, incluye la hora en el formato (ej: "Dec 2, 2025 10:00 AM")
 * @returns String formateado (ej: "Dec 2, 2025")
 */
export const formatearFecha = (
  fecha: string | Date | null,
  { conTiempo = false } = {},
): string => {
  if (!fecha) {
    return "N/A";
  }

  if (conTiempo) {
    const fechaParseada = new Date(fecha);

    return fechaParseada.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } else {
    // Si es un Date object, úsalo directamente
    // Si es un string, parsea sin problemas de zona horaria
    const fechaParseada =
      fecha instanceof Date ? fecha : parsearFechaSinZonaHoraria(fecha);

    return fechaParseada.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
};

// Format currency
export const formatearMoneda = (valor: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Days from due date: negative = days until due, zero = due today, positive = days past due.
 * Uses date-only comparison to avoid timezone shifts.
 *
 * @param dueDate - ISO string or Date (or null)
 * @returns { days: number | null, isOverdue30: boolean } - days null if no date; isOverdue30 true when days >= 30
 */
export function getDaysFromDueDate(dueDate: string | Date | null): {
  days: number | null;
  isOverdue30: boolean;
} {
  if (dueDate == null || dueDate === "") {
    return { days: null, isOverdue30: false };
  }
  const due =
    dueDate instanceof Date ? dueDate : parsearFechaSinZonaHoraria(dueDate);
  const today = new Date();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffMs = dueStart.getTime() - todayStart.getTime();
  const days = Math.round(diffMs / MS_PER_DAY);
  return {
    days: -days,
    isOverdue30: -days >= 30,
  };
}
