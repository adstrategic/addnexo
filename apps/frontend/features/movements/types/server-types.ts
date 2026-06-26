import type { Producto } from "@/features/catalog";

// Tipos base
export interface Movimiento {
  MVId: number;
  MVOrgSecuencia: number;
  MVTipoMovimientoId: number;
  MVLote: string;
  MVLoteNroDocumento?: string;
  MVProveedorId?: number | null;
  MVClienteId?: number | null;
  MVFecha: string;
  MVNroDocumento: string;
  MVCantidad: number;
  MVCostoPrecio: number;
  MVCostoSalida: number;
  MVCostoUltimo: number;
  MVDescuento: number;
  MVImpuesto: number;
  MVEsCostoTemporalCero: boolean;
  creadoOModificado: string;
  usuario: string;

  // Relaciones
  tmovkar: {
    TId: number;
    TDescripcion: string;
    TTipo: number;
    TAfecta: boolean;
    TProv: boolean;
    TCliente: boolean;
    TPedido: string;
    TFactura: string;
  };

  invcaruni: Producto;
  almacen: {
    ALId: number;
    ALNombre: string;
    ALTelefono: string;
  };
  organizacion: {
    id: string;
    nombre: string;
  };
  mproved?: {
    MPId: number;
    MPDescripcion: string;
    MPNro: string;
  } | null;
  cltemae?: {
    CId: number;
    CNombreCliente: string;
    CNitCedula: bigint;
  } | null;
  kardexDet: {
    KDId: number;
    KDFecha: string;
    KDExistenciaFin: number;
  };
}

export interface MovimientosResponse {
  data: Movimiento[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface FiltrosMovimientos {
  page?: number;
  limit?: number;
  search?: string;
  tipoMovimiento?: number;
  fechaInicio?: string;
  fechaFin?: string;
  kardexLoteId?: number;
  invcaruniId?: number;
  proveedorId?: number;
  clienteId?: number;
  nroDocumento?: string;
}

/** Matches list payload from GET /almacenes (includes nested ciudad). */
export interface Almacen {
  ALId: number;
  ALNombre: string;
  ciudad?: {
    id: number;
    estadoId: number;
    nombre: string;
    estado: {
      id: number;
      nombre: string;
      pais: { id: number; nombre: string; codigo: string };
    };
  };
}

// Nuevo tipo para lotes disponibles
export interface LoteDisponible {
  KLId: number;
  KLLote: string;
  KLNroDocumento: string; // Document number to differentiate lots
  KLExistenciaFin: number;
  KLCostoPromedio: number;
  KLFechaUltimaEntrada: string;
  ciudad: {
    id: number;
    nombre: string;
  };
}
