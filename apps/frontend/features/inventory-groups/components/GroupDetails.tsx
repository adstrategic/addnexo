"use client";

import { useGroupBySequence } from "../hooks/useGroups";
import { useGroupManager } from "../hooks/useGroupFormManager";
import { useGroupDelete } from "../hooks/useGroupDelete";
import {
  EntityDetails,
  EntitySection,
  EntityAction,
} from "@/components/shared/EntityDetails";
import { Ruler, FileText, Package, BarChart3, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupFormModal } from "../forms/GroupFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { GroupProductsList } from "./GroupProductsList";
import { Suspense } from "react";

interface GroupDetailsProps {
  groupSequence: number;
}

export function GroupDetails({ groupSequence }: GroupDetailsProps) {
  const router = useRouter();
  const {
    data: group,
    isLoading,
    error,
  } = useGroupBySequence(groupSequence, !!groupSequence);

  const groupManager = useGroupManager();
  const groupDelete = useGroupDelete({
    onAfterDelete: () => router.push("/measurement-types"),
  });

  const handleViewProducts = () => {
    document.getElementById("group-products")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleViewStatistics = () => {
    // TODO: Implement navigation to group usage statistics
  };

  const handleViewReports = () => {
    // TODO: Implement navigation to group reports
  };

  const handleAddProduct = () => {
    window.open("/products", "_blank");
  };

  const sections: EntitySection[] = group
    ? [
        {
          title: "General Information",
          icon: <Ruler className="h-5 w-5" />,
          fields: [
            {
              label: "Name",
              value: group.GDescripcion,
              icon: <Ruler className="h-4 w-4 text-muted-foreground" />,
            },
            {
              label: "Description",
              value: group.GDescripcion,
              icon: <FileText className="h-4 w-4 text-muted-foreground" />,
            },
          ],
        },
      ]
    : [];

  const quickActions: EntityAction[] = [
    {
      label: "View Products",
      icon: <Package className="h-6 w-6" />,
      onClick: handleViewProducts,
    },
    {
      label: "Add Product",
      icon: <Plus className="h-6 w-6" />,
      onClick: handleAddProduct,
    },
    {
      label: "View Statistics",
      icon: <BarChart3 className="h-6 w-6" />,
      onClick: handleViewStatistics,
    },
    {
      label: "View Reports",
      icon: <FileText className="h-6 w-6" />,
      onClick: handleViewReports,
    },
  ];

  return (
    <>
      <EntityDetails
        title={group?.GDescripcion ?? ""}
        subtitle={group ? `Group: ${group.GDescripcion}` : ""}
        sections={sections}
        isLoading={isLoading}
        error={error}
        onEdit={() => group && groupManager.openEdit(group.GOrgSecuencia)}
        onDelete={() => group && groupDelete.openDeleteModal(group)}
        quickActions={quickActions}
        notFoundMessage="The group you are looking for does not exist or has been deleted."
        notFoundIcon={<Ruler className="h-12 w-12 text-muted-foreground" />}
      />

      {group && (
        <div id="group-products" className="mt-6 px-4 mb-10">
          <Suspense
            fallback={
              <div className="p-4 text-muted-foreground">Loading products…</div>
            }
          >
            <GroupProductsList
              groupId={group.GId}
              groupName={group.GDescripcion}
            />
          </Suspense>
        </div>
      )}

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
        entityName={
          group?.GDescripcion ?? groupDelete.groupToDelete?.description ?? ""
        }
        isDeleting={groupDelete.isDeleting}
      />
    </>
  );
}
