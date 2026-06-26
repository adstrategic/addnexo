import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { getPageNumbers, cn } from "@/lib/utils";
import type { VendorResponse } from "../schemas/VendorSchema";
import { vendorListPadding } from "./layout/vendor-list-layout";
import { VendorEmptyState } from "./VendorEmptyState";
import { VendorMobileCard } from "./VendorMobileCard";
import { VendorRowActions } from "./VendorRowActions";
import { VendorTableSkeleton } from "./VendorTableSkeleton";

interface VendorTableProps {
  vendors: VendorResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, description: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function VendorPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  VendorTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        vendorListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "vendor" : "vendors"}
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

export function VendorTable({
  vendors,
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
}: VendorTableProps) {
  if (isLoading) {
    return <VendorTableSkeleton />;
  }

  if (vendors.length === 0) {
    return (
      <VendorEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div
      className={cn("relative", isFetching && "opacity-70 transition-opacity")}
    >
      <div className={cn("space-y-3 py-4 md:hidden", vendorListPadding.x)}>
        {vendors.map((vendor) => (
          <VendorMobileCard
            key={vendor.VId}
            vendor={vendor}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", vendorListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Vendor</TableHead>
                <TableHead>NIT/ID</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow
                  key={vendor.VId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <Link
                      href={`/vendors/${vendor.VOrgSecuencia}`}
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {vendor.VNombre}
                    </Link>
                  </TableCell>
                  <TableCell>{vendor.VNitCedula}</TableCell>
                  <TableCell>
                    {vendor.VTelefono ? (
                      <a
                        href={`tel:${vendor.VTelefono}`}
                        className="text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        {vendor.VTelefono}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.VCorreo ? (
                      <a
                        href={`mailto:${vendor.VCorreo}`}
                        className="block max-w-[200px] truncate text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        {vendor.VCorreo}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="pr-0">
                    <VendorRowActions
                      vendor={vendor}
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

      <VendorPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
