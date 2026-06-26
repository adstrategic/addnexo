"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileText,
  Layers,
  Package,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGroupBySequence } from "../hooks/useGroups";
import { useGroupManager } from "../hooks/useGroupFormManager";
import { useGroupDelete } from "../hooks/useGroupDelete";
import { GroupFormModal } from "../forms/GroupFormModal";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { GroupProductsList } from "./GroupProductsList";
import { ErrorBoundary } from "@/components/error-boundary";
import { GroupDetailsView } from "./GroupDetailsView";

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
    onAfterDelete: () => router.push("/inventory-groups"),
  });

  const handleEdit = () => {
    if (group) {
      groupManager.openEdit(group.GOrgSecuencia);
    }
  };

  const handleDelete = () => {
    if (group) {
      groupDelete.openDeleteModal(group);
    }
  };

  if (error) {
    return (
      <div className="p-4 md:p-8">
        <ErrorBoundary error={error} entityName="Inventory Group" />
      </div>
    );
  }

  if (!isLoading && !group) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4 text-center md:p-8">
        <Layers className="size-12 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Group not found</h2>
          <p className="text-sm text-muted-foreground">
            The group you are looking for does not exist or has been deleted.
          </p>
        </div>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/inventory-groups">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to inventory groups
          </Link>
        </Button>
      </div>
    );
  }

  const sections = group
    ? [
        {
          title: "General Information",
          icon: <Layers className="size-4" aria-hidden />,
          fields: [
            {
              label: "Group Number",
              value: <Badge variant="secondary">#{group.GNro}</Badge>,
              icon: <Layers className="size-4" aria-hidden />,
            },
            {
              label: "Description",
              value: group.GDescripcion,
              icon: <FileText className="size-4" aria-hidden />,
            },
          ],
        },
      ]
    : [];

  const quickActions = [
    {
      label: "View Products",
      icon: <Package className="size-5" aria-hidden />,
      onClick: () => {
        document.getElementById("group-products")?.scrollIntoView({
          behavior: "smooth",
        });
      },
    },
    {
      label: "Add Product",
      icon: <Plus className="size-5" aria-hidden />,
      onClick: () => window.open("/products", "_blank"),
    },
    {
      label: "View Statistics",
      icon: <BarChart3 className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to group usage statistics
      },
    },
    {
      label: "View Reports",
      icon: <FileText className="size-5" aria-hidden />,
      onClick: () => {
        // TODO: Navigate to group reports
      },
    },
  ];

  return (
    <>
      <GroupDetailsView
        title={group?.GDescripcion ?? ""}
        subtitle={group ? `Group #${group.GNro}` : undefined}
        sections={sections}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        quickActions={quickActions}
      >
        {group ? (
          <div id="group-products" className="mt-2">
            <Suspense
              fallback={
                <div className="p-4 text-muted-foreground">
                  Loading products…
                </div>
              }
            >
              <GroupProductsList
                groupId={group.GId}
                groupName={group.GDescripcion}
              />
            </Suspense>
          </div>
        ) : null}
      </GroupDetailsView>

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
