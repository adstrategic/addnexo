/**
 * Unidades (Groups) Feature Module
 * Central export point for all groups-related functionality.
 *
 * Usage:
 *   import { useGroups, GroupForm, type GroupResponse } from '@/features/groups'
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

export { groupsService } from "./service/groups.service";

export { GroupFilters } from "./components/GroupFilters";
export { GroupActions } from "./components/GroupActions";
export { GroupsTable } from "./components/GroupsTable";
export { GroupDetails } from "./components/GroupDetails";
export { GroupProductsList } from "./components/GroupProductsList";

export { GroupForm } from "./forms/GroupForm";
export { GroupFormModal } from "./forms/GroupFormModal";

export { default as GroupsContent } from "./components/GroupsContent";
