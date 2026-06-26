"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useDispatchOrders } from "../hooks/useDispatchOrders";
import { useDispatchOrderDelete } from "../hooks/useDispatchOrderDelete";
import { useDispatchOrderListParams } from "../hooks/useDispatchOrderListParams";
import { DispatchOrdersTable } from "./DispatchOrdersTable";
import { DispatchOrderListToolbar } from "./DispatchOrderListToolbar";
import { DispatchOrderActions } from "./DispatchOrderActions";
import { DispatchOrderStatusTabs } from "./DispatchOrderStatusTabs";
import { DispatchOrderPageHeader } from "./layout/DispatchOrderPageHeader";
import { dispatchOrderListPadding } from "./layout/dispatch-order-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";

export function DispatchOrdersContent() {
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
  } = useDispatchOrderListParams();

  const dispatchOrderDelete = useDispatchOrderDelete();

  const isAllTab = selectedTab === "all";
  const isUnissuedTab = selectedTab === "unissued";
  const isIssuedTab = selectedTab === "issued";
  const isDispatchedTab = selectedTab === "dispatched";

  const {
    data: allData,
    error: allError,
    isLoading: isLoadingAll,
    isFetching: isFetchingAll,
  } = useDispatchOrders({
    page: currentPage,
    search: debouncedSearch,
    enabled: isAllTab,
  });

  const {
    data: unissuedData,
    error: unissuedError,
    isLoading: isLoadingUnissued,
    isFetching: isFetchingUnissued,
  } = useDispatchOrders({
    page: currentPage,
    estado: "DRAFT",
    search: debouncedSearch,
    enabled: isUnissuedTab,
  });

  const {
    data: issuedData,
    error: issuedError,
    isLoading: isLoadingIssued,
    isFetching: isFetchingIssued,
  } = useDispatchOrders({
    page: currentPage,
    estado: "EMITTED",
    search: debouncedSearch,
    enabled: isIssuedTab,
  });

  const {
    data: dispatchedData,
    error: dispatchedError,
    isLoading: isLoadingDispatched,
    isFetching: isFetchingDispatched,
  } = useDispatchOrders({
    page: currentPage,
    estado: "DISPATCHED",
    search: debouncedSearch,
    enabled: isDispatchedTab,
  });

  const activeData = isAllTab
    ? allData
    : isUnissuedTab
      ? unissuedData
      : isIssuedTab
        ? issuedData
        : dispatchedData;

  const activeIsLoading = isAllTab
    ? isLoadingAll
    : isUnissuedTab
      ? isLoadingUnissued
      : isIssuedTab
        ? isLoadingIssued
        : isLoadingDispatched;

  const activeIsFetching = isAllTab
    ? isFetchingAll
    : isUnissuedTab
      ? isFetchingUnissued
      : isIssuedTab
        ? isFetchingIssued
        : isFetchingDispatched;

  const activeError = isAllTab
    ? allError
    : isUnissuedTab
      ? unissuedError
      : isIssuedTab
        ? issuedError
        : dispatchedError;

  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Dispatch Orders" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <DispatchOrderPageHeader
        title="Dispatch Orders"
        description="Manage outbound shipments from draft through dispatch"
        actions={<DispatchOrderActions />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${dispatchOrderListPadding.toolbar}`}
          >
            <DispatchOrderListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div
              className={`overflow-x-auto border-b border-border ${dispatchOrderListPadding.toolbar}`}
            >
              <DispatchOrderStatusTabs />
            </div>

            <TabsContent value={selectedTab} className="mt-0 p-0">
              <DispatchOrdersTable
                dispatchOrders={activeData?.data ?? []}
                isLoading={activeIsLoading}
                isFetching={activeIsFetching && !activeIsLoading}
                currentPage={currentPage}
                totalPages={activeData?.pagination.totalPages ?? 1}
                totalItems={activeData?.pagination.totalItems ?? 0}
                onPageChange={setPage}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                onDelete={({ sequence, number }) =>
                  dispatchOrderDelete.openDeleteModal(sequence, number)
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EntityDeleteModal
        isOpen={dispatchOrderDelete.isDeleteModalOpen}
        onClose={dispatchOrderDelete.closeDeleteModal}
        onConfirm={dispatchOrderDelete.handleDeleteConfirm}
        entity="dispatch order"
        entityName={`Dispatch Order #${dispatchOrderDelete.dispatchOrderAEliminar?.number ?? ""}`}
        isDeleting={dispatchOrderDelete.isDeleting}
      />
    </div>
  );
}
