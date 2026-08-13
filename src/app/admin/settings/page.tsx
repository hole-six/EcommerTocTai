"use client";

import { Save, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingFee, setShippingFee] = useState("30000");

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((body) => {
        if (body.data) {
          setShippingFee(String(body.data.shippingFee));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: Number(shippingFee),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Lưu thất bại");
      setShippingFee(String(body.data.shippingFee));
      setMessage("Đã lưu cấu hình phí vận chuyển.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell breadcrumb="Cấu hình hệ thống">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / VẬN HÀNH</p>
          <h1>Cấu hình hệ thống</h1>
          <span className="banner-subtitle">
            Chỉnh các thông số áp dụng cho toàn bộ đơn hàng, không cần sửa code.
          </span>
        </div>
      </div>
      {message && <p className={panel.message}>{message}</p>}
      {loading ? (
        <p className={panel.empty}>Đang tải cấu hình...</p>
      ) : (
        <div className={panel.panel}>
          <div className={panel.panelPad}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Truck size={18} />
              <div>
                <b style={{ display: "block", fontSize: 14 }}>
                  Phí vận chuyển
                </b>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--admin-muted, #667085)",
                  }}
                >
                  Áp dụng cho mọi đơn hàng khi tính tổng tiền ở trang thanh
                  toán. Muốn miễn phí ship theo đơn thì dùng mã giảm giá
                  FREESHIP ở trang Mã giảm giá — khách phải tự nhập mã mới
                  được miễn.
                </span>
              </div>
            </div>
            <label>
              Phí vận chuyển mặc định (đ)
              <input
                type="number"
                min={0}
                step={1000}
                value={shippingFee}
                onChange={(event) => setShippingFee(event.target.value)}
                placeholder="30000"
              />
            </label>
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--admin-muted, #667085)",
              }}
            >
              Mọi đơn hàng đều tính{" "}
              <b>{Number(shippingFee || 0).toLocaleString("vi-VN")}đ</b> phí
              ship, không phân biệt giá trị đơn.
            </p>
            <button
              className={panel.saveButton}
              disabled={saving}
              onClick={() => void save()}
              style={{ marginTop: 14 }}
            >
              {saving ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save size={14} /> Lưu cấu hình
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
