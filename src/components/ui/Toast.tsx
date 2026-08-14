"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

let nextId = 1;
const listeners = new Set<(item: ToastItem) => void>();

export function showToast(message: string, type: ToastType = "success") {
  const item = { id: nextId++, message, type };
  listeners.forEach((listener) => listener(item));
}

const palette: Record<ToastType, { bg: string; shadow: string; icon: typeof CheckCircle2 }> = {
  success: { bg: "#15803d", shadow: "rgba(21,128,61,0.35)", icon: CheckCircle2 },
  error: { bg: "#b91c1c", shadow: "rgba(185,28,28,0.35)", icon: CircleAlert },
  info: { bg: "#123e71", shadow: "rgba(18,62,113,0.35)", icon: Info },
};

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(item: ToastItem) {
      setItems((current) => [...current, item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }, 2800);
    }
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 76,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {items.map((item) => {
        const tone = palette[item.type];
        const Icon = tone.icon;
        return (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: tone.bg,
              color: "#fff",
              borderRadius: 999,
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: `0 8px 24px ${tone.shadow}`,
              animation: "appToastIn 0.2s ease-out",
              maxWidth: "min(86vw, 420px)",
              textAlign: "center",
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            <span>{item.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes appToastIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
