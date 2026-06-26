"use client";

import { useEffect, useState } from "react";
import { type DefaultValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type CreateGroupDto,
  type UpdateGroupDto,
  createGroupSchema,
} from "../schemas/groups.schema";
import { useGroupActions } from "./useGroupActions";
import { useGroupBySequence } from "./useGroups";
import { useDirtyFields } from "@/hooks/useDirtyValues";
import { useFormScroll } from "@/hooks/useFormScroll";
import { handleMutationError } from "@/lib/errors/handle-error";

interface UseGroupManagerOptions {
  onAfterSubmit?: () => void;
  mode?: "create" | "edit";
  sequence?: number;
}

export function useGroupManager(options?: UseGroupManagerOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">(
    options?.mode ?? "create",
  );
  const [groupSequence, setGroupSequence] = useState<number | null>(
    options?.mode === "edit" && options?.sequence != null
      ? options.sequence
      : null,
  );

  const {
    data: existingGroup,
    isLoading: isLoadingGroup,
    error: groupError,
  } = useGroupBySequence(
    groupSequence ?? 0,
    mode === "edit" && !!groupSequence,
  );

  const defaultValues: DefaultValues<CreateGroupDto> = {
    GDescripcion: "",
  };

  const form = useForm<CreateGroupDto>({
    resolver: zodResolver(createGroupSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });
  const actions = useGroupActions(form.setError);

  const getFormValues = (): CreateGroupDto | undefined => {
    if (mode === "edit" && existingGroup) {
      return {
        GDescripcion: existingGroup.GDescripcion,
        GNro: existingGroup.GNro,
      };
    }
    return undefined;
  };

  useEffect(() => {
    if (mode === "edit" && existingGroup) {
      form.reset(getFormValues());
    }
  }, [existingGroup, mode, form]);

  const { getDirtyValues } = useDirtyFields(form);
  const { scrollToField } = useFormScroll();

  const openCreate = () => {
    setMode("create");
    setGroupSequence(null);
    form.reset(defaultValues);
    setIsOpen(true);
  };

  const openEdit = (sequence: number) => {
    setMode("edit");
    setGroupSequence(sequence);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setGroupSequence(null);
  };

  const processFormData = (data: CreateGroupDto) => {
    return mode === "edit" ? getDirtyValues(data) : data;
  };

  const onSuccessCallback = () => {
    close();
    options?.onAfterSubmit?.();
  };

  const onSubmit = form.handleSubmit(
    (data) => {
      const apiData = processFormData(data);

      if (mode === "edit") {
        if (!existingGroup) {
          handleMutationError(new Error("No group data loaded"));
          return;
        }
        actions.handleUpdate(existingGroup.GId, apiData as UpdateGroupDto, {
          onSuccess: onSuccessCallback,
        });
      } else {
        actions.handleCreate(apiData as CreateGroupDto, {
          onSuccess: onSuccessCallback,
        });
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        scrollToField(firstErrorField);
      }
    },
  );

  return {
    isOpen,
    mode,
    openCreate,
    openEdit,
    close,
    group: existingGroup,
    isLoadingGroup,
    groupError,
    form,
    onSubmit,
    isMutating: actions.isMutating,
  };
}
