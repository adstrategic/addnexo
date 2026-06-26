"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { invoiceApi, invoiceKeys } from "../services/invoices.api";
import type { ReminderConfig } from "../services/invoices.api";
import { RemindStatementDialog } from "./RemindStatementDialog";

export function InvoiceReminderSettings() {
  const [remindStatementOpen, setRemindStatementOpen] = useState(false);
  const queryClient = useQueryClient();
  const reminderConfigKey = invoiceKeys.reminderConfig();

  const { data: reminderConfig, isLoading: isReminderConfigLoading } = useQuery(
    {
      queryKey: reminderConfigKey,
      queryFn: () => invoiceApi.getReminderConfig(),
    },
  );

  const updateReminderConfigMutation = useMutation({
    mutationFn: (patch: Partial<ReminderConfig>) =>
      invoiceApi.updateReminderConfig(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: reminderConfigKey });
      const previous =
        queryClient.getQueryData<ReminderConfig>(reminderConfigKey);
      queryClient.setQueryData(reminderConfigKey, {
        ...previous,
        ...patch,
      });
      return { previous };
    },
    onError: (err, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(reminderConfigKey, context.previous);
      }
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update reminder settings.";
      toast.error(message);
    },
    onSuccess: (data, patch) => {
      queryClient.setQueryData(reminderConfigKey, data);
      if (patch.statementScheduledRemindersEnabled !== undefined) {
        toast.success(
          data.statementScheduledRemindersEnabled
            ? "Auto reminders enabled"
            : "Auto reminders disabled",
          {
            description: data.statementScheduledRemindersEnabled
              ? "Scheduled statement reminders will be sent automatically."
              : "Scheduled statement reminders will not be sent.",
          },
        );
      }
      if (patch.statementClientScope !== undefined) {
        toast.success("Statement recipients updated", {
          description:
            data.statementClientScope === "balance"
              ? "Statements will be sent to all clients with an outstanding balance."
              : "Statements will be sent only to clients with at least one overdue invoice.",
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reminderConfigKey });
    },
  });

  const isUpdating =
    isReminderConfigLoading || updateReminderConfigMutation.isPending;

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Label
          htmlFor="auto-reminders-switch"
          className="cursor-pointer text-sm whitespace-nowrap"
        >
          Auto reminders
        </Label>
        <Switch
          id="auto-reminders-switch"
          checked={reminderConfig?.statementScheduledRemindersEnabled ?? false}
          onCheckedChange={(checked) =>
            updateReminderConfigMutation.mutate({
              statementScheduledRemindersEnabled: checked,
            })
          }
          disabled={isUpdating}
          aria-label="Toggle automatic statement reminders"
        />
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Label
          htmlFor="client-scope-switch"
          className="cursor-pointer text-sm whitespace-nowrap"
        >
          {reminderConfig?.statementClientScope === "balance"
            ? "All with balance"
            : "Overdue only"}
        </Label>
        <Switch
          id="client-scope-switch"
          checked={
            (reminderConfig?.statementClientScope ?? "overdue") === "balance"
          }
          onCheckedChange={(checked) =>
            updateReminderConfigMutation.mutate({
              statementClientScope: checked ? "balance" : "overdue",
            })
          }
          disabled={isUpdating}
          aria-label="Toggle statement recipient scope"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="cursor-pointer"
        onClick={() => setRemindStatementOpen(true)}
      >
        Remind statement
      </Button>

      <RemindStatementDialog
        open={remindStatementOpen}
        onOpenChange={setRemindStatementOpen}
      />
    </>
  );
}
