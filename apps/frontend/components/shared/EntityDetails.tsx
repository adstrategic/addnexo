"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, Trash2, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface EntityField {
  label: string;
  value: string | number | React.ReactNode | null | undefined;
  icon?: React.ReactNode;
  type?: "text" | "email" | "phone" | "address" | "url";
}

export interface EntitySection {
  title: string;
  icon?: React.ReactNode;
  fields: EntityField[];
  customContent?: React.ReactNode;
}

export interface EntityAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

export interface EntityDetailsProps {
  // Datos de la entidad
  title: string;
  subtitle?: string;
  sections: EntitySection[];

  // Estados
  isLoading: boolean;
  error: Error | null;

  // Acciones
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  quickActions?: EntityAction[];

  // Configuración
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  backButtonText?: string;
  notFoundMessage?: string;
  notFoundIcon?: React.ReactNode;
}

export function EntityDetails({
  title,
  subtitle,
  sections,
  isLoading,
  error,
  onBack,
  onEdit,
  onDelete,
  quickActions = [],
  showEditButton = true,
  showDeleteButton = true,
  backButtonText = "Go back",
  notFoundMessage = "Entity not found",
  notFoundIcon = <Building2 className="h-12 w-12 text-muted-foreground" />,
}: EntityDetailsProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return <EntityDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center">{notFoundIcon}</div>
          <h3 className="text-lg font-semibold">Error</h3>
          <p className="text-muted-foreground">
            {error.message || notFoundMessage}
          </p>
        </div>
        <Button onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backButtonText}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backButtonText}</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {showEditButton && onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {showDeleteButton && onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
      {/* Secciones de información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {sections.map(
          (section, sectionIndex) =>
            !section.customContent && (
              <Card key={sectionIndex}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div
                        key={fieldIndex}
                        className="flex items-center space-x-3"
                      >
                        {field.icon}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {field.value ?? "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
        )}
      </div>
      <div className="grid grid-cols-1 gap-6">
        {sections.map(
          (section) =>
            section.customContent && (
              <Card key={"custom-content-" + section.title}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {section.customContent}
                  </div>
                </CardContent>
              </Card>
            )
        )}
      </div>

      {/* Acciones rápidas */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={action.onClick}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EntityDetailsSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-6 w-6" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <Card key={sectionIndex}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
