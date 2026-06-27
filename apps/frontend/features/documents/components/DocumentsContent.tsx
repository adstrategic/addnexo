"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/error-boundary";

import { useDocumentsByType } from "../hooks/useDocuments";
import { useDocumentListParams } from "../hooks/useDocumentListParams";
import { DocumentsTable } from "./DocumentsTable";
import { DocumentListToolbar } from "./DocumentListToolbar";
import { DocumentTypeTabs } from "./DocumentTypeTabs";
import { DocumentPageHeader } from "./layout/DocumentPageHeader";
import { documentListPadding } from "./layout/document-list-layout";

const PAGE_SIZE = 10;

export function DocumentsContent() {
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
  } = useDocumentListParams();

  const isDispatchOrderTab = selectedTab === "dispatch-order";
  const isPurchaseOrderTab = selectedTab === "purchase-order";
  const isInvoiceTab = selectedTab === "invoice";

  const listParams = {
    page: currentPage,
    limit: PAGE_SIZE,
    search: debouncedSearch,
  };

  const {
    data: dispatchOrderData,
    error: dispatchOrderError,
    isLoading: isLoadingDispatchOrder,
    isFetching: isFetchingDispatchOrder,
  } = useDocumentsByType({
    type: "dispatch-order",
    ...listParams,
    enabled: isDispatchOrderTab,
  });

  const {
    data: purchaseOrderData,
    error: purchaseOrderError,
    isLoading: isLoadingPurchaseOrder,
    isFetching: isFetchingPurchaseOrder,
  } = useDocumentsByType({
    type: "purchase-order",
    ...listParams,
    enabled: isPurchaseOrderTab,
  });

  const {
    data: invoiceData,
    error: invoiceError,
    isLoading: isLoadingInvoice,
    isFetching: isFetchingInvoice,
  } = useDocumentsByType({
    type: "invoice",
    ...listParams,
    enabled: isInvoiceTab,
  });

  const activeData = isDispatchOrderTab
    ? dispatchOrderData
    : isPurchaseOrderTab
      ? purchaseOrderData
      : invoiceData;

  const activeIsLoading = isDispatchOrderTab
    ? isLoadingDispatchOrder
    : isPurchaseOrderTab
      ? isLoadingPurchaseOrder
      : isLoadingInvoice;

  const activeIsFetching = isDispatchOrderTab
    ? isFetchingDispatchOrder
    : isPurchaseOrderTab
      ? isFetchingPurchaseOrder
      : isFetchingInvoice;

  const activeError = isDispatchOrderTab
    ? dispatchOrderError
    : isPurchaseOrderTab
      ? purchaseOrderError
      : invoiceError;

  if (activeError) {
    return <ErrorBoundary error={activeError} entityName="Documents" />;
  }

  const totalPages = activeData
    ? Math.max(1, Math.ceil(activeData.total / PAGE_SIZE))
    : 1;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <DocumentPageHeader
        title="Documents"
        description="Browse uploaded files for dispatch orders, purchase orders, and invoices"
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div
            className={`border-b border-border ${documentListPadding.toolbar}`}
          >
            <DocumentListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
              onClearFilters={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div
              className={`overflow-x-auto border-b border-border ${documentListPadding.toolbar}`}
            >
              <DocumentTypeTabs />
            </div>

            <TabsContent value={selectedTab} className="mt-0 p-0">
              <DocumentsTable
                documents={activeData?.documents ?? []}
                isLoading={activeIsLoading}
                isFetching={activeIsFetching && !activeIsLoading}
                documentType={selectedTab}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activeData?.total ?? 0}
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
