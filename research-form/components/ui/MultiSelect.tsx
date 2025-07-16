"use client";
import React, { useState, useRef, useEffect } from "react";
import { CheckIcon } from "lucide-react";
// Do not use Radix Select primitives directly for multi-select

interface MultiSelectOption {
    label: string;
    value: number;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: number[];
    onChange: (selected: number[]) => void;
    placeholder?: string;
    className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selected,
    onChange,
    placeholder = "Wybierz...",
    className = "",
}) => {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

      // Close dropdown on outside click
      useEffect(() => {
        function handleClick(e: MouseEvent) {
          if (
            open &&
            triggerRef.current &&
            !triggerRef.current.contains(e.target as Node)
          ) {
            setOpen(false);
          }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
      }, [open]);

    function handleToggle(value: number) {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    }

    const selectedLabels = selected.length === options.length
        ? "Wszystkie" : `Wybrano ${selected.length} z ${options.length}`;

    return (
        <div className={className} style={{ minWidth: 180, position: "relative" }} ref={triggerRef}>
            <button

                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={
                    "border-input flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition outline-none focus-visible:ring-2 focus-visible:ring-ring/50 hover:bg-input/20 " +
                    (selectedLabels ? "" : "text-muted-foreground")
                }
            >
                <span className="line-clamp-1 flex items-center gap-2">{selectedLabels || placeholder}</span>
                <span className="pointer-events-none shrink-0 opacity-50">
                    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 7l3 3 3-3" /></svg>
                </span>
            </button>
            {open && (
                <div
                    className="absolute left-0 mt-1 w-full z-50 bg-popover text-popover-foreground rounded-md border shadow-md max-h-60 overflow-y-auto"
                    role="listbox"
                >
                    <button
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={e => {
                            e.stopPropagation();
                            if (selected.length === options.length) {
                                onChange([]);
                            } else {
                                onChange(options.map(opt => opt.value));
                            }
                        }}
                        className={
                            "flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold border-b border-border " +
                            (selected.length === options.length
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-input/20")
                        }
                    >
                        {selected.length === options.length && <CheckIcon className="size-4" />}
                        {selected.length === options.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                    </button>
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                                handleToggle(opt.value);
                            }}
                            className={
                                "flex w-full items-center gap-2 px-3 py-2 text-sm" +
                                (selected.includes(opt.value)
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-input/20")
                            }
                        >
                            {selected.includes(opt.value) && <CheckIcon className="size-4" />}
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
