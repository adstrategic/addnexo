/**
 * Suppliers Module - Main Export File
 *
 * This module provides a complete supplier management system including:
 * - UI components for displaying and managing suppliers
 * - Form components for creating and editing suppliers
 * - Custom hooks for data fetching and state management
 * - Type definitions and validation schemas
 *
 * @module suppliers
 */

// ============================================================================
// COMPONENTS
// ============================================================================

// Main Content Components
export { SuppliersContent } from "./components/SuppliersContent";
export { SupplierDetails } from "./components/SupplierDetails";

// Action Components
export { SupplierActions } from "./components/SupplierActions";
export { SupplierFilters } from "./components/SuppliersFilters";
export { SupplierTable } from "./components/SuppliersTable";

// ============================================================================
// FORMS
// ============================================================================

// Form Components
export { SupplierForm } from "./forms/SupplierForm";
export { SupplierFormModal } from "./forms/SupplierFormModal";

// Form Fields
export { BasicInfoFields } from "./forms/form-fields/BasicInfoFields";

// ============================================================================
// SCHEMAS
// ============================================================================

export {
  supplierFormSchema,
  type CreateSupplierDTO,
  type UpdateSupplierDTO,
  type SupplierResponse,
  type SupplierResponseList,
  type ListSuppliersParams,
} from "./schemas/SupplierSchemas";

// ============================================================================
// SERVICES
// ============================================================================

export { suppliersService } from "./services/SupplierServices";

// ============================================================================
// HOOKS
// ============================================================================

export {
  useSuppliers,
  useSupplierBySequence,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  supplierKeys,
} from "./hooks/useSuppliers";
export { useSupplierActions } from "./hooks/useSupplierActions";
export { useSupplierFormManager } from "./hooks/useSupplierFormManager";
export { useSupplierDelete } from "./hooks/useSupplierDelete";
