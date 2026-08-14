"use client";

import { showToast } from "@/components/ui/Toast";

export function showCartToast(message: string) {
  showToast(message, "success");
}
