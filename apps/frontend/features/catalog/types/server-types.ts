// Product types
export interface Producto {
  CKId: number;
  CKOrganizationId: string;
  CKOrgSecuencia: number;
  CKGrupoId: number;
  CKCodigo: number;
  CKDescripcion: string;
  CKOrigenId: number;
  /** Present when API includes `origenPais` relation */
  origenPais?: { id: number; nombre: string; codigo?: string };
  CKUnidadMedidaId: number;
  CKPesoPromedioKg: number;
  CKPrecioPublico: number;
  CKPrecioVenta1: number;
  CKPrecioVenta2: number;
  CKPorcenMargen: number;
  CKTopeDescuento: number;
  CKPorcenMargenTopeDesc: number;
  CKIva: number;
  CKExento: boolean;
  grupo: Grupo;
  unidadDeMedida: Unidad;
}

export interface ProductosResponse {
  data: Producto[];
  pagination: {
    page: number;
    limit?: number;
    totalItems: number;
    totalPages: number;
  };
}

// Group types
export interface Grupo {
  GId: number;
  GOrganizationId: string;
  GNro: number;
  GDescripcion: string;
  GOrgSecuencia: number;
}

export interface GruposResponse {
  data: Grupo[];
  pagination: {
    page: number;
    totalItems: number;
    totalPages: number;
  };
}

// Unit types
export interface Unidad {
  UMId: number;
  UMOrgSecuencia: number;
  UMNombre: string;
  UMDescripcion: string;
  UMOrganizationId: string;
}

export interface UnidadesResponse {
  data: Unidad[];
  pagination: {
    page: number;
    totalItems: number;
    totalPages: number;
  };
}
