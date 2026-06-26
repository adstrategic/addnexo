import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type {
  CreateGroupDto,
  UpdateGroupDto,
  ListGroupsParams,
  GroupResponse,
  GroupResponseList,
} from "../schemas/groups.schema";
import {
  groupResponseSchema,
  groupResponseListSchema,
} from "../schemas/groups.schema";

const BASE_URL = "/inventory-groups";

/**
 * Groups (Unidades de medida) service.
 * Handles all API calls for the groups feature.
 */
async function listGroups(
  params?: ListGroupsParams,
): Promise<GroupResponseList> {
  try {
    const { data } = await apiClient.get<GroupResponseList>(BASE_URL, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        search: params?.search,
      },
    });
    const validated = groupResponseListSchema.parse(data);
    return {
      data: validated.data,
      pagination: validated.pagination,
    };
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

async function getGroupBySequence(sequence: number): Promise<GroupResponse> {
  try {
    const { data } = await apiClient.get<GroupResponse>(
      `${BASE_URL}/${sequence}`,
    );
    return groupResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function createGroup(dto: CreateGroupDto): Promise<GroupResponse> {
  try {
    const { data } = await apiClient.post<GroupResponse>(BASE_URL, dto);
    return groupResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function updateGroup(
  id: number,
  dto: UpdateGroupDto,
): Promise<GroupResponse> {
  try {
    const { data } = await apiClient.patch<GroupResponse>(
      `${BASE_URL}/${id}`,
      dto,
    );
    return groupResponseSchema.parse(data);
  } catch (error) {
    handleApiError(error);
  }
}

async function deleteGroup(id: number): Promise<void> {
  try {
    await apiClient.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

export const groupsService = {
  list: listGroups,
  getBySequence: getGroupBySequence,
  create: createGroup,
  update: updateGroup,
  delete: deleteGroup,
};
