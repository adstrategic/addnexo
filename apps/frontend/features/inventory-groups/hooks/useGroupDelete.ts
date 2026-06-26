"use client";

import { useState } from "react";
import { useGroupActions } from "./useGroupActions";
import type { GroupResponse } from "../schemas/groups.schema";

interface UseGroupDeleteOptions {
  onAfterDelete?: () => void;
}

export function useGroupDelete(options?: UseGroupDeleteOptions) {
  const actions = useGroupActions();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: number;
    sequence: number;
    description: string;
  } | null>(null);

  const openDeleteModal = (group: GroupResponse) => {
    setGroupToDelete({
      id: group.GId,
      sequence: group.GOrgSecuencia,
      description: group.GDescripcion,
    });
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteConfirm = () => {
    if (!groupToDelete) return;
    actions.handleDelete(groupToDelete.id, groupToDelete.sequence, {
      onSuccess: () => {
        closeDeleteModal();
        options?.onAfterDelete?.();
      },
    });
  };

  return {
    isDeleteModalOpen,
    groupToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: actions.isDeleting,
  };
}
