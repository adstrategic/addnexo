/**
 * Utility functions for the clients module
 * These functions are reusable across components within the clients feature
 */

/**
 * Calcular cupo disponible
 */
export function calcularCupoDisponible(
  cupoAutorizado: number,
  abonos: number
): number {
  return cupoAutorizado - abonos;
}

/**
 * Obtener estado del cupo
 */
export function obtenerEstadoCupo(
  cupoAutorizado: number,
  abonos: number
): {
  porcentaje: number;
  estado: "disponible" | "medio" | "agotado";
  color: string;
} {
  const cupoDisponible = cupoAutorizado - abonos;
  const porcentaje =
    cupoAutorizado > 0 ? (cupoDisponible / cupoAutorizado) * 100 : 100;

  let estado: "disponible" | "medio" | "agotado";
  let color: string;

  if (porcentaje > 50) {
    estado = "disponible";
    color = "text-green-600";
  } else if (porcentaje > 20) {
    estado = "medio";
    color = "text-yellow-600";
  } else {
    estado = "agotado";
    color = "text-red-600";
  }

  return { porcentaje, estado, color };
}

/**
 * Generar próxima fecha de vencimiento
 */
export function calcularFechaVencimiento(diasParaVencer: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasParaVencer);
  return fecha;
}

/**
 * Obtener días hasta vencimiento
 */
export function diasHastaVencimiento(fechaVencimiento: string): number {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diferencia = vencimiento.getTime() - hoy.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24));
}

/**
 * Obtener estado de la factura por días de vencimiento
 */
export function obtenerEstadoFactura(diasHastaVencimiento: number): {
  estado: "vigente" | "proximo" | "vencido";
  color: string;
  mensaje: string;
} {
  if (diasHastaVencimiento > 7) {
    return {
      estado: "vigente",
      color: "text-green-600",
      mensaje: "Vigente",
    };
  } else if (diasHastaVencimiento > 0) {
    return {
      estado: "proximo",
      color: "text-yellow-600",
      mensaje: `Vence en ${diasHastaVencimiento} días`,
    };
  } else {
    return {
      estado: "vencido",
      color: "text-red-600",
      mensaje: `Vencido hace ${Math.abs(diasHastaVencimiento)} días`,
    };
  }
}
