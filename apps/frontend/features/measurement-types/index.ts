/**
 * Measurement Units Feature Module
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
export { useUnitListParams } from "./hooks/useUnitListParams";

export { unitsService } from "./service/units.service";

export { UnitActions } from "./components/UnitActions";
export { UnitTable } from "./components/UnitTable";
export { UnitDetails } from "./components/UnitDetails";
export { MeasurementUnitsContent } from "./components/MeasurementUnitsContent";
export { UnitListToolbar } from "./components/UnitListToolbar";
export { UnitPageHeader } from "./components/layout/UnitPageHeader";
export { UnitProductsList } from "./components/UnitProductsList";

export { UnitForm } from "./forms/UnitForm";
export { UnitFormModal } from "./forms/UnitFormModal";
