"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeAndSave() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return;
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  await fetch("/api/admin/push-subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  }).catch(() => undefined);
}

export function PushSubscribe() {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (localStorage.getItem("toctai_push_dismissed")) return;
    if (Notification.permission === "granted") {
      void subscribeAndSave();
      return;
    }
    if (Notification.permission === "default") setVisible(true);
  }, []);

  async function enable() {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribeAndSave();
    } finally {
      setRequesting(false);
      setVisible(false);
    }
  }

  function dismiss() {
    localStorage.setItem("toctai_push_dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "0 0 20px",
        padding: "12px 16px",
        borderRadius: 12,
        background: "#eaf2ff",
        border: "1px solid #c3d6ec",
      }}
    >
      <Bell size={18} color="#153e73" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: "#153e73", fontWeight: 600 }}>
        Bật thông báo đẩy để nhận cảnh báo ngay khi có đơn hàng mới, kể cả khi
        không mở trang này.
      </span>
      <button
        type="button"
        onClick={() => void enable()}
        disabled={requesting}
        style={{
          border: 0,
          borderRadius: 8,
          background: "#153e73",
          color: "#fff",
          padding: "8px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {requesting ? "Đang bật..." : "Bật thông báo"}
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Đóng"
        style={{
          border: 0,
          background: "transparent",
          color: "#153e73",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
