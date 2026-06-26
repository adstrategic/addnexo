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

import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Producto } from "../types/server-types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { TablePagination } from "@/components/shared/TablePagination";

interface ProductTableProps {
  productos: Producto[];
  isLoading: boolean;
  onEdit: (producto: Producto) => void;
  onDelete: (id: number, descripcion: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const ProductTable = ({
  productos,
  isLoading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: ProductTableProps) => {
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

  if (productos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Public Price</TableHead>
              <TableHead>Sale Price 1</TableHead>
              <TableHead>VAT</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.CKId}>
                <TableCell>
                  {producto.grupo.GNro} - {producto.grupo.GDescripcion}
                </TableCell>
                <TableCell className="font-medium">
                  {producto.CKCodigo}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{producto.CKDescripcion}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {producto.origenPais?.nombre ?? `#${producto.CKOrigenId}`}
                </TableCell>
                <TableCell>{producto.unidadDeMedida.UMNombre}</TableCell>
                <TableCell>${producto.CKPrecioPublico}</TableCell>
                <TableCell>${producto.CKPrecioVenta1}</TableCell>
                <TableCell>{producto.CKIva}%</TableCell>
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
                          href={`/catalog/${producto.CKOrgSecuencia}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(producto)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() =>
                          onDelete(producto.CKId, producto.CKDescripcion)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange}
        emptyMessage="No products found"
        itemLabel="products"
      />
    </div>
  );
};
