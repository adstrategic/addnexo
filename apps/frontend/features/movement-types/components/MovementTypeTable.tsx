import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import { TipoMovimiento } from "../types/server-types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPageNumbers } from "@/lib/utils";
import {
  getMovementTypeDescription,
  getBooleanBadgeVariant,
  getBooleanDisplayText,
} from "../lib/utils";

interface MovementTypeTableProps {
  tiposMovimiento: TipoMovimiento[];
  isLoading: boolean;
  onEdit: (tipoMovimiento: TipoMovimiento) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const MovementTypeTable = ({
  tiposMovimiento,
  isLoading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: MovementTypeTableProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tiposMovimiento.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No movement types found
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead>Affects</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tiposMovimiento.map((tipoMovimiento) => (
              <TableRow key={tipoMovimiento.TId}>
                <TableCell>
                  {getMovementTypeDescription(tipoMovimiento.TTipo)}
                </TableCell>
                <TableCell>{tipoMovimiento.TClase}</TableCell>
                <TableCell>{tipoMovimiento.TDescripcion}</TableCell>
                <TableCell>{tipoMovimiento.TAbreviatura}</TableCell>
                <TableCell>
                  <Badge
                    variant={getBooleanBadgeVariant(tipoMovimiento.TAfecta)}
                  >
                    {getBooleanDisplayText(tipoMovimiento.TAfecta)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getBooleanBadgeVariant(tipoMovimiento.TPedido)}
                  >
                    {getBooleanDisplayText(tipoMovimiento.TPedido)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getBooleanBadgeVariant(tipoMovimiento.TFactura)}
                  >
                    {getBooleanDisplayText(tipoMovimiento.TFactura)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getBooleanBadgeVariant(tipoMovimiento.TProv)}
                  >
                    {getBooleanDisplayText(tipoMovimiento.TProv)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          className="text-green-800"
                          href={`/movement-types/${tipoMovimiento.TOrgSecuencia}`}
                        >
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(tipoMovimiento)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() =>
                          onDelete(
                            tipoMovimiento.TId,
                            tipoMovimiento.TDescripcion,
                            tipoMovimiento.TOrgSecuencia
                          )
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col-reverse gap-4 items-center justify-center p-4">
        <div className="text-sm text-muted-foreground">
          {totalItems === 0 ? (
            "No movement types found"
          ) : (
            <>
              Showing page {currentPage} of {totalPages}
            </>
          )}
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(currentPage - 1)}
                className={
                  currentPage <= 1 || totalPages <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {getPageNumbers(totalPages, currentPage).map((page, index) => (
              <PaginationItem key={index}>
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
                className={
                  currentPage >= totalPages || totalPages <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
