"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
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

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgetPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const { error } = await authClient.forgetPassword({
        email: data.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Reset your password
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <Card className="rounded-2xl border shadow-sm">
          {submitted ? (
            <CardContent className="pt-6 pb-6">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
                  <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-base font-medium text-foreground">
                  Check your inbox
                </p>
                <p className="text-sm text-muted-foreground">
                  If an account with that email exists, you&apos;ll receive a
                  password reset link shortly.
                </p>
                <Link
                  href="/sign-in"
                  className="inline-block text-sm text-primary underline underline-offset-4 mt-2 transition-opacity duration-150 hover:opacity-70"
                >
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">Email address</CardTitle>
                <CardDescription className="text-xs">
                  We&apos;ll send a secure link to this address.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-4"
                >
                  <FieldGroup>
                    <Controller
                      name="email"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="forget-email">Email</FieldLabel>
                          <Input
                            {...field}
                            id="forget-email"
                            type="email"
                            placeholder="you@example.com"
                            aria-invalid={fieldState.invalid}
                            autoComplete="email"
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
                      "Send reset link"
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
