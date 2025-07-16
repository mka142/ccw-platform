"use client";
import * as React from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

interface SimpleTooltipProps {
  text: React.ReactNode;
  children: React.ReactNode;
  sideOffset?: number;
  className?: string;
}

export function SimpleTooltip({ text, children, sideOffset = 0, className }: SimpleTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={sideOffset} className={className}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
