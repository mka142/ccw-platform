// shadcn large popup/dialog component
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@radix-ui/react-dialog";

interface PopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
}

export function Popup({ open, onOpenChange, title, children }: PopupProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-6 bg-background rounded-lg shadow-lg">
        <DialogHeader>
          {title && <DialogTitle className="text-lg font-bold mb-4">{title}</DialogTitle>}
          <DialogClose className="absolute top-4 right-4 text-xl cursor-pointer">×</DialogClose>
        </DialogHeader>
        <div className="w-full h-full flex items-center justify-center">{children}</div>
      </DialogContent>
    </Dialog>
  );
}