// Features exports - Products Module

// Components
export { ProductAction } from "./components/CatalogAction";
export { ProductTable } from "./components/CatalogTable";
export { ProductDetail } from "./components/CatalogDetail";
export { ProductFilter } from "./components/CatalogFilter";
export { ProductContent } from "./components/CatalogContent";

// Forms
export { ProductForm } from "./forms/CatalogForm";
export { ProductFormModal } from "./forms/CatalogFormModal";

// Form Fields
export { BasicInfoFields } from "./forms/form-fields/BasicInfoFields";
export { PricingFields } from "./forms/form-fields/PricingFields";
export { MarginFields } from "./forms/form-fields/MarginFields";
export { TaxFields } from "./forms/form-fields/TaxFields";

// Hooks
export {
  useProducts,
  useProduct,
  useCrearProducto,
  useActualizarProducto,
  useEliminarProducto,
  productKeys,
} from "./hooks/useCatalog";
export { useProductActions } from "./hooks/useCatalogActions";
export { useProductManager } from "./hooks/useCatalogManager";
export { useProductDelete } from "./hooks/useCatalogDelete";

// Service
export { productsService, productsUtils } from "./service/CatalogService";

// Types
export type {
  Producto,
  ProductosResponse,
  Grupo,
  GruposResponse,
  Unidad,
  UnidadesResponse,
} from "./types/server-types";

// Schema
export type {
  ProductFormData,
  ActualizarProductoData,
} from "./schemas/CatalogSchema";
export {
  productFormSchema,
  transformFromApiFormat,
} from "./schemas/CatalogSchema";

// Selectors
export { GroupSelector } from "./selectors/GroupSelector";
export { UnitSelector } from "./selectors/UnitSelector";
