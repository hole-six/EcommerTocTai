"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type CartOptionSelection = {
  groupCode: string;
  groupTitle: string;
  optionValue: string;
  optionLabel: string;
  priceAdjustment: number;
};
export type CartItem = {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  variantId?: string;
  variantTitle?: string;
  options?: CartOptionSelection[];
};
type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity" | "lineId"> & { lineId?: string }, quantity?: number) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "toctai_cart";
const listeners = new Set<() => void>();
const emptyCart: CartItem[] = [];
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = emptyCart;

function itemKey(item: { productId: string; variantId?: string; options?: CartOptionSelection[] }) {
  const optionKey = (item.options ?? [])
    .map((option) => `${option.groupCode}:${option.optionValue}`)
    .sort()
    .join("|");
  return [item.productId, item.variantId ?? "", optionKey].join("::");
}

function normalize(items: CartItem[]) {
  return items.map((item) => ({ ...item, lineId: item.lineId || itemKey(item) }));
}

function readItems(): CartItem[] {
  if (typeof window === "undefined") return emptyCart;
  const raw = window.localStorage.getItem(storageKey);
  if (raw === cachedRaw) return cachedItems;
  cachedRaw = raw;
  if (!raw) { cachedItems = emptyCart; return cachedItems; }
  try {
    const parsed = JSON.parse(raw) as unknown;
    cachedItems = Array.isArray(parsed) ? normalize(parsed as CartItem[]) : emptyCart;
  } catch {
    cachedItems = emptyCart;
  }
  return cachedItems;
}

function writeItems(items: CartItem[]) {
  const raw = JSON.stringify(items);
  cachedRaw = raw;
  cachedItems = items;
  localStorage.setItem(storageKey, raw);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readItems, () => emptyCart);

  function addItem(item: Omit<CartItem, "quantity" | "lineId"> & { lineId?: string }, quantity = 1) {
    const current = readItems();
    const lineId = item.lineId ?? itemKey(item);
    const existing = current.find((line) => line.lineId === lineId);
    const next = existing ? current.map((line) => (line.lineId === lineId ? { ...line, quantity: line.quantity + quantity } : line)) : [...current, { ...item, lineId, quantity }];
    writeItems(next);
  }
  function setQuantity(lineId: string, quantity: number) {
    const current = readItems();
    const next = quantity <= 0 ? current.filter((line) => line.lineId !== lineId) : current.map((line) => (line.lineId === lineId ? { ...line, quantity } : line));
    writeItems(next);
  }
  function removeItem(lineId: string) {
    writeItems(readItems().filter((line) => line.lineId !== lineId));
  }
  function clear() {
    writeItems([]);
  }

  const count = useMemo(() => items.reduce((sum, line) => sum + line.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.price * line.quantity, 0), [items]);

  return <CartContext.Provider value={{ items, count, subtotal, addItem, setQuantity, removeItem, clear }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
