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
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { TipoMovimiento } from "../types/server-types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";

interface MovementTypeMovementsTableProps {
  sequence: number;
  tipoMovimiento: TipoMovimiento;
}

// TODO: Replace this interface with the actual Movement interface when backend is ready
interface Movement {
  id: number;
  fecha: string;
  cantidad: number;
  producto: string;
  almacen: string;
  tipo: string;
  estado: string;
  // Add more fields as needed
}

export function MovementTypeMovementsTable({
  sequence,
  tipoMovimiento,
}: MovementTypeMovementsTableProps) {
  // TODO: Replace this with actual data fetching when backend is ready
  // const { data: movements, isLoading, error } = useMovementsByType(sequence);

  // Mock data for now - remove when backend is ready
  const movements: Movement[] = [];
  const isLoading = false;
  const error = null;

  // When backend is ready, uncomment this:
  // const { data: movementsData, isLoading, error } = useMovementsByType(sequence);
  // const movements = movementsData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex items-center space-x-4 p-4 border rounded-lg"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error as any) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading movements</p>
        <p className="text-sm text-muted-foreground mt-1">
          {(error as any)?.message || "Failed to load associated movements"}
        </p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle>No movements found</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
            No movements found
          </h3>
          <p className="text-gray-500 mb-4 text-center">
            There are no movements associated with this movement type yet.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Movement Type:</span>
            <Badge variant="outline">{tipoMovimiento.TDescripcion}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* TODO: Add filters and search when backend is ready */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {movements.length} movements
        </div>
        {/* TODO: Add export, bulk actions, etc. when needed */}
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="font-medium">
                  {new Date(movement.fecha).toLocaleDateString()}
                </TableCell>
                <TableCell>{movement.producto}</TableCell>
                <TableCell>{movement.almacen}</TableCell>
                <TableCell>{movement.cantidad}</TableCell>
                <TableCell>
                  <Badge variant="outline">{movement.tipo}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      movement.estado === "completed" ? "default" : "secondary"
                    }
                  >
                    {movement.estado}
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
                          className="text-blue-800"
                          href={`/movements/${movement.id}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
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

      {/* TODO: Add pagination when backend is ready */}
      {movements.length > 10 && (
        <div className="flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">
            Pagination will be implemented when backend is ready
          </p>
        </div>
      )}
    </div>
  );
}
