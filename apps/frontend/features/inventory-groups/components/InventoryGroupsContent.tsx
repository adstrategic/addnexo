"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useGroups } from "../hooks/useGroups";
import { useGroupManager } from "../hooks/useGroupFormManager";
import { useGroupDelete } from "../hooks/useGroupDelete";
import { useGroupListParams } from "../hooks/useGroupListParams";
import { InventoryGroupTable } from "./InventoryGroupTable";
import { GroupListToolbar } from "./GroupListToolbar";
import { GroupActions } from "./GroupActions";
import { GroupPageHeader } from "./layout/GroupPageHeader";
import { groupListPadding } from "./layout/group-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { GroupFormModal } from "../forms/GroupFormModal";

export function InventoryGroupsContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useGroupListParams();

  const groupManager = useGroupManager();
  const groupDelete = useGroupDelete();

  const {
    data: groupsData,
    isLoading,
    isFetching,
    error,
  } = useGroups({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Inventory Groups" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <GroupPageHeader
        title="Inventory Groups"
        description="Manage your product inventory groups"
        actions={<GroupActions onOpenCreateModal={groupManager.openCreate} />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${groupListPadding.toolbar}`}
          >
            <GroupListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <InventoryGroupTable
            groups={groupsData?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onDelete={groupDelete.openDeleteModal}
            onEdit={(sequence) => groupManager.openEdit(sequence)}
            currentPage={currentPage}
            totalPages={groupsData?.pagination.totalPages ?? 1}
            totalItems={groupsData?.pagination.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={groupManager.openCreate}
          />
        </CardContent>
      </Card>

      <GroupFormModal
        isOpen={groupManager.isOpen}
        onClose={groupManager.close}
        mode={groupManager.mode}
        initialData={groupManager.group}
        form={groupManager.form}
        onSubmit={groupManager.onSubmit}
        isLoading={groupManager.isMutating}
        isLoadingGroup={groupManager.isLoadingGroup}
        groupError={groupManager.groupError}
      />

      <EntityDeleteModal
        isOpen={groupDelete.isDeleteModalOpen}
        onClose={groupDelete.closeDeleteModal}
        onConfirm={groupDelete.handleDeleteConfirm}
        entity="group"
        entityName={groupDelete.groupToDelete?.description ?? ""}
        isDeleting={groupDelete.isDeleting}
      />
    </div>
  );
}
