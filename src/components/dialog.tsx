"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Rendered via a portal directly under <body> rather than in place: the
  // site header uses backdrop-blur, and backdrop-filter (like transform or
  // filter) creates a new containing block for `position: fixed`
  // descendants — so without the portal, this overlay would be confined to
  // the header's box instead of covering the full viewport.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-[dialog-overlay-in_150ms_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-6 flex flex-col gap-4 shadow-2xl animate-[dialog-pop-in_150ms_ease-out]"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
