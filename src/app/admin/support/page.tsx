"use client";

import { MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./support.module.css";

type Message = {
  _id?: string;
  senderRole: "customer" | "admin";
  senderName: string;
  body: string;
  createdAt: string;
};
type Thread = {
  _id: string;
  customerName: string;
  phone: string;
  email: string;
  status: "open" | "pending" | "closed";
  unreadForAdmin: number;
  lastMessage: string;
  lastMessageAt: string;
  messages: Message[];
};

const statusLabel = { open: "Đang mở", pending: "Chờ xử lý", closed: "Đã đóng" };

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selected = threads.find((thread) => thread._id === selectedId) ?? threads[0] ?? null;

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/support", { cache: "no-store" });
    const payload = await response.json();
    setThreads(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(timer);
  }, []);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return threads.filter((thread) => {
      const byStatus = status === "all" || thread.status === status;
      const haystack = `${thread.customerName} ${thread.phone} ${thread.email} ${thread.lastMessage}`.toLowerCase();
      return byStatus && (!text || haystack.includes(text));
    });
  }, [threads, query, status]);

  async function updateThread(nextStatus?: Thread["status"]) {
    if (!selected || (!reply.trim() && !nextStatus)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/support/${selected._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() || undefined, status: nextStatus }),
      });
      const payload = await response.json();
      if (response.ok) {
        setThreads((current) => current.map((thread) => thread._id === selected._id ? payload.data : thread));
        setReply("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell breadcrumb="Hỗ trợ">
      <div className={panel.header}>
        <div>
          <p>SUPPORT INBOX</p>
          <h1>Chat hỗ trợ khách hàng</h1>
        </div>
        <button className={panel.secondaryButton} onClick={() => void load()}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>
      <div className={styles.layout}>
        <section className={`${panel.panel} ${styles.threadList}`}>
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, SĐT, nội dung..." />
            </label>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Tất cả</option>
              <option value="open">Đang mở</option>
              <option value="pending">Chờ xử lý</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <div className={styles.threads}>
            {visible.map((thread) => (
              <button
                className={`${styles.thread} ${selected?._id === thread._id ? styles.active : ""}`}
                key={thread._id}
                onClick={() => setSelectedId(thread._id)}
              >
                <div className={styles.threadTop}>
                  <b>{thread.customerName}</b>
                  {thread.unreadForAdmin > 0 && <span className={styles.badge}>{thread.unreadForAdmin}</span>}
                </div>
                <p>{thread.lastMessage || "Chưa có nội dung"}</p>
                <small>{thread.phone || thread.email || "Khách chưa để lại liên hệ"} · {statusLabel[thread.status]}</small>
              </button>
            ))}
            {!loading && visible.length === 0 && <div className={styles.empty}>Chưa có hội thoại phù hợp.</div>}
          </div>
        </section>
        <section className={`${panel.panel} ${styles.chatPanel}`}>
          {selected ? (
            <>
              <header className={styles.chatHeader}>
                <div className={styles.chatTop}>
                  <div>
                    <b>{selected.customerName}</b>
                    <p>{[selected.phone, selected.email].filter(Boolean).join(" · ") || "Chưa có thông tin liên hệ"}</p>
                  </div>
                  <select className={styles.statusSelect} value={selected.status} onChange={(event) => void updateThread(event.target.value as Thread["status"])}>
                    <option value="open">Đang mở</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              </header>
              <div className={styles.messages}>
                {selected.messages.map((message) => (
                  <div className={`${styles.bubble} ${message.senderRole === "admin" ? styles.adminBubble : ""}`} key={message._id ?? `${message.createdAt}-${message.body}`}>
                    <small>{message.senderRole === "admin" ? "CareWise" : selected.customerName}</small>
                    {message.body}
                  </div>
                ))}
              </div>
              <div className={styles.composer}>
                <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Nhập phản hồi cho khách..." />
                <button className={panel.primaryButton} disabled={saving || !reply.trim()} onClick={() => void updateThread()}>
                  <Send size={15} /> Gửi phản hồi
                </button>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <MessageCircle size={32} />
              <p>Chọn một hội thoại để phản hồi khách hàng.</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
