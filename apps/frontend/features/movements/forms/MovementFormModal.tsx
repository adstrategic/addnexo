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
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>New Kardex Movement</DialogTitle>
        </DialogHeader>
        {
          // isMutating ? (
          //   <div className="flex items-center justify-center py-8">
          //     <Loader2 className="h-8 w-8 animate-spin" />
          //   </div>
          // ) :
          isLoadingTiposMovimiento ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading movement types...
              </p>
            </div>
          ) : !hasTiposMovimiento ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-base text-muted-foreground text-center">
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
          )
        }
      </DialogContent>
    </Dialog>
  );
}
