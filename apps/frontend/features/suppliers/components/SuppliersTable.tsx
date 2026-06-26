import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { getPageNumbers } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SupplierResponse } from "../schemas/SupplierSchemas";
import { supplierListPadding } from "./layout/supplier-list-layout";
import { SupplierEmptyState } from "./SupplierEmptyState";
import { SupplierMobileCard } from "./SupplierMobileCard";
import { SupplierRowActions } from "./SupplierRowActions";
import { SupplierTableSkeleton } from "./SupplierTableSkeleton";

interface SupplierTableProps {
  proveedores: SupplierResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (supplier: SupplierResponse) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function SupplierPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  SupplierTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        supplierListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "supplier" : "suppliers"}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(currentPage - 1)}
              className={cn(
                "cursor-pointer",
                (currentPage <= 1 || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>

          {getPageNumbers(totalPages, currentPage).map((page, index) => (
            <PaginationItem key={index} className="hidden sm:list-item">
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => onPageChange(page as number)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(currentPage + 1)}
              className={cn(
                "cursor-pointer",
                (currentPage >= totalPages || totalPages <= 1) &&
                  "pointer-events-none opacity-50",
              )}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export function SupplierTable({
  proveedores,
  isLoading,
  isFetching = false,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  hasActiveFilters,
  onClearFilters,
  onCreate,
}: SupplierTableProps) {
  if (isLoading) {
    return <SupplierTableSkeleton />;
  }

  if (proveedores.length === 0) {
    return (
      <SupplierEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className={cn("relative", isFetching && "opacity-70 transition-opacity")}>
      <div className={cn("space-y-3 py-4 md:hidden", supplierListPadding.x)}>
        {proveedores.map((proveedor) => (
          <SupplierMobileCard
            key={proveedor.MPId}
            supplier={proveedor}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", supplierListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Supplier</TableHead>
                <TableHead>Responsible</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proveedores.map((proveedor) => (
                <TableRow
                  key={proveedor.MPId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/suppliers/${proveedor.MPOrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {proveedor.MPDescripcion}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>NIT {proveedor.MPNro}</span>
                        {proveedor.MPRetencion === "SI" ? (
                          <Badge variant="secondary">Withholding</Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{proveedor.MPResponsable}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p>{proveedor.ciudad?.nombre}</p>
                      <p className="text-muted-foreground">
                        {proveedor.ciudad?.estado?.pais?.nombre}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <a
                        href={`tel:${proveedor.MPTelefono1}`}
                        className="block text-primary transition-colors hover:text-primary/80"
                      >
                        {proveedor.MPTelefono1}
                      </a>
                      <a
                        href={`mailto:${proveedor.MPCorreo1}`}
                        className="block truncate text-muted-foreground transition-colors hover:text-primary"
                      >
                        {proveedor.MPCorreo1}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="pr-0">
                    <SupplierRowActions
                      sequence={proveedor.MPOrgSecuencia}
                      supplier={proveedor}
                      supplierName={proveedor.MPDescripcion}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <SupplierPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
