"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useBanks } from "../hooks/useBanks";
import { useBankManager } from "../hooks/useBankManager";
import { useBankDelete } from "../hooks/useBankDelete";
import { BankTable } from "./BankTable";
import { BankFilter } from "./BankFilter";
import { BankActions } from "./BankActions";
import { ErrorBoundary } from "@/components/error-boundary";
import { EntityDeleteModal } from "@/components/shared/EntityDeleteModal";
import { BankFormModal } from "../forms/BankFormModal";
import { useDebouncedTableParams } from "@/hooks/useDebouncedTableParams";

export function BankContent() {
  const { currentPage, setPage, debouncedSearch, searchTerm, setSearch } =
    useDebouncedTableParams();

  const bankManager = useBankManager();
  const bankDelete = useBankDelete();

  const { data, isLoading, error } = useBanks({
    page: currentPage,
    search: debouncedSearch || undefined,
  });

  if (error) {
    return <ErrorBoundary error={error} entityName="Banks" />;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banks</h1>
          <p className="text-sm text-muted-foreground">
            Manage banks for payment methods (transfer, check, wallet, credit
            card)
          </p>
        </div>
        <BankActions onOpenCreateModal={bankManager.openCreate} />
      </div>

      <Card>
        <CardHeader className="p-4">
          <BankFilter searchTerm={searchTerm} onSearchChange={setSearch} />
        </CardHeader>
        <CardContent className="p-0">
          <BankTable
            banks={data?.data ?? []}
            isLoading={isLoading}
            onEdit={bankManager.openEdit}
            onDelete={bankDelete.openDeleteModal}
            currentPage={currentPage}
            totalPages={data?.pagination?.totalPages ?? 1}
            totalItems={data?.pagination?.totalItems ?? 0}
            onPageChange={setPage}
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
