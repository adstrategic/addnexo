/**
 * Unidades (Units) Feature Module
 * Central export point for all units-related functionality.
 *
 * Usage:
 *   import { useUnits, UnitForm, type UnitResponse } from '@/features/unidades'
 */

export {
  createUnitSchema,
  updateUnitSchema,
  unitResponseSchema,
  unitResponseListSchema,
  type CreateUnitDto,
  type UpdateUnitDto,
  type UnitResponse,
  type UnitResponseList,
  type ListUnitsParams,
} from "./schemas/units.schema";

export {
  useUnits,
  useUnitBySequence,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useProductsByUnit,
  unitKeys,
} from "./hooks/useUnits";

export { useUnitActions } from "./hooks/useUnitActions";
export { useUnitManager } from "./hooks/useUnitFormManager";
export { useUnitDelete } from "./hooks/useUnitDelete";

export { unitsService } from "./service/units.service";

export { UnitFilters } from "./components/UnitFilters";
export { UnitActions } from "./components/UnitActions";
export { UnitTable } from "./components/UnitTable";
export { UnitDetails } from "./components/UnitDetails";
export { UnitProductsList } from "./components/UnitProductsList";

export { UnitForm } from "./forms/UnitForm";
export { UnitFormModal } from "./forms/UnitFormModal";

export { default as UnitsContent } from "./components/UnitsContent";
