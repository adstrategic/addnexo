"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { InvoicesTable } from "./InvoicesTable";
import { InvoicesFilter } from "./InvoicesFilter";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTabState } from "@/hooks/useTabState";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import { useInvoices } from "../hooks/useInvoices";
import { useInvoicesDateRangeParams } from "../hooks/useInvoicesDateRangeParams";
import { invoiceApi, invoiceKeys } from "../services/invoices.api";
import type { ReminderConfig } from "../services/invoices.api";
import { EstadoInvoice } from "../schemas/invoices-response.schema";
import { toast } from "sonner";
import { RemindStatementDialog } from "./RemindStatementDialog";

export function InvoicesContent() {
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

  // URL parameter management hooks
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { dateRange, dateFrom, dateTo, setDateRange } =
    useInvoicesDateRangeParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "all",
    resetPaginationOnChange: true,
  });

  // Lazy loading: Only execute query for the active tab
  // When switching tabs, the new query runs and previous data stays in cache
  const isAllTab = selectedTab === "all";
  const isActiveTab = selectedTab === "active";
  const isPaidTab = selectedTab === "paid";
  const isOverdueTab = selectedTab === "overdue";
  const isAnulatedTab = selectedTab === "anulated";

  const {
    data: allData,
    error: allError,
    isFetching: isFetchingAll,
  } = useInvoices({
    page: currentPage,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    enabled: isAllTab, // Only fetch when this tab is active
  });

  const {
    data: activeInvoiceData,
    error: activeInvoiceError,
    isFetching: isFetchingActiveInvoice,
  } = useInvoices({
    page: currentPage,
    estado: EstadoInvoice.ACTIVE,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    enabled: isActiveTab, // Only fetch when this tab is active
  });

  const {
    data: paidInvoiceData,
    error: paidInvoiceError,
    isFetching: isFetchingPaidInvoice,
  } = useInvoices({
    page: currentPage,
    estado: EstadoInvoice.PAID,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    enabled: isPaidTab, // Only fetch when this tab is active
  });

  const {
    data: overdueInvoiceData,
    error: overdueInvoiceError,
    isFetching: isFetchingOverdueInvoice,
  } = useInvoices({
    page: currentPage,
    estado: EstadoInvoice.OVERDUE,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    enabled: isOverdueTab, // Only fetch when this tab is active
  });

  const {
    data: anulatedInvoiceData,
    error: anulatedInvoiceError,
    isFetching: isFetchingAnulatedInvoice,
  } = useInvoices({
    page: currentPage,
    estado: EstadoInvoice.ANULATED,
    search: debouncedSearch || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    enabled: isAnulatedTab, // Only fetch when this tab is active
  });

  // Select active tab data
  const activeData = isAllTab
    ? allData
    : isActiveTab
      ? activeInvoiceData
      : isPaidTab
        ? paidInvoiceData
        : isOverdueTab
          ? overdueInvoiceData
          : anulatedInvoiceData;

  const activeIsFetching = isAllTab
    ? isFetchingAll
    : isActiveTab
      ? isFetchingActiveInvoice
      : isPaidTab
        ? isFetchingPaidInvoice
        : isOverdueTab
          ? isFetchingOverdueInvoice
          : isFetchingAnulatedInvoice;

  const activeError = isAllTab
    ? allError
    : isActiveTab
      ? activeInvoiceError
      : isPaidTab
        ? paidInvoiceError
        : isOverdueTab
          ? overdueInvoiceError
          : anulatedInvoiceError;

  // Error handling
  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Invoices " />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage invoices</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <Label
              htmlFor="auto-reminders-switch"
              className="text-sm cursor-pointer"
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
              disabled={
                isReminderConfigLoading ||
                updateReminderConfigMutation.isPending
              }
              aria-label="Toggle automatic statement reminders"
            />
          </div>
          <div className="flex items-center gap-2 mr-2">
            <Label
              htmlFor="client-scope-switch"
              className="text-sm cursor-pointer"
            >
              {reminderConfig?.statementClientScope === "balance"
                ? "All with balance"
                : "Overdue only"}
            </Label>
            <Switch
              id="client-scope-switch"
              className="data-[state=checked]:bg-blue-500"
              checked={
                (reminderConfig?.statementClientScope ?? "overdue") ===
                "balance"
              }
              onCheckedChange={(checked) =>
                updateReminderConfigMutation.mutate({
                  statementClientScope: checked ? "balance" : "overdue",
                })
              }
              disabled={
                isReminderConfigLoading ||
                updateReminderConfigMutation.isPending
              }
              aria-label="Toggle statement recipient scope"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRemindStatementOpen(true)}
          >
            Remind statement
          </Button>
        </div>
      </div>

      <RemindStatementDialog
        open={remindStatementOpen}
        onOpenChange={setRemindStatementOpen}
      />

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <InvoicesFilter
            searchTerm={searchTerm}
            onSearchChange={setSearch}
            dateRange={dateRange}
            onDateRangeChange={(from, to) => setDateRange(from, to)}
          />
        </CardHeader>

        <CardContent className="p-0">
          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-none"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:shadow-none rounded-none"
                >
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="paid"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Paid
                </TabsTrigger>
                <TabsTrigger
                  value="overdue"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Overdue
                </TabsTrigger>
                <TabsTrigger
                  value="anulated"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Anulated
                </TabsTrigger>
              </TabsList>
            </div>

            {["all", "active", "paid", "overdue", "anulated"].map((status) => (
              <TabsContent value={status} className="p-0" key={status}>
                {/* TODO(test): remove showTestInvoicePdfDownload before shipping */}
                <InvoicesTable
                  invoices={activeData?.data || []}
                  isLoading={activeIsFetching}
                  currentPage={currentPage}
                  totalPages={activeData?.pagination.totalPages || 1}
                  totalItems={activeData?.pagination.totalItems || 0}
                  onPageChange={setPage}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
