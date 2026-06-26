"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { ArrowLeft, Edit, Layers, Trash2 } from "lucide-react";
import type { EntityAction } from "@/components/shared/EntityDetails";

interface DetailField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

interface DetailSection {
  title: string;
  icon: React.ReactNode;
  fields: DetailField[];
}

interface GroupDetailsViewProps {
  title: string;
  subtitle?: string;
  sections: DetailSection[];
  quickActions?: EntityAction[];
  isLoading: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

function DetailFieldRow({ label, value, icon }: DetailField) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="text-sm text-muted-foreground">{value ?? "—"}</div>
      </div>
    </div>
  );
}

function GroupDetailsSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function GroupDetailsView({
  title,
  subtitle,
  sections,
  quickActions = [],
  isLoading,
  onEdit,
  onDelete,
  children,
}: GroupDetailsViewProps) {
  if (isLoading) {
    return <GroupDetailsSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-9 cursor-pointer px-2"
        >
          <Link href="/inventory-groups">
            <ArrowLeft className="mr-2 size-4" aria-hidden />
            Back to inventory groups
          </Link>
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Layers className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {onEdit ? (
              <Button
                variant="outline"
                onClick={onEdit}
                className="cursor-pointer"
              >
                <Edit className="mr-2 size-4" aria-hidden />
                Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                variant="outline"
                onClick={onDelete}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 size-4" aria-hidden />
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {section.icon}
                <span>{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field) => (
                <DetailFieldRow key={field.label} {...field} />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {quickActions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || "outline"}
                  className="h-auto cursor-pointer flex-col gap-2 px-4 py-4"
                  onClick={action.onClick}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {children}
    </div>
  );
}
