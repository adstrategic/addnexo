"use client";

import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GroupForm } from "./GroupForm";
import type { GroupResponse, CreateGroupDto } from "../schemas/groups.schema";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingComponent } from "@/components/loading-component";
import { cn } from "@/lib/utils";

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialData?: GroupResponse;
  form: UseFormReturn<CreateGroupDto>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoading?: boolean;
  isLoadingGroup?: boolean;
  groupError?: Error | null;
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-lg",
);

function GroupFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function GroupFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  form,
  onSubmit,
  isLoading = false,
  isLoadingGroup = false,
  groupError = null,
}: GroupFormModalProps) {
  const modalTitle = mode === "create" ? "Create New Group" : "Edit Group";

  if (groupError && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <GroupFormModalBody>
            <ErrorBoundary
              error={groupError}
              entityName="Group"
              url={{
                path: "/inventory-groups",
                displayText: "Back to Inventory Groups",
              }}
            />
          </GroupFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoadingGroup && mode === "edit") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className={dialogContentClassName}
        >
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <GroupFormModalBody>
            <LoadingComponent variant="form" rows={4} />
          </GroupFormModalBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className={dialogContentClassName}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <GroupFormModalBody>
          <GroupForm
            form={form}
            mode={mode}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        </GroupFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
