"use client";

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
import { MoreHorizontal } from "lucide-react";
import type { AlmacenResponse } from "../schemas/almacenes.schema";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AlmacenTableProps {
  almacenes: AlmacenResponse[];
  isLoading: boolean;
  onEdit: (almacen: AlmacenResponse) => void;
  onDelete: (almacen: AlmacenResponse) => void;
  children?: React.ReactNode;
}

export function AlmacenTable({
  almacenes,
  isLoading,
  onEdit,
  onDelete,
  children,
}: AlmacenTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (almacenes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No warehouses found
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {almacenes.map((almacen) => (
              <TableRow key={almacen.ALId}>
                <TableCell className="font-medium">
                  {almacen.ALNombre}
                </TableCell>
                <TableCell>{almacen.ALResponsable}</TableCell>
                <TableCell>{almacen.ALDireccion}</TableCell>
                <TableCell>{almacen.ALTelefono}</TableCell>
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
                          href={`/warehouses/${almacen.ALOrgSecuencia}`}
                        >
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(almacen)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(almacen)}
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
      {children}
    </div>
  );
}
