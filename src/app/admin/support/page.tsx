"use client";

import { Inbox, MessageCircle, RefreshCw, Search, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const statusLabel: Record<Thread["status"], string> = {
  open: "Đang mở",
  pending: "Chờ xử lý",
  closed: "Đã đóng",
};
const statusPill: Record<Thread["status"], string> = {
  open: styles.pillOpen,
  pending: styles.pillPending,
  closed: styles.pillClosed,
};
const filters = [
  ["all", "Tất cả"],
  ["open", "Đang mở"],
  ["pending", "Chờ xử lý"],
  ["closed", "Đã đóng"],
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KH";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function toDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shortTime(value?: string) {
  const date = toDate(value);
  if (!date) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)} ngày`;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function clockTime(value?: string) {
  const date = toDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(value?: string) {
  const date = toDate(value);
  if (!date) return "";
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return "Hôm nay";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminSupportPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const selected = threads.find((thread) => thread._id === selectedId) ?? threads[0] ?? null;

  async function load() {
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

  useEffect(() => {
    const node = messagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [selected?._id, selected?.messages.length]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: threads.length, open: 0, pending: 0, closed: 0 };
    for (const thread of threads) base[thread.status] = (base[thread.status] ?? 0) + 1;
    return base;
  }, [threads]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return threads.filter((thread) => {
      const byStatus = status === "all" || thread.status === status;
      const haystack = `${thread.customerName} ${thread.phone} ${thread.email} ${thread.lastMessage}`.toLowerCase();
      return byStatus && (!text || haystack.includes(text));
    });
  }, [threads, query, status]);

  const grouped = useMemo(() => {
    const rows: { day: string; items: Message[] }[] = [];
    for (const message of selected?.messages ?? []) {
      const day = dayLabel(message.createdAt);
      const last = rows[rows.length - 1];
      if (last && last.day === day) last.items.push(message);
      else rows.push({ day, items: [message] });
    }
    return rows;
  }, [selected]);

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
        setThreads((current) =>
          current.map((thread) => (thread._id === selected._id ? payload.data : thread)),
        );
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
          <p>HỘP THƯ HỖ TRỢ</p>
          <h1>Chat hỗ trợ khách hàng</h1>
        </div>
        <button className={panel.secondaryButton} onClick={() => void load()}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      <div className={styles.layout}>
        <section className={styles.card}>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên, SĐT, nội dung..."
                aria-label="Tìm hội thoại"
              />
            </div>
            <div className={styles.filters}>
              {filters.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.filter} ${status === value ? styles.filterActive : ""}`}
                  onClick={() => setStatus(value)}
                >
                  {label} <i>{counts[value] ?? 0}</i>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.threads}>
            {loading && threads.length === 0 && (
              <div className={styles.skeleton}>
                <i />
                <i />
                <i />
                <i />
              </div>
            )}
            {visible.map((thread) => (
              <button
                type="button"
                key={thread._id}
                className={`${styles.thread} ${selected?._id === thread._id ? styles.threadActive : ""}`}
                onClick={() => setSelectedId(thread._id)}
              >
                <span className={styles.avatar}>{initials(thread.customerName)}</span>
                <span className={styles.threadBody}>
                  <span className={styles.threadTop}>
                    <b>{thread.customerName || "Khách vãng lai"}</b>
                    <time>{shortTime(thread.lastMessageAt)}</time>
                  </span>
                  <span className={styles.snippet}>{thread.lastMessage || "Chưa có nội dung"}</span>
                  <span className={styles.threadFoot}>
                    <span className={`${styles.pill} ${statusPill[thread.status]}`}>
                      {statusLabel[thread.status]}
                    </span>
                    <span className={styles.threadContact}>
                      {thread.phone || thread.email || "Chưa có liên hệ"}
                    </span>
                    {thread.unreadForAdmin > 0 && (
                      <span className={styles.badge}>{thread.unreadForAdmin}</span>
                    )}
                  </span>
                </span>
              </button>
            ))}
            {!loading && visible.length === 0 && (
              <div className={styles.empty}>
                <Inbox size={30} />
                <b>Chưa có hội thoại</b>
                <p>Không tìm thấy hội thoại phù hợp với bộ lọc hiện tại.</p>
              </div>
            )}
          </div>
        </section>

        <section className={`${styles.card} ${styles.chatPanel}`}>
          {selected ? (
            <>
              <header className={styles.chatHeader}>
                <span className={styles.avatar}>{initials(selected.customerName)}</span>
                <div className={styles.chatWho}>
                  <b>{selected.customerName || "Khách vãng lai"}</b>
                  <span>
                    {[selected.phone, selected.email].filter(Boolean).join(" · ") ||
                      "Chưa có thông tin liên hệ"}
                  </span>
                </div>
                <div className={styles.chatActions}>
                  <span className={`${styles.pill} ${statusPill[selected.status]}`}>
                    {statusLabel[selected.status]}
                  </span>
                  <select
                    className={styles.statusSelect}
                    value={selected.status}
                    aria-label="Trạng thái hội thoại"
                    onChange={(event) => void updateThread(event.target.value as Thread["status"])}
                  >
                    <option value="open">Đang mở</option>
                    <option value="pending">Chờ xử lý</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              </header>

              <div className={styles.messages} ref={messagesRef}>
                {grouped.length === 0 && (
                  <div className={styles.empty}>
                    <MessageCircle size={28} />
                    <p>Hội thoại chưa có tin nhắn nào.</p>
                  </div>
                )}
                {grouped.map((group) => (
                  <div key={group.day} className={styles.group}>
                    <span className={styles.daySep}>{group.day}</span>
                    {group.items.map((message) => {
                      const isAdmin = message.senderRole === "admin";
                      return (
                        <div
                          key={message._id ?? `${message.createdAt}-${message.body}`}
                          className={`${styles.row} ${isAdmin ? styles.rowAdmin : ""}`}
                        >
                          <div className={`${styles.bubble} ${isAdmin ? styles.bubbleAdmin : ""}`}>
                            {message.body}
                          </div>
                          <span className={styles.meta}>
                            {isAdmin ? message.senderName || "CareWise" : selected.customerName} ·{" "}
                            {clockTime(message.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className={styles.composer}>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                      event.preventDefault();
                      void updateThread();
                    }
                  }}
                  placeholder="Nhập phản hồi cho khách..."
                />
                <div className={styles.composerBar}>
                  <p className={styles.hint}>
                    Nhấn <kbd>Ctrl</kbd> + <kbd>Enter</kbd> để gửi nhanh
                  </p>
                  <button
                    type="button"
                    className={styles.sendButton}
                    disabled={saving || !reply.trim()}
                    onClick={() => void updateThread()}
                  >
                    <Send size={15} /> {saving ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              <MessageCircle size={32} />
              <b>Chưa chọn hội thoại</b>
              <p>Chọn một hội thoại ở danh sách bên trái để xem và phản hồi khách hàng.</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
