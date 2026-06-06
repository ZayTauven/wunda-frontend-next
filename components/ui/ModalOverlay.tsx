"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Wrapper Portal pour n'importe quelle modale inline (non-Modal component).
 * Injecte les enfants directement dans document.body pour échapper
 * aux contextes d'empilement (backdrop-filter, transform).
 */
export default function ModalOverlay({ children, onClose }: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
