"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@wbc/ui/components/button";
import { FormField } from "../form-field";
import { useTranslations } from "next-intl";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = loginSchema
  .extend({
    name: z.string().min(2),
    confirmPassword: z.string().min(8),
  })
  .refine(
    (data: { password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

interface CredentialsFormProps {
  mode: "login" | "register";
}

export function CredentialsForm({ mode }: CredentialsFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<any>({
    resolver: zodResolver(
      mode === "register" ? registerSchema : loginSchema,
    ) as never,
    defaultValues: { email: "", password: "", name: "", confirmPassword: "" },
  });

  const onSubmit = methods.handleSubmit(
    async (data: {
      email: string;
      password: string;
      name?: string;
      confirmPassword?: string;
    }) => {
      setServerError("");

      try {
        if (mode === "register") {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
              name: data.name,
            }),
          });
          if (!res.ok) {
            setServerError(t("register.error"));
            return;
          }
        }

        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          setServerError(t("login.invalidCredentials"));
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch {
        setServerError(t("login.genericError"));
      }
    },
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "register" && (
          <FormField name="name" label={t("register.name")} />
        )}

        <FormField name="email" label={t("login.email")} type="email" />
        <FormField
          name="password"
          label={t("login.password")}
          type="password"
          togglePassword
        />

        {mode === "register" && (
          <FormField
            name="confirmPassword"
            label={t("register.confirmPassword")}
            type="password"
            togglePassword
          />
        )}

        {serverError && (
          <p className="text-sm text-destructive" role="alert">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={methods.formState.isSubmitting}
        >
          {mode === "login" ? t("login.submit") : t("register.submit")}
        </Button>
      </form>
    </FormProvider>
  );
}
