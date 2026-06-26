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
import type { VendorResponse } from "../schemas/VendorSchema";

interface VendorRowActionsProps {
  vendor: VendorResponse;
  onEdit: (sequence: number) => void;
  onDelete: (id: number, description: string) => void;
}

export function VendorRowActions({
  vendor,
  onEdit,
  onDelete,
}: VendorRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={`Actions for ${vendor.VNombre}`}
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
            href={`/vendors/${vendor.VOrgSecuencia}`}
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
          onClick={() => onEdit(vendor.VOrgSecuencia)}
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
          onClick={() => onDelete(vendor.VId, vendor.VNombre)}
        >
          <Trash2 className="size-4" aria-hidden />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
