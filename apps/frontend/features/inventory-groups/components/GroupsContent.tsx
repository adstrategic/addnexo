"use client";

import { GroupsTable } from "./GroupsTable";
import { GroupFilters } from "./GroupFilters";
import { GroupActions } from "./GroupActions";
import { useGroups } from "../hooks/useGroups";
import { useGroupManager } from "../hooks/useGroupFormManager";
import { useGroupDelete } from "../hooks/useGroupDelete";
import { GroupFormModal } from "../forms/GroupFormModal";
import { TablePagination } from "@/components/TablePagination";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LoadingComponent from "@/components/loading-component";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

/**
 * Groups (measurement types) page content.
 * Displays group list with server-side search, pagination, and management actions.
 */
export default function GroupsContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const groupManager = useGroupManager();
  const {
    data: groupsData,
    isLoading,
    error,
  } = useGroups({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  const groupDelete = useGroupDelete();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <LoadingComponent variant="dashboard" rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !groupsData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive">
                Error loading groups. Please try again.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groups = groupsData.data;
  const pagination = groupsData.pagination;

  return (
    <>
      <div className="flex flex-col gap-4 p-4 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Groups
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage your measurement groups and categories
            </p>
          </div>
          <GroupActions onOpenCreateModal={groupManager.openCreate} />
        </div>

        <Card>
          <CardHeader className="p-4">
            <GroupFilters searchTerm={searchTerm} onSearchChange={setSearch} />
          </CardHeader>
          <CardContent className="p-0">
            <GroupsTable
              groups={groups}
              isLoading={false}
              onEdit={(group) => groupManager.openEdit(group.GOrgSecuencia)}
              onDelete={groupDelete.openDeleteModal}
            >
              <TablePagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={setPage}
                emptyMessage="No groups found"
                itemLabel="groups"
              />
            </GroupsTable>
          </CardContent>
        </Card>
      </div>

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
    </>
  );
}
