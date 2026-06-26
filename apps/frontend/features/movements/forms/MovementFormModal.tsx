"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MovementForm } from "./MovementForm";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { TipoMovimiento } from "@/features/movement-types";
import { MovementFormData } from "../schemas/movement-form-schema";
import { cn } from "@/lib/utils";

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMutating: boolean;
  form: UseFormReturn<MovementFormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isLoadingTiposMovimiento?: boolean;
  hasTiposMovimiento?: boolean;
  tiposMovimiento?: TipoMovimiento[];
}

const dialogContentClassName = cn(
  "flex max-h-[90vh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0",
  "sm:max-w-4xl",
);

function MovementFormModalBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
      {children}
    </div>
  );
}

export function MovementFormModal({
  isOpen,
  onClose,
  isMutating,
  form,
  onSubmit,
  isLoadingTiposMovimiento = false,
  hasTiposMovimiento = true,
  tiposMovimiento,
}: MovementFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className={dialogContentClassName}
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>New Kardex Movement</DialogTitle>
        </DialogHeader>

        <MovementFormModalBody>
          {isLoadingTiposMovimiento ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2
                className="mb-4 size-8 animate-spin text-muted-foreground"
                aria-hidden
              />
              <p className="text-sm text-muted-foreground">
                Loading movement types...
              </p>
            </div>
          ) : !hasTiposMovimiento ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-base text-muted-foreground">
                Create a movement type first
              </p>
            </div>
          ) : (
            <MovementForm
              form={form}
              onSubmit={onSubmit}
              onCancel={onClose}
              isLoading={isMutating}
              tiposMovimiento={tiposMovimiento}
            />
          )}
        </MovementFormModalBody>
      </DialogContent>
    </Dialog>
  );
}
