import React from "react";

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  href: string;
}

export default function ButtonLink({
  variant = "primary",
  children,
  href,
  className = "",
  ...props
}: ButtonLinkProps) {
  const baseClasses =
    "inline-block px-8 py-3 font-bold text-lg rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 active:scale-95 text-center";

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-orange-500 to-red-500 text-white border-white/20 hover:border-white/40",
    secondary:
      "bg-gradient-to-r from-gray-600 to-gray-700 text-white border-white/20 hover:border-white/40",
  };

  return (
    <a
      href={href}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </a>
  );
}
