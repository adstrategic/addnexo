import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Layers } from "lucide-react";
import type { GroupResponse } from "../schemas/groups.schema";
import { GroupRowActions } from "./GroupRowActions";

interface GroupMobileCardProps {
  group: GroupResponse;
  onEdit: (sequence: number) => void;
  onDelete: (group: GroupResponse) => void;
}

export function GroupMobileCard({
  group,
  onEdit,
  onDelete,
}: GroupMobileCardProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Layers className="size-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/inventory-groups/${group.GOrgSecuencia}`}
                className="line-clamp-2 font-medium text-foreground transition-colors hover:text-primary"
              >
                {group.GDescripcion}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Group #{group.GNro}
              </p>
            </div>

            <GroupRowActions
              sequence={group.GOrgSecuencia}
              group={group}
              groupName={group.GDescripcion}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">#{group.GNro}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="size-3.5 shrink-0" aria-hidden />
              {group.GDescripcion}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
