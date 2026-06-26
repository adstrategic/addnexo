"use client";

import { useState } from "react";
import { useProductsByGroup } from "../hooks/useGroups";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface GroupProductsListProps {
  groupId: number;
  groupName: string;
}

/** Minimal product shape for list display (backend endpoint not yet available) */
interface ProductRow {
  CKId: number;
  CKCodigo: string;
  CKDescripcion: string;
  CKOrgSecuencia: number;
  CKPrecioPublico?: number;
  CKPrecioVenta1?: number;
  CKIva?: number;
  grupo?: { GDescripcion: string };
}

export function GroupProductsList({
  groupId,
  groupName,
}: GroupProductsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: productsResponse,
    isLoading,
    error,
  } = useProductsByGroup(groupId, {
    page: 1,
    search: searchTerm || undefined,
  });

  const products = (productsResponse?.data ?? []) as ProductRow[];
  const totalItems = productsResponse?.pagination?.totalItems ?? 0;
  const totalPages = productsResponse?.pagination?.totalPages ?? 0;
  const currentPage = 1;

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Products using this Group</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Error loading products. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Products using {groupName}</span>
            </CardTitle>
            <CardDescription>
              {totalItems} product{totalItems !== 1 ? "s" : ""} found
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No products found using this group.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/products">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Public Price</TableHead>
                  <TableHead>Sale Price 1</TableHead>
                  <TableHead>VAT</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.CKId}>
                    <TableCell className="font-medium">
                      {product.CKCodigo}
                    </TableCell>
                    <TableCell>{product.CKDescripcion}</TableCell>
                    <TableCell>{product.grupo?.GDescripcion ?? "—"}</TableCell>
                    <TableCell>${product.CKPrecioPublico ?? "—"}</TableCell>
                    <TableCell>${product.CKPrecioVenta1 ?? "—"}</TableCell>
                    <TableCell>
                      {product.CKIva != null ? `${product.CKIva}%` : "—"}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/catalog/${product.CKOrgSecuencia}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="text-sm text-muted-foreground text-center p-4">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
