/**
 * Almacenes (Warehouses) Feature Module
 * Central export point for all warehouse-related functionality.
 */

// Schema & types
export {
  createAlmacenSchema,
  updateAlmacenSchema,
  almacenResponseSchema,
  almacenResponseListSchema,
  listAlmacenesSchema,
  type CreateAlmacenDto,
  type UpdateAlmacenDto,
  type AlmacenResponse,
  type AlmacenResponseList,
  type ListAlmacenesParams,
} from "./schemas/almacenes.schema";

// Components
export { AlmacenActions } from "./components/AlmacenAction";
export { AlmacenTable } from "./components/AlmacenTable";
export { AlmacenDetail } from "./components/AlmacenDetail";
export { AlmacenFilters } from "./components/AlmacenFilter";
export { default as AlmacenContent } from "./components/AlmacenContent";

// Forms
export { AlmacenForm } from "./forms/AlmacenForm";
export { AlmacenFormModal } from "./forms/AlmacenFormModal";

// Hooks
export {
  useAlmacenes,
  useAlmacenBySequence,
  useCreateAlmacen,
  useUpdateAlmacen,
  useDeleteAlmacen,
  almacenKeys,
} from "./hooks/useAlmacenes";
export { useAlmacenActions } from "./hooks/useAlmacenActions";
export { useAlmacenManager } from "./hooks/useAlmacenManager";
export { useAlmacenDelete } from "./hooks/useAlmacenDelete";

// Service
export { almacenesService } from "./services/almacenes.services";
