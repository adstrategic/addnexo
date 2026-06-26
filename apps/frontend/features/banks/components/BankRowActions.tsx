import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { BankResponse } from "../schemas/BankSchema";

interface BankRowActionsProps {
  bank: BankResponse;
  onEdit: (sequence: number) => void;
  onDelete: (sequence: number, nombre: string) => void;
}

export function BankRowActions({
  bank,
  onEdit,
  onDelete,
}: BankRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={`Actions for ${bank.BNombre}`}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          className="cursor-pointer text-amber-600 focus:text-amber-600 dark:text-amber-400 dark:focus:text-amber-400"
          onClick={() => onEdit(bank.BOrgSecuencia)}
        >
          <Pencil
            className="size-4 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => onDelete(bank.BOrgSecuencia, bank.BNombre)}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
