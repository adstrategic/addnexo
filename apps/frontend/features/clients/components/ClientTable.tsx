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
import type { ClienteResponse } from "../schemas/ClientSchema";
import { clientListPadding } from "./layout/client-list-layout";
import { ClientEmptyState } from "./ClientEmptyState";
import { ClientMobileCard } from "./ClientMobileCard";
import { ClientRowActions } from "./ClientRowActions";
import { ClientTableSkeleton } from "./ClientTableSkeleton";

interface ClientTableProps {
  clientes: ClienteResponse[];
  isLoading: boolean;
  isFetching?: boolean;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onCreate?: () => void;
}

function ClientPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: Pick<
  ClientTableProps,
  "currentPage" | "totalPages" | "totalItems" | "onPageChange"
>) {
  if (totalItems === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 border-t border-border py-4 sm:flex-row",
        clientListPadding.x,
      )}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages} · {totalItems}{" "}
        {totalItems === 1 ? "client" : "clients"}
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

export function ClientTable({
  clientes,
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
}: ClientTableProps) {
  if (isLoading) {
    return <ClientTableSkeleton />;
  }

  if (clientes.length === 0) {
    return (
      <ClientEmptyState
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
      <div className={cn("space-y-3 py-4 md:hidden", clientListPadding.x)}>
        {clientes.map((cliente) => (
          <ClientMobileCard
            key={cliente.CId}
            client={cliente}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <div className={cn("hidden md:block", clientListPadding.x)}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-0">Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[72px] pr-0">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow
                  key={cliente.CId}
                  className="transition-colors hover:bg-muted/40"
                >
                  <TableCell className="pl-0">
                    <div className="space-y-1">
                      <Link
                        href={`/clients/${cliente.COrgSecuencia}`}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {cliente.CRazonSocial}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        NIT {cliente.CNitCedula}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{cliente.CNombreCliente}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      <p>{cliente.ciudad?.nombre ?? "—"}</p>
                      <p className="text-muted-foreground">
                        {cliente.ciudad?.estado?.pais?.nombre ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cliente.CTelefono1 ? (
                      <a
                        href={`tel:${cliente.CTelefono1}`}
                        className="text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        {cliente.CTelefono1}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {cliente.CCorreo1 ? (
                      <a
                        href={`mailto:${cliente.CCorreo1}`}
                        className="block max-w-[200px] truncate text-sm text-primary transition-colors hover:text-primary/80"
                      >
                        {cliente.CCorreo1}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="pr-0">
                    <ClientRowActions
                      client={cliente}
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

      <ClientPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
      />
    </div>
  );
}
