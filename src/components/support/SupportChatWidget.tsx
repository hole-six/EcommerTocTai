"use client";

import { MessageCircle, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./SupportChatWidget.module.css";

type SupportMessage = {
  _id?: string;
  senderRole: "customer" | "admin";
  senderName: string;
  body: string;
  createdAt: string;
};

type SupportThread = {
  _id: string;
  customerName: string;
  phone: string;
  unreadForCustomer: number;
  messages: SupportMessage[];
};

function visitorId() {
  const key = "toc_tai_support_visitor";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.localStorage.setItem(key, value);
  return value;
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<SupportThread | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const hidden = pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register");
  const currentVisitor = useMemo(() => (typeof window === "undefined" ? "" : visitorId()), []);

  const load = useCallback(async () => {
    if (!currentVisitor || hidden) return;
    const response = await fetch(`/api/support?visitorId=${encodeURIComponent(currentVisitor)}`, { cache: "no-store" });
    const payload = await response.json();
    if (payload.data) {
      setThread(payload.data);
      setName(payload.data.customerName === "Khách hàng" ? "" : payload.data.customerName);
      setPhone(payload.data.phone ?? "");
    }
  }, [currentVisitor, hidden]);

  useEffect(() => {
    const start = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), open ? 8000 : 18000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [load, open]);

  async function send() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: thread?._id,
          visitorId: currentVisitor,
          customerName: name || "Khách hàng",
          phone,
          body,
        }),
      });
      const payload = await response.json();
      if (response.ok) {
        setThread(payload.data);
        setBody("");
      }
    } finally {
      setSending(false);
    }
  }

  if (hidden) return null;

  return (
    <div className={styles.widget}>
      {!open ? (
        <button className={styles.launcher} onClick={() => setOpen(true)}>
          <MessageCircle size={20} /> Chat hỗ trợ
          {(thread?.unreadForCustomer ?? 0) > 0 && <b>{thread?.unreadForCustomer}</b>}
        </button>
      ) : (
        <section className={styles.panel}>
          <header className={styles.header}>
            <div>
              <span>CAREWISE SUPPORT</span>
              <h2>Hỗ trợ nhanh</h2>
              <p>Gửi câu hỏi về sản phẩm, đơn hàng hoặc thanh toán.</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Đóng chat">
              <X size={18} />
            </button>
          </header>
          <div className={styles.messages}>
            {!thread?.messages?.length ? (
              <div className={styles.empty}>Bạn nhắn ở đây, admin sẽ nhận trong hộp thư hỗ trợ.</div>
            ) : (
              thread.messages.map((message) => (
                <div
                  className={`${styles.bubble} ${message.senderRole === "customer" ? styles.mine : ""}`}
                  key={message._id ?? `${message.createdAt}-${message.body}`}
                >
                  <small>{message.senderRole === "customer" ? "Bạn" : "CareWise"}</small>
                  {message.body}
                </div>
              ))
            )}
          </div>
          {!thread && (
            <div className={styles.identity}>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" />
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Số điện thoại" />
            </div>
          )}
          <div className={styles.composer}>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nhập tin nhắn hỗ trợ..." />
            <div className={styles.composerFooter}>
              <span>Phản hồi sẽ hiện ngay trong khung này.</span>
              <button disabled={sending || !body.trim()} onClick={() => void send()}>
                <Send size={15} /> Gửi
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
