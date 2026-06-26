"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useInvoices } from "../hooks/useInvoices";
import { useInvoiceListParams } from "../hooks/useInvoiceListParams";
import { InvoicesTable } from "./InvoicesTable";
import { InvoiceListToolbar } from "./InvoiceListToolbar";
import { InvoiceStatusTabs } from "./InvoiceStatusTabs";
import { InvoiceReminderSettings } from "./InvoiceReminderSettings";
import { InvoicePageHeader } from "./layout/InvoicePageHeader";
import { invoiceListPadding } from "./layout/invoice-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EstadoInvoice } from "../schemas/invoices-response.schema";

export function InvoicesContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    selectedTab,
    setTab,
    dateRange,
    dateFrom,
    dateTo,
    setDateRange,
    clearFilters,
    hasActiveFilters,
  } = useInvoiceListParams();

  const isAllTab = selectedTab === "all";
  const isActiveTab = selectedTab === "active";
  const isPaidTab = selectedTab === "paid";
  const isOverdueTab = selectedTab === "overdue";
  const isAnulatedTab = selectedTab === "anulated";

  const listParams = {
    page: currentPage,
    search: debouncedSearch,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  const {
    data: allData,
    error: allError,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
  } = useInvoices({ ...listParams, enabled: isAllTab });

  const {
    data: activeInvoiceData,
    error: activeInvoiceError,
    isLoading: isLoadingActive,
    isFetching: isFetchingActive,
  } = useInvoices({
    ...listParams,
    estado: EstadoInvoice.ACTIVE,
    enabled: isActiveTab,
  });

  const {
    data: paidInvoiceData,
    error: paidInvoiceError,
    isLoading: isLoadingPaid,
    isFetching: isFetchingPaid,
  } = useInvoices({
    ...listParams,
    estado: EstadoInvoice.PAID,
    enabled: isPaidTab,
  });

  const {
    data: overdueInvoiceData,
    error: overdueInvoiceError,
    isLoading: isLoadingOverdue,
    isFetching: isFetchingOverdue,
  } = useInvoices({
    ...listParams,
    estado: EstadoInvoice.OVERDUE,
    enabled: isOverdueTab,
  });

  const {
    data: anulatedInvoiceData,
    error: anulatedInvoiceError,
    isLoading: isLoadingAnulated,
    isFetching: isFetchingAnulated,
  } = useInvoices({
    ...listParams,
    estado: EstadoInvoice.ANULATED,
    enabled: isAnulatedTab,
  });

  const activeData = isAllTab
    ? allData
    : isActiveTab
      ? activeInvoiceData
      : isPaidTab
        ? paidInvoiceData
        : isOverdueTab
          ? overdueInvoiceData
          : anulatedInvoiceData;

  const activeIsLoading = isAllTab
    ? isLoadingAll
    : isActiveTab
      ? isLoadingActive
      : isPaidTab
        ? isLoadingPaid
        : isOverdueTab
          ? isLoadingOverdue
          : isLoadingAnulated;

  const activeIsFetching = isAllTab
    ? isFetchingAll
    : isActiveTab
      ? isFetchingActive
      : isPaidTab
        ? isFetchingPaid
        : isOverdueTab
          ? isFetchingOverdue
          : isFetchingAnulated;

  const activeError = isAllTab
    ? allError
    : isActiveTab
      ? activeInvoiceError
      : isPaidTab
        ? paidInvoiceError
        : isOverdueTab
          ? overdueInvoiceError
          : anulatedInvoiceError;

  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Invoices" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <InvoicePageHeader
        title="Invoices"
        description="Track billing, payments, and account receivables"
        actions={<InvoiceReminderSettings />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${invoiceListPadding.toolbar}`}
          >
            <InvoiceListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div
              className={`overflow-x-auto border-b border-border ${invoiceListPadding.toolbar}`}
            >
              <InvoiceStatusTabs />
            </div>

            <TabsContent value={selectedTab} className="mt-0 p-0">
              <InvoicesTable
                invoices={activeData?.data ?? []}
                isLoading={activeIsLoading}
                isFetching={activeIsFetching && !activeIsLoading}
                currentPage={currentPage}
                totalPages={activeData?.pagination.totalPages ?? 1}
                totalItems={activeData?.pagination.totalItems ?? 0}
                onPageChange={setPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
