// shadcn button component
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "default" && "bg-primary text-background hover:bg-primary/90 border border-primary",
          variant === "outline" && "border border-primary bg-background text-primary hover:bg-primary/10",
          variant === "ghost" && "bg-transparent text-primary hover:bg-primary/10 border border-transparent",
          size === "sm" && "px-2 py-1 text-sm",
          size === "md" && "px-3 py-2 text-base",
          size === "lg" && "px-4 py-3 text-lg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";