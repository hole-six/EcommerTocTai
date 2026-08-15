"use client";

import { Bell, Download, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { pushSupported, subscribeToPush } from "@/lib/client/push";
import styles from "./PwaPrompt.module.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaPrompt() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hidden) return;
    function onBeforeInstall(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstallEvent(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    setInstallDismissed(Boolean(localStorage.getItem("toctai_pwa_install_dismissed")));
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden) return;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body) => setLoggedIn(Boolean(body.data)))
      .catch(() => undefined);
  }, [hidden]);

  useEffect(() => {
    if (hidden || !loggedIn || !pushSupported()) return;
    if (localStorage.getItem("toctai_push_dismissed")) return;
    if (Notification.permission === "granted") {
      void subscribeToPush();
      return;
    }
    if (Notification.permission === "default") setNotifyVisible(true);
  }, [hidden, loggedIn]);

  if (hidden) return null;

  const showInstall = Boolean(installEvent) && !installDismissed;
  const showNotify = !showInstall && notifyVisible;

  async function install() {
    if (!installEvent) return;
    setBusy(true);
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } finally {
      setBusy(false);
    }
  }
  function dismissInstall() {
    localStorage.setItem("toctai_pwa_install_dismissed", "1");
    setInstallDismissed(true);
  }
  async function enableNotify() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") await subscribeToPush();
    } finally {
      setBusy(false);
      setNotifyVisible(false);
    }
  }
  function dismissNotify() {
    localStorage.setItem("toctai_push_dismissed", "1");
    setNotifyVisible(false);
  }

  if (showInstall) {
    return (
      <div className={styles.bar}>
        <span className={styles.icon}>
          <Download size={17} />
        </span>
        <span className={styles.text}>Cài đặt ứng dụng để mua sắm nhanh hơn, ngay trên màn hình chính.</span>
        <button type="button" className={styles.action} onClick={() => void install()} disabled={busy}>
          {busy ? "Đang mở..." : "Cài đặt"}
        </button>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={dismissInstall}>
          <X size={16} />
        </button>
      </div>
    );
  }

  if (showNotify) {
    return (
      <div className={styles.bar}>
        <span className={styles.icon}>
          <Bell size={17} />
        </span>
        <span className={styles.text}>Bật thông báo để không bỏ lỡ trạng thái đơn hàng và ưu đãi mới.</span>
        <button type="button" className={styles.action} onClick={() => void enableNotify()} disabled={busy}>
          {busy ? "Đang bật..." : "Bật thông báo"}
        </button>
        <button type="button" className={styles.close} aria-label="Đóng" onClick={dismissNotify}>
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
