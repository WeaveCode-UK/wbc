import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, type ReactNode } from "react";
import { FormField } from "../form-field";

// Coverage lift — FormField: thin wrapper around react-hook-form's register
// that surfaces field errors via the @wbc/ui Input. We render inside a
// FormProvider so useFormContext resolves.

interface ProviderProps {
  children: ReactNode;
  defaultValues?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
}

function Provider({ children, defaultValues, errors }: ProviderProps) {
  const methods = useForm({ defaultValues });
  // Inject errors via effect (NOT during render, which loops on RHF state).
  useEffect(() => {
    if (!errors) return;
    for (const [name, err] of Object.entries(errors)) {
      methods.setError(name, { type: "manual", message: err.message });
    }
  }, [errors, methods]);
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("FormField", () => {
  it("renders an input bound to the provided name", () => {
    render(
      <Provider defaultValues={{ email: "ana@example.com" }}>
        <FormField name="email" label="Email" />
      </Provider>,
    );
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("ana@example.com");
  });

  it("forwards type prop down to the input element", () => {
    render(
      <Provider>
        <FormField name="pwd" label="Senha" type="password" />
      </Provider>,
    );
    const input = screen.getByLabelText("Senha") as HTMLInputElement;
    expect(input.type).toBe("password");
  });

  it("renders the placeholder when provided", () => {
    render(
      <Provider>
        <FormField name="x" placeholder="placeholder-x" />
      </Provider>,
    );
    expect(screen.getByPlaceholderText("placeholder-x")).toBeInTheDocument();
  });

  it("surfaces the field error from react-hook-form's formState", () => {
    render(
      <Provider errors={{ email: { message: "Email inválido" } }}>
        <FormField name="email" label="Email" />
      </Provider>,
    );
    expect(screen.getByText("Email inválido")).toBeInTheDocument();
  });
});
