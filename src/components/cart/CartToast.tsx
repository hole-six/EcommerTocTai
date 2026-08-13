"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type ToastItem = { id: number; message: string };

let nextId = 1;
const listeners = new Set<(item: ToastItem) => void>();

export function showCartToast(message: string) {
  const item = { id: nextId++, message };
  listeners.forEach((listener) => listener(item));
}

export function CartToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(item: ToastItem) {
      setItems((current) => [...current, item]);
      window.setTimeout(() => {
        setItems((current) => current.filter((entry) => entry.id !== item.id));
      }, 2400);
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
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#123e71",
            color: "#fff",
            borderRadius: 999,
            padding: "10px 18px",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 8px 24px rgba(18,62,113,0.35)",
            animation: "cartToastIn 0.2s ease-out",
          }}
        >
          <CheckCircle2 size={16} />
          <span>{item.message}</span>
        </div>
      ))}
      <style>{`@keyframes cartToastIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
