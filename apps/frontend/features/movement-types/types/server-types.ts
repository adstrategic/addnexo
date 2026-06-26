// Types for Movement Types Module

export enum TipoPropositoMovkar {
  DISPATCH_ORDER = "DISPATCH_ORDER",
  DISPATCH_ORDER_DEVOLUCION = "DISPATCH_ORDER_DEVOLUCION",
  DISPATCH_ORDER_ANULACION = "DISPATCH_ORDER_ANULACION",
  FACTURA_DEVOLUCION = "FACTURA_DEVOLUCION",
  NOTA_CREDITO = "NOTA_CREDITO",
  NOTA_CREDITO_CON_DEVOLUCION = "NOTA_CREDITO_CON_DEVOLUCION",
  NOTA_DEBITO = "NOTA_DEBITO",
  ABONO = "ABONO",
}

export interface TipoMovimiento {
  TId: number;
  TTipo: number;
  TClase: number;
  TOrgSecuencia: number;
  TDescripcion: string;
  TAbreviatura: string;
  TAfecta: boolean;
  TPedido: boolean;
  TFactura: boolean;
  TProv: boolean;
  TCliente: boolean;
  TRequiere: boolean;
  TRecalcular: boolean;
  TAjusteInventario: boolean;
  TProposito?: TipoPropositoMovkar | null;
}

export interface CrearTipoMovimientoData {
  TTipo: number;
  TClase: number;
  TDescripcion: string;
  TAbreviatura: string;
  TAfecta: boolean;
  TPedido: boolean;
  TFactura: boolean;
  TProv: boolean;
  TCliente: boolean;
  TRequiere: boolean;
  TRecalcular: boolean;
  TAjusteInventario: boolean;
  TProposito?: TipoPropositoMovkar | null;
}

export interface ActualizarTipoMovimientoData extends Partial<CrearTipoMovimientoData> {}

export interface TiposMovimientoResponse {
  data: TipoMovimiento[];
  pagination: {
    page: number;
    totalItems: number;
    totalPages: number;
  };
}
