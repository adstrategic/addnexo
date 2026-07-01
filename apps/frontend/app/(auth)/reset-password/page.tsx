"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    passwordConfirmation: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 mb-4">
            <KeyRound className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Invalid or expired link
          </h1>
          <p className="text-sm text-muted-foreground">
            This password reset link is no longer valid. Please request a new
            one.
          </p>
          <Link
            href="/forget-password"
            className="inline-block text-sm text-primary underline underline-offset-4 transition-opacity duration-150 hover:opacity-70"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes("expired") ||
          error.message?.toLowerCase().includes("invalid")
        ) {
          toast.error(
            "This reset link has expired or is invalid. Please request a new one.",
          );
        } else {
          toast.error(error.message ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setDone(true);
      toast.success("Password updated successfully.");
      setTimeout(() => router.replace("/sign-in"), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <KeyRound className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Set a new password
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose a strong password for your account.
          </p>
        </div>

        <Card className="rounded-2xl border shadow-sm">
          {done ? (
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                <KeyRound className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-base font-medium text-foreground">
                Password updated!
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in…
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">New password</CardTitle>
                <CardDescription className="text-xs">
                  Minimum 8 characters.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      name="password"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="reset-password">
                            New password
                          </FieldLabel>
                          <Input
                            {...field}
                            id="reset-password"
                            type="password"
                            placeholder="New password"
                            aria-invalid={fieldState.invalid}
                            autoComplete="new-password"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="passwordConfirmation"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="reset-password-confirm">
                            Confirm password
                          </FieldLabel>
                          <Input
                            {...field}
                            id="reset-password-confirm"
                            type="password"
                            placeholder="Confirm password"
                            aria-invalid={fieldState.invalid}
                            autoComplete="new-password"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </FieldGroup>
                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Update password"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-center">
                <Link
                  href="/sign-in"
                  className="text-xs text-muted-foreground underline underline-offset-4 transition-opacity duration-150 hover:opacity-70"
                >
                  Back to sign in
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
