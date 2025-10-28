import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  children,
  className = "",
  disabled = false,
  ...props
}: ButtonProps) {
  const baseClasses =
    "select-none touch-manipulation px-8 py-3 font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 active:scale-95";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-orange-500 to-red-500 text-white border-white/20 hover:border-white/40",
    secondary:
      "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-white/20 hover:border-white/40",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-lg"
    : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
