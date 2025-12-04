"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  title?: string;
  showIconOnly?: boolean;
  children?: React.ReactNode;
}

export default function CopyButton({
  textToCopy,
  disabled = false,
  size = "sm",
  variant = "outline",
  className = "",
  title,
  showIconOnly = false,
  children,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!textToCopy || textToCopy.trim().length === 0) {
      alert("Brak danych do skopiowania");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      
      // Show alert with copied content
      alert(`Skopiowano do schowka:\n\n${textToCopy}`);
      
      // Reset copied state after animation
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      // Fallback: show in alert if clipboard fails
      alert(`Informacje:\n\n${textToCopy}\n\n(Skopiuj ręcznie)`);
      console.error("Failed to copy to clipboard:", err);
    }
  };

  if (showIconOnly) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleCopy}
        className={className}
        disabled={disabled || !textToCopy || textToCopy.trim().length === 0}
        title={title || "Kopiuj do schowka"}
      >
        {copied ? (
          <Check className="h-4 w-4" />
        ) : (
          children || <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={className}
      disabled={disabled || !textToCopy || textToCopy.trim().length === 0}
      title={title}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 mr-2" />
          Skopiowano
        </>
      ) : (
        <>
          {children || (
            <>
              <Copy className="h-3 w-3 mr-2" />
              Kopiuj
            </>
          )}
        </>
      )}
    </Button>
  );
}

