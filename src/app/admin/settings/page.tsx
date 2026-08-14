"use client";

import { HelpCircle, Plus, Save, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { emptyItem, ItemEditor, type Item } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";
import { showToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/client/errors";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [shippingFee, setShippingFee] = useState("30000");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState("200000");
  const [faqs, setFaqs] = useState<Item[]>([]);
  const [whyChooseUs, setWhyChooseUs] = useState<Item[]>([]);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((body) => {
        if (body.data) {
          setShippingFee(String(body.data.shippingFee));
          setFreeShippingThreshold(String(body.data.freeShippingThreshold));
          setFaqs(body.data.faqs ?? []);
          setWhyChooseUs(body.data.whyChooseUs ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function updateItem(list: Item[], setList: (next: Item[]) => void, index: number, patch: Partial<Item>) {
    setList(list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingFee: Number(shippingFee),
          freeShippingThreshold: Number(freeShippingThreshold),
          faqs,
          whyChooseUs,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Lưu thất bại"));
      setShippingFee(String(body.data.shippingFee));
      setFreeShippingThreshold(String(body.data.freeShippingThreshold));
      setFaqs(body.data.faqs ?? []);
      setWhyChooseUs(body.data.whyChooseUs ?? []);
      setMessage("Đã lưu cấu hình.");
      showToast("Đã lưu cấu hình.", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lưu thất bại";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
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
        <>
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
                  toán.
                </span>
              </div>
            </div>
            <div className={panel.grid2}>
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
              <label>
                Miễn phí vận chuyển từ đơn (đ)
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={freeShippingThreshold}
                  onChange={(event) =>
                    setFreeShippingThreshold(event.target.value)
                  }
                  placeholder="200000"
                />
              </label>
            </div>
            <p
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--admin-muted, #667085)",
              }}
            >
              Đơn hàng có tạm tính từ{" "}
              <b>
                {Number(freeShippingThreshold || 0).toLocaleString("vi-VN")}đ
              </b>{" "}
              trở lên sẽ được miễn phí vận chuyển tự động. Dưới mức đó, khách
              trả <b>{Number(shippingFee || 0).toLocaleString("vi-VN")}đ</b>{" "}
              phí ship. Ngoài ra khách vẫn có thể dùng mã giảm giá (VD:
              FREESHIP) để được miễn phí ship dù chưa đạt ngưỡng.
            </p>
          </div>
        </div>

        <div className={panel.panel} style={{ marginTop: 20 }}>
          <div className={panel.panelPad}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <HelpCircle size={18} />
              <div>
                <b style={{ display: "block", fontSize: 14 }}>
                  Câu hỏi thường gặp (FAQ)
                </b>
                <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                  Hiện giống nhau ở mọi trang chi tiết sản phẩm, phía dưới phần đánh giá.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: faqs.length ? 14 : 0 }}>
              <button
                type="button"
                className={panel.secondaryButton}
                onClick={() => setFaqs([...faqs, emptyItem()])}
              >
                <Plus size={14} /> Thêm câu hỏi
              </button>
            </div>
            {faqs.map((item, index) => (
              <ItemEditor
                key={index}
                item={item}
                heading={`Câu hỏi ${index + 1}`}
                onChange={(patch) => updateItem(faqs, setFaqs, index, patch)}
                onRemove={() => setFaqs(faqs.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            {!faqs.length && (
              <p className={panel.empty} style={{ padding: "20px 0" }}>
                Chưa có câu hỏi nào. Bấm &quot;Thêm câu hỏi&quot; để bắt đầu (dùng ô Tiêu đề
                cho câu hỏi, ô Mô tả cho câu trả lời).
              </p>
            )}
          </div>
        </div>

        <div className={panel.panel} style={{ marginTop: 20 }}>
          <div className={panel.panelPad}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <ShieldCheck size={18} />
              <div>
                <b style={{ display: "block", fontSize: 14 }}>
                  Tại sao nên chọn CareWise
                </b>
                <span style={{ fontSize: 12, color: "var(--admin-muted, #667085)" }}>
                  3 lý do / điểm mạnh, hiện giống nhau ở mọi trang chi tiết sản phẩm.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: whyChooseUs.length ? 14 : 0 }}>
              <button
                type="button"
                className={panel.secondaryButton}
                onClick={() => setWhyChooseUs([...whyChooseUs, emptyItem()])}
              >
                <Plus size={14} /> Thêm lý do
              </button>
            </div>
            {whyChooseUs.map((item, index) => (
              <ItemEditor
                key={index}
                item={item}
                heading={`Lý do ${index + 1}`}
                onChange={(patch) => updateItem(whyChooseUs, setWhyChooseUs, index, patch)}
                onRemove={() => setWhyChooseUs(whyChooseUs.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
            {!whyChooseUs.length && (
              <p className={panel.empty} style={{ padding: "20px 0" }}>
                Chưa có lý do nào. Bấm &quot;Thêm lý do&quot; để bắt đầu.
              </p>
            )}
          </div>
        </div>

        <button
          className={panel.saveButton}
          disabled={saving}
          onClick={() => void save()}
          style={{ marginTop: 20 }}
        >
          {saving ? (
            "Đang lưu..."
          ) : (
            <>
              <Save size={14} /> Lưu cấu hình
            </>
          )}
        </button>
      </>
      )}
    </AdminShell>
  );
}
