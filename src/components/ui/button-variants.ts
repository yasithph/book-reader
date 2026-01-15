import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantStyles = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline:
    "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizeStyles = {
  default: "h-11 px-5 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-12 px-8 text-lg",
  icon: "h-10 w-10",
};

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className);
}
