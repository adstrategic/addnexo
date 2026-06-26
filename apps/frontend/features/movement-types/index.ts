// Features exports - Movement Types Module

// Components
export { MovementTypeContent } from "./components/MovementTypeContent";
export { MovementTypeTable } from "./components/MovementTypeTable";
export { MovementTypeDetail } from "./components/MovementTypeDetail";
export { MovementTypeFilter } from "./components/MovementTypeFilter";
export { MovementTypeAction } from "./components/MovementTypeAction";
export { MovementTypeMovementsTable } from "./components/MovementTypeMovementsTable";

// Forms
export { MovementTypeForm } from "./forms/MovementTypeForm";
export { MovementTypeFormModal } from "./forms/MovementTypeFormModal";

// Hooks
export {
  useMovementTypes,
  useMovementType,
  useCreateMovementType,
  useUpdateMovementType,
  useDeleteMovementType,
  usePropositosDisponibles,
  useNextAvailableClass,
} from "./hooks/useMovementTypes";
export { useMovementTypeActions } from "./hooks/useMovementTypeActions";
export { useMovementTypeManager } from "./hooks/useMovementTypeManager";
export { useMovementTypeDelete } from "./hooks/useMovementTypeDelete";

// Services
export {
  movementTypesApi,
  useMovementTypesQueries,
} from "./services/movement-types.services";

// Export enum as a value (needed for runtime comparisons)
export { TipoPropositoMovkar } from "./types/server-types";

// Export types
export type {
  TipoMovimiento,
  CrearTipoMovimientoData,
  ActualizarTipoMovimientoData,
  TiposMovimientoResponse,
} from "./types/server-types";

// Schemas
export type {
  MovementTypeFormData,
  ActualizarMovementTypeData,
} from "./schemas/movement-type-schema";

// Utils
export * from "./lib/utils";
