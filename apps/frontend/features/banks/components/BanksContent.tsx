"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useBanks } from "../hooks/useBanks";
import { useBankManager } from "../hooks/useBankManager";
import { useBankDelete } from "../hooks/useBankDelete";
import { useBankListParams } from "../hooks/useBankListParams";
import { BankTable } from "./BankTable";
import { BankListToolbar } from "./BankListToolbar";
import { BankActions } from "./BankActions";
import { BankPageHeader } from "./layout/BankPageHeader";
import { bankListPadding } from "./layout/bank-list-layout";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { BankFormModal } from "../forms/BankFormModal";

export function BanksContent() {
  const {
    currentPage,
    setPage,
    debouncedSearch,
    searchTerm,
    setSearch,
    clearFilters,
    hasActiveFilters,
  } = useBankListParams();

  const bankManager = useBankManager();
  const bankDelete = useBankDelete();

  const { data, isLoading, isFetching, error } = useBanks({
    page: currentPage,
    search: debouncedSearch,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Banks" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <BankPageHeader
        title="Banks"
        description="Manage banks for payment methods (transfer, check, wallet, credit card)"
        actions={<BankActions onOpenCreateModal={bankManager.openCreate} />}
      />

      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="space-y-0 p-0">
          <div className={`border-b border-border ${bankListPadding.toolbar}`}>
            <BankListToolbar
              searchTerm={searchTerm}
              onSearchChange={setSearch}
            />
          </div>

          <BankTable
            banks={data?.data ?? []}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
            onEdit={bankManager.openEdit}
            onDelete={bankDelete.openDeleteModal}
            currentPage={currentPage}
            totalPages={data?.pagination?.totalPages ?? 1}
            totalItems={data?.pagination?.totalItems ?? 0}
            onPageChange={setPage}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            onCreate={bankManager.openCreate}
          />
        </CardContent>
      </Card>

      <BankFormModal
        isOpen={bankManager.isOpen}
        onClose={bankManager.close}
        mode={bankManager.mode}
        form={bankManager.form}
        onSubmit={bankManager.onSubmit}
        isLoading={bankManager.isMutating}
        isLoadingBank={bankManager.isLoadingBank}
        bankError={bankManager.bankError}
      />

      <EntityDeleteModal
        isOpen={bankDelete.isDeleteModalOpen}
        onClose={bankDelete.closeDeleteModal}
        onConfirm={bankDelete.handleDeleteConfirm}
        entity="bank"
        entityName={bankDelete.bankAEliminar?.nombre ?? ""}
        isDeleting={bankDelete.isDeleting}
      />
    </div>
  );
}
