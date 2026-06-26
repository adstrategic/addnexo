/**
 * Inventory Groups Feature Module
 */

export {
  createGroupSchema,
  updateGroupSchema,
  groupResponseSchema,
  groupResponseListSchema,
  type CreateGroupDto,
  type UpdateGroupDto,
  type GroupResponse,
  type GroupResponseList,
  type ListGroupsParams,
} from "./schemas/groups.schema";

export {
  useGroups,
  useGroupBySequence,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useProductsByGroup,
  groupKeys,
} from "./hooks/useGroups";

export { useGroupActions } from "./hooks/useGroupActions";
export { useGroupManager } from "./hooks/useGroupFormManager";
export { useGroupDelete } from "./hooks/useGroupDelete";
export { useGroupListParams } from "./hooks/useGroupListParams";

export { groupsService } from "./service/groups.service";

export { GroupActions } from "./components/GroupActions";
export { InventoryGroupTable } from "./components/InventoryGroupTable";
export { GroupDetails } from "./components/GroupDetails";
export { InventoryGroupsContent } from "./components/InventoryGroupsContent";
export { GroupListToolbar } from "./components/GroupListToolbar";
export { GroupPageHeader } from "./components/layout/GroupPageHeader";
export { GroupProductsList } from "./components/GroupProductsList";

export { GroupForm } from "./forms/GroupForm";
export { GroupFormModal } from "./forms/GroupFormModal";
