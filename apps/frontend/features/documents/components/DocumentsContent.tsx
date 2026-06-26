"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTable } from "./DocumentsTable";
import { ErrorBoundary } from "@/components/error-boundary";
import { useTabState } from "@/hooks/useTabState";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";
import {
  useDocumentsByType,
} from "../hooks/useDocuments";
import type { DocumentType } from "../types/documents-types";

export function DocumentsContent() {
  // URL parameter management hooks
  const { currentPage, setPage } = useDebouncedTableParams();

  const { selectedTab, setTab } = useTabState({
    defaultValue: "dispatch-order",
    resetPaginationOnChange: true,
  });

  // Lazy loading: Only execute query for the active tab
  const isDispatchOrderTab = selectedTab === "dispatch-order";
  const isPurchaseOrderTab = selectedTab === "purchase-order";
  const isInvoiceTab = selectedTab === "invoice";

  const {
    data: dispatchOrderData,
    error: dispatchOrderError,
    isFetching: isFetchingDispatchOrder,
  } = useDocumentsByType(
    "dispatch-order",
    currentPage,
    50,
    isDispatchOrderTab
  );

  const {
    data: purchaseOrderData,
    error: purchaseOrderError,
    isFetching: isFetchingPurchaseOrder,
  } = useDocumentsByType(
    "purchase-order",
    currentPage,
    50,
    isPurchaseOrderTab
  );

  const {
    data: invoiceData,
    error: invoiceError,
    isFetching: isFetchingInvoice,
  } = useDocumentsByType("invoice", currentPage, 50, isInvoiceTab);

  // Select active tab data
  const activeData =
    isDispatchOrderTab
      ? dispatchOrderData
      : isPurchaseOrderTab
      ? purchaseOrderData
      : invoiceData;
  const activeIsFetching =
    isDispatchOrderTab
      ? isFetchingDispatchOrder
      : isPurchaseOrderTab
      ? isFetchingPurchaseOrder
      : isFetchingInvoice;
  const activeError =
    isDispatchOrderTab
      ? dispatchOrderError
      : isPurchaseOrderTab
      ? purchaseOrderError
      : invoiceError;

  // Error handling
  if (activeError) {
    return (
      <ErrorBoundary error={activeError} entityName="Documents" />
    );
  }

  const totalPages = activeData
    ? Math.ceil(activeData.total / 50)
    : 1;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Manage documents for dispatch orders, purchase orders, and invoices
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          <Tabs className="w-full" value={selectedTab} onValueChange={setTab}>
            <div className="border-b px-4">
              <TabsList className="bg-transparent">
                <TabsTrigger
                  value="dispatch-order"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none"
                >
                  Dispatch Orders
                </TabsTrigger>
                <TabsTrigger
                  value="purchase-order"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-600 data-[state=active]:shadow-none rounded-none"
                >
                  Purchase Orders
                </TabsTrigger>
                <TabsTrigger
                  value="invoice"
                  className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:shadow-none rounded-none"
                >
                  Invoices
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dispatch-order" className="p-0">
              <DocumentsTable
                documents={activeData?.documents || []}
                isLoading={activeIsFetching}
                documentType="dispatch-order"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activeData?.total || 0}
                onPageChange={setPage}
              />
            </TabsContent>

            <TabsContent value="purchase-order" className="p-0">
              <DocumentsTable
                documents={activeData?.documents || []}
                isLoading={activeIsFetching}
                documentType="purchase-order"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activeData?.total || 0}
                onPageChange={setPage}
              />
            </TabsContent>

            <TabsContent value="invoice" className="p-0">
              <DocumentsTable
                documents={activeData?.documents || []}
                isLoading={activeIsFetching}
                documentType="invoice"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activeData?.total || 0}
                onPageChange={setPage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


























