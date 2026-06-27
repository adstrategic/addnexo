import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import type { DocumentType } from "../schemas/documents-response.schema";

interface DocumentRowActionsProps {
  documentType: DocumentType;
  sequence: number;
  number: number;
}

export function DocumentRowActions({
  documentType,
  sequence,
  number,
}: DocumentRowActionsProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 cursor-pointer"
      asChild
    >
      <Link
        href={`/documents/${documentType}/${sequence}`}
        aria-label={`View files for document #${number}`}
      >
        <FolderOpen className="size-4" />
      </Link>
    </Button>
  );
}
