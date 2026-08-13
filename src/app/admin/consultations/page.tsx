"use client";

import { Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminPagination,
  AdminTableToolbar,
} from "@/components/admin/AdminTableTools";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./consultations.module.css";

type ConsultationStatus = "submitted" | "contacted" | "completed" | "cancelled";

type Consultation = {
  _id: string;
  customer?: { fullName?: string; phone?: string; email?: string };
  answers?: Record<string, string>;
  images?: string[];
  appointment?: { mode?: string; language?: string; date?: string; time?: string };
  status: ConsultationStatus;
  createdAt: string;
};

const PAGE_SIZE = 10;
const statusLabel: Record<ConsultationStatus, string> = {
  submitted: "Mới gửi",
  contacted: "Đã liên hệ",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};
const statusTone: Record<ConsultationStatus, string> = {
  submitted: "blue",
  contacted: "orange",
  completed: "green",
  cancelled: "gray",
};

function normalize(value: string) {
  return value.toLocaleLowerCase("vi-VN");
}

export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, ConsultationStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  function load() {
    setLoading(true);
    fetch("/api/consultations?page=1&limit=300")
      .then((response) => response.json())
      .then((body) => setItems(body.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = normalize(search.trim());
    return items.filter((item) => {
      const searchable = normalize(
        [
          item.customer?.fullName,
          item.customer?.phone,
          item.customer?.email,
          Object.values(item.answers ?? {}).join(" "),
        ]
          .filter(Boolean)
          .join(" "),
      );
      return (
        (!term || searchable.includes(term)) &&
        (status === "all" || item.status === status)
      );
    });
  }, [items, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function saveStatus(item: Consultation) {
    const nextStatus = drafts[item._id];
    if (!nextStatus || nextStatus === item.status) return;
    setSavingId(item._id);
    setMessage("");
    try {
      const response = await fetch(`/api/consultations/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Cập nhật thất bại");
      setItems((current) =>
        current.map((entry) => (entry._id === item._id ? body.data : entry)),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[item._id];
        return next;
      });
      setMessage("Đã cập nhật trạng thái tư vấn.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setSavingId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa phiếu tư vấn này?")) return;
    setMessage("");
    const response = await fetch(`/api/consultations/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Không thể xóa phiếu tư vấn.");
      return;
    }
    setItems((current) => current.filter((item) => item._id !== id));
  }

  return (
    <AdminShell breadcrumb="Tư vấn tóc">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / TƯ VẤN</p>
          <h1>Tư vấn tóc</h1>
        </div>
      </div>

      <div className={panel.panel}>
        <AdminTableToolbar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Tìm khách hàng, số điện thoại hoặc câu trả lời..."
          filters={
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="submitted">Mới gửi</option>
              <option value="contacted">Đã liên hệ</option>
              <option value="completed">Hoàn tất</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          }
          right={<strong>{filtered.length} phiếu</strong>}
        />
        <div className={panel.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Câu trả lời</th>
                <th>Lịch hẹn</th>
                <th>Ảnh</th>
                <th>Trạng thái</th>
                <th>Ngày gửi</th>
                <th className={panel.rightCell}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item._id}>
                  <td data-label="Khách hàng">
                    <b>{item.customer?.fullName ?? "-"}</b>
                    <small>{item.customer?.phone}</small>
                    <small>{item.customer?.email}</small>
                  </td>
                  <td data-label="Câu trả lời" className={styles.answerCell}>
                    {Object.entries(item.answers ?? {})
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <span key={key}>
                          <b>{key}:</b> {value}
                        </span>
                      ))}
                  </td>
                  <td data-label="Lịch hẹn">
                    {item.appointment?.mode === "schedule"
                      ? `${item.appointment.date ?? ""} ${
                          item.appointment.time ?? ""
                        }`
                      : "Gọi ngay 3-5 phút"}
                  </td>
                  <td data-label="Ảnh">{item.images?.length ?? 0}/2</td>
                  <td data-label="Trạng thái">
                    <select
                      value={drafts[item._id] ?? item.status}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item._id]: event.target.value as ConsultationStatus,
                        }))
                      }
                    >
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <span
                      className={`${panel.status} ${
                        panel[statusTone[item.status]]
                      } ${styles.statusPill}`}
                    >
                      {statusLabel[item.status]}
                    </span>
                  </td>
                  <td data-label="Ngày gửi">{new Date(item.createdAt).toLocaleString("vi-VN")}</td>
                  <td data-full="true">
                    <div className={panel.tableActions}>
                      <button
                        className={`${panel.iconButton} ${panel.editButton}`}
                        disabled={!drafts[item._id] || savingId === item._id}
                        onClick={() => void saveStatus(item)}
                      >
                        <Save size={14} />
                        {savingId === item._id ? "Đang lưu" : "Lưu"}
                      </button>
                      <button
                        className={`${panel.iconButton} ${panel.dangerIconButton}`}
                        onClick={() => void remove(item._id)}
                        aria-label="Xóa phiếu tư vấn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && (
            <p className={panel.empty}>Không có phiếu tư vấn phù hợp.</p>
          )}
          {loading && <p className={panel.empty}>Đang tải...</p>}
        </div>
        {!loading && filtered.length > 0 && (
          <AdminPagination
            page={page}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </div>
      {message && <p className={panel.message}>{message}</p>}
    </AdminShell>
  );
}
