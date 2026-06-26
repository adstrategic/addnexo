"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const createInviteSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  role: z.enum(["admin", "warehouse_manager"]),
});

type CreateInviteForm = z.infer<typeof createInviteSchema>;

const ROLE_LABELS: Record<CreateInviteForm["role"], string> = {
  admin: "Admin",
  warehouse_manager: "Warehouse manager",
};

export function CreateInviteButton() {
  const [open, setOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const form = useForm<CreateInviteForm>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: { email: "", role: "warehouse_manager" },
  });

  const { isSubmitting } = form.formState;
  const selectedRole = form.watch("role");

  async function handleCreateInvite(data: CreateInviteForm) {
    authClient.organization.inviteMember(data, {
      onError: (error) => {
        toast.error(
          (error as { error?: { message?: string } })?.error?.message ||
            "Failed to invite user"
        );
      },
      onSuccess: () => {
        form.reset();
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Invite a user to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleCreateInvite)}
          className="space-y-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="colleague@example.com"
                aria-invalid={!!form.formState.errors.email}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field>
              <FieldLabel>Role</FieldLabel>
              <DropdownMenu open={roleOpen} onOpenChange={setRoleOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {ROLE_LABELS[selectedRole]}
                    <span className="sr-only">Open role menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuItem
                    onClick={() => {
                      form.setValue("role", "admin");
                      setRoleOpen(false);
                    }}
                  >
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      form.setValue("role", "warehouse_manager");
                      setRoleOpen(false);
                    }}
                  >
                    Warehouse manager
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
