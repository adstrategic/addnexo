"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { EstadoInvoice } from "@/features/invoices/schemas/invoices-response.schema";
import { useDebitNotes } from "../hooks/useDebitNotes";
import { useDebitNoteListParams } from "../hooks/useDebitNoteListParams";
import { DebitNoteTable } from "./DebitNoteTable";
import { DebitNoteListToolbar } from "./DebitNoteListToolbar";
import { DebitNoteStatusTabs } from "./DebitNoteStatusTabs";
import { DebitNotePageHeader } from "./layout/DebitNotePageHeader";
import { debitNoteListPadding } from "./layout/debit-note-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";

export function DebitNoteContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    selectedTab,
    setTab,
    clearFilters,
    hasActiveFilters,
  } = useDebitNoteListParams();

  const isAllTab = selectedTab === "all";
  const isActiveTab = selectedTab === "active";
  const isPaidTab = selectedTab === "paid";
  const isOverdueTab = selectedTab === "overdue";
  const isAnulatedTab = selectedTab === "anulated";

  const listParams = {
    page: currentPage,
    search: debouncedSearch,
  };

  const {
    data: allData,
    error: allError,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
  } = useDebitNotes({ ...listParams, enabled: isAllTab });

  const {
    data: activeData,
    error: activeError,
    isLoading: isLoadingActive,
    isFetching: isFetchingActive,
  } = useDebitNotes({
    ...listParams,
    estado: EstadoInvoice.ACTIVE,
    enabled: isActiveTab,
  });

  const {
    data: paidData,
    error: paidError,
    isLoading: isLoadingPaid,
    isFetching: isFetchingPaid,
  } = useDebitNotes({
    ...listParams,
    estado: EstadoInvoice.PAID,
    enabled: isPaidTab,
  });

  const {
    data: overdueData,
    error: overdueError,
    isLoading: isLoadingOverdue,
    isFetching: isFetchingOverdue,
  } = useDebitNotes({
    ...listParams,
    estado: EstadoInvoice.OVERDUE,
    enabled: isOverdueTab,
  });

  const {
    data: anulatedData,
    error: anulatedError,
    isLoading: isLoadingAnulated,
    isFetching: isFetchingAnulated,
  } = useDebitNotes({
    ...listParams,
    estado: EstadoInvoice.ANULATED,
    enabled: isAnulatedTab,
  });

  const activeListData = isAllTab
    ? allData
    : isActiveTab
      ? activeData
      : isPaidTab
        ? paidData
        : isOverdueTab
          ? overdueData
          : anulatedData;

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

  const activeQueryError = isAllTab
    ? allError
    : isActiveTab
      ? activeError
      : isPaidTab
        ? paidError
        : isOverdueTab
          ? overdueError
          : anulatedError;

  if (activeQueryError) {
    return <ErrorBoundary error={activeQueryError} entityName="Debit Notes" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <DebitNotePageHeader
        title="Debit Notes"
        description="Manage debit notes and additional charges"
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${debitNoteListPadding.toolbar}`}
          >
            <DebitNoteListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div
              className={`overflow-x-auto border-b border-border ${debitNoteListPadding.toolbar}`}
            >
              <DebitNoteStatusTabs />
            </div>

            <TabsContent value={selectedTab} className="mt-0 p-0">
              <DebitNoteTable
                debitNotes={activeListData?.data ?? []}
                isLoading={activeIsLoading}
                isFetching={activeIsFetching && !activeIsLoading}
                currentPage={currentPage}
                totalPages={activeListData?.pagination.totalPages ?? 1}
                totalItems={activeListData?.pagination.totalItems ?? 0}
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
