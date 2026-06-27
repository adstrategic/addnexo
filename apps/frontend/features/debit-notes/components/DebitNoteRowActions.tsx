import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal } from "lucide-react";
import type { DebitNoteResponse } from "../schemas/debit-note-response.schema";

interface DebitNoteRowActionsProps {
  note: DebitNoteResponse;
}

export function DebitNoteRowActions({ note }: DebitNoteRowActionsProps) {
  const label = `Actions for debit note ${note.MCNroDocumento}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 cursor-pointer"
          aria-label={label}
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
            href={`/debit-notes/${note.MCSecuencia}`}
            className="flex items-center gap-2"
          >
            <Eye
              className="size-4 text-blue-800 dark:text-blue-400"
              aria-hidden
            />
            View details
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
