"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border bg-background px-4 py-2 text-base transition-colors",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
        )}
        {error && (
          <p className="mt-1.5 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
