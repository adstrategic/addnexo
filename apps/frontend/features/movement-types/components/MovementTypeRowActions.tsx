import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { TipoMovimiento } from "../types/server-types";

interface MovementTypeRowActionsProps {
  movementType: TipoMovimiento;
  onEdit: (movementType: TipoMovimiento) => void;
  onDelete: (id: number, descripcion: string, sequence: number) => void;
}

export function MovementTypeRowActions({
  movementType,
  onEdit,
  onDelete,
}: MovementTypeRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={`Actions for ${movementType.TDescripcion}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-blue-800 focus:text-blue-800 dark:text-blue-400 dark:focus:text-blue-400"
        >
          <Link
            href={`/movement-types/${movementType.TOrgSecuencia}`}
            className="flex items-center gap-2"
          >
            <Eye
              className="size-4 text-blue-800 dark:text-blue-400"
              aria-hidden
            />
            View details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
          onClick={() => onEdit(movementType)}
        >
          <Pencil
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() =>
            onDelete(
              movementType.TId,
              movementType.TDescripcion,
              movementType.TOrgSecuencia,
            )
          }
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
