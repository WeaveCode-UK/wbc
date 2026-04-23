"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@wbc/ui";

interface FormFieldProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  helper?: string;
  togglePassword?: boolean;
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  helper,
  togglePassword,
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <Input
      {...register(name)}
      label={label}
      type={type}
      placeholder={placeholder}
      error={error}
      helper={helper}
      togglePassword={togglePassword}
    />
  );
}
