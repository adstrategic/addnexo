"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatchOrders } from "../hooks/useDispatchOrders";
import { useDispatchOrderDelete } from "../hooks/useDispatchOrderDelete";
import { DispatchOrdersTable } from "./DispatchOrdersTable";
import { DispatchOrderFilter } from "./DispatchOrderFilter";
import { DispatchOrderActions } from "./DispatchOrderActions";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { useTabState } from "@/hooks/useTabState";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";

export function DispatchOrdersContent() {
  // URL parameter management hooks
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "all",
    resetPaginationOnChange: true,
  });

  const dispatchOrderDelete = useDispatchOrderDelete();

  // Lazy loading: Only execute query for the active tab
  // When switching tabs, the new query runs and previous data stays in cache
  const isAllTab = selectedTab === "all";
  const isUnissuedTab = selectedTab === "unissued";
  const isIssuedTab = selectedTab === "issued";
  const isDispatchedTab = selectedTab === "dispatched";

  const {
    data: allData,
    error: allError,
    isFetching: isFetchingAll,
  } = useDispatchOrders({
    page: currentPage,
    search: debouncedSearch || undefined,
    enabled: isAllTab, // Only fetch when this tab is active
  });

  const {
    data: unissuedData,
    error: unissuedError,
    isFetching: isFetchingUnissued,
  } = useDispatchOrders({
    page: currentPage,
    estado: "DRAFT",
    search: debouncedSearch || undefined,
    enabled: isUnissuedTab, // Only fetch when this tab is active
  });

  const {
    data: issuedData,
    error: issuedError,
    isFetching: isFetchingIssued,
  } = useDispatchOrders({
    page: currentPage,
    estado: "EMITTED",
    search: debouncedSearch || undefined,
    enabled: isIssuedTab, // Only fetch when this tab is active
  });

  const {
    data: dispatchedData,
    error: dispatchedError,
    isFetching: isFetchingDispatched,
  } = useDispatchOrders({
    page: currentPage,
    estado: "DISPATCHED",
    search: debouncedSearch || undefined,
    enabled: isDispatchedTab, // Only fetch when this tab is active
  });

  // Select active tab data
  const activeData = isAllTab
    ? allData
    : isUnissuedTab
      ? unissuedData
      : isIssuedTab
        ? issuedData
        : dispatchedData;

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

  // Error handling
  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Dispatch Orders" />;
  }

  return (
    <div className="container mx-auto flex flex-col gap-4 px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage dispatch orders
          </p>
        </div>

        <DispatchOrderActions />
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="p-4">
          <DispatchOrderFilter
            searchTerm={searchTerm}
            onSearchChange={setSearch}
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
                  value="unissued"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-yellow-500 data-[state=active]:shadow-none rounded-none"
                >
                  Unissued
                </TabsTrigger>
                <TabsTrigger
                  value="issued"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-none"
                >
                  Issued
                </TabsTrigger>
                <TabsTrigger
                  value="dispatched"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Dispatched
                </TabsTrigger>
              </TabsList>
            </div>
            {["all", "unissued", "issued", "dispatched"].map((tab) => (
              <TabsContent value={tab} className="p-0" key={tab}>
                <DispatchOrdersTable
                  dispatchOrders={activeData?.data || []}
                  isLoading={activeIsFetching}
                  currentPage={currentPage}
                  totalPages={activeData?.pagination.totalPages || 1}
                  totalItems={activeData?.pagination.totalItems || 0}
                  onPageChange={setPage}
                  onDelete={({ sequence, number }) =>
                    dispatchOrderDelete.openDeleteModal(sequence, number)
                  }
                />
              </TabsContent>
            ))}
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
