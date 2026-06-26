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
import { cn, getPageNumbers } from "@/lib/utils";
import type { Producto } from "../types/server-types";
import { catalogListPadding } from "./layout/catalog-list-layout";
import { CatalogEmptyState } from "./CatalogEmptyState";
import { CatalogMobileCard } from "./CatalogMobileCard";
import { CatalogRowActions } from "./CatalogRowActions";
import { CatalogTableSkeleton } from "./CatalogTableSkeleton";

interface ProductTableProps {
  productos: Producto[];
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

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function CatalogPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  ProductTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        catalogListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "product" : "products"}
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

export const ProductTable = ({
  productos,
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
}: ProductTableProps) => {
  if (isLoading) {
    return <CatalogTableSkeleton />;
  }

  if (productos.length === 0) {
    return (
      <CatalogEmptyState
        hasFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />
    );
  }

  return (
    <div className={cn("relative", isFetching && "opacity-70 transition-opacity")}>
      <div className={cn("space-y-3 py-4 md:hidden", catalogListPadding.x)}>
        {productos.map((producto) => (
          <CatalogMobileCard
            key={producto.CKId}
            product={producto}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", catalogListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Product</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>VAT</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => (
                <TableRow
                  key={producto.CKId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/catalog/${producto.CKOrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {producto.CKDescripcion}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Code {producto.CKCodigo}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p>{producto.grupo.GDescripcion}</p>
                      <p className="text-muted-foreground">
                        Group {producto.grupo.GNro}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {producto.origenPais?.nombre ?? `#${producto.CKOrigenId}`}
                  </TableCell>
                  <TableCell>{producto.unidadDeMedida.UMNombre}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {formatPrice(producto.CKPrecioPublico)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Sale {formatPrice(producto.CKPrecioVenta1)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {producto.CKExento ? (
                      <Badge variant="secondary">Exempt</Badge>
                    ) : (
                      <span>{producto.CKIva}%</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-0">
                    <CatalogRowActions
                      sequence={producto.CKOrgSecuencia}
                      product={producto}
                      productName={producto.CKDescripcion}
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

      <CatalogPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
};
