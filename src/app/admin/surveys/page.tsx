"use client";

import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";
import { showToast } from "@/components/ui/Toast";
import { extractApiError } from "@/lib/client/errors";
import {
  DEFAULT_QUIZ_CONFIG,
  normalizeQuizConfig,
  type QuizConfig,
  type QuizQuestion,
} from "@/lib/hairQuiz";

const AUTO_VALUE_PATTERN = /^option_\d+$/;

// Mã lưu vào CSDL luôn là chuỗi ngắn không dấu; admin chỉ cần gõ nhãn tiếng Việt.
const toOptionCode = (label: string) =>
  label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .split("_")
    .slice(0, 3)
    .join("_")
    .slice(0, 24);

const newQuestion = (): QuizQuestion => ({
  id: `custom_${Date.now()}`,
  title: "",
  eyebrow: "",
  hint: "",
  weight: 1,
  allowSkip: false,
  skipValue: "",
  options: [{ value: "option_1", label: "", hint: "" }],
});

export default function AdminSurveysPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_QUIZ_CONFIG);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setConfig(normalizeQuizConfig(body.data?.quizConfig)))
      .finally(() => setLoading(false));
  }, []);

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setConfig((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizConfig: normalizeQuizConfig(config) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Lưu khảo sát thất bại"));
      setConfig(normalizeQuizConfig(body.data.quizConfig));
      setMessage("Đã lưu cấu hình khảo sát.");
      showToast("Đã lưu cấu hình khảo sát.", "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Lưu khảo sát thất bại";
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell breadcrumb="Khảo sát">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / KHẢO SÁT</p>
          <h1>Cấu hình khảo sát gợi ý sản phẩm</h1>
          <span className="banner-subtitle">
            Chỉnh câu hỏi, lựa chọn và trọng số để hệ thống tự xếp hạng sản phẩm phù hợp.
          </span>
        </div>
        <div className={panel.headerActions}>
          <button type="button" className={panel.secondaryButton} onClick={() => setConfig(DEFAULT_QUIZ_CONFIG)}>
            <RefreshCw size={14} /> Khôi phục mặc định
          </button>
          <button type="button" className={panel.primaryButton} disabled={saving} onClick={() => void save()}>
            <Save size={14} /> {saving ? "Đang lưu..." : "Lưu khảo sát"}
          </button>
        </div>
      </div>

      {message && <p className={panel.message}>{message}</p>}
      {loading ? (
        <p className={panel.empty}>Đang tải khảo sát...</p>
      ) : (
        <div className={panel.panel}>
          <div className={panel.panelPad}>
            <div className={panel.grid2}>
              <label>
                Tiêu đề nội bộ
                <input value={config.title ?? ""} onChange={(event) => setConfig({ ...config, title: event.target.value })} />
              </label>
              <label>
                Ghi chú cho admin
                <input value={config.lead ?? ""} onChange={(event) => setConfig({ ...config, lead: event.target.value })} />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button
                type="button"
                className={panel.secondaryButton}
                onClick={() => setConfig({ ...config, questions: [...config.questions, newQuestion()] })}
              >
                <Plus size={14} /> Thêm câu hỏi
              </button>
            </div>

            {config.questions.map((question, index) => (
              <div className={panel["admin-repeat-card"]} key={`${question.id}-${index}`}>
                <div className={panel["admin-repeat-head"]}>
                  <b>Câu hỏi {index + 1}</b>
                  <button
                    type="button"
                    className={panel.dangerButton}
                    onClick={() =>
                      setConfig({
                        ...config,
                        questions: config.questions.filter((_, questionIndex) => questionIndex !== index),
                      })
                    }
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                </div>
                <div className={panel.grid3}>
                  <label>
                    ID gắn tag
                    <input value={question.id} onChange={(event) => updateQuestion(index, { id: event.target.value })} placeholder="vd: goals" />
                  </label>
                  <label>
                    Nhãn bước
                    <input value={question.eyebrow ?? ""} onChange={(event) => updateQuestion(index, { eyebrow: event.target.value })} />
                  </label>
                  <label>
                    Trọng số
                    <input type="number" min={1} max={10} value={question.weight ?? 1} onChange={(event) => updateQuestion(index, { weight: Number(event.target.value) })} />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Câu hỏi
                    <input value={question.title} onChange={(event) => updateQuestion(index, { title: event.target.value })} />
                  </label>
                  <label style={{ gridColumn: "1 / -1" }}>
                    Mô tả ngắn
                    <input value={question.hint ?? ""} onChange={(event) => updateQuestion(index, { hint: event.target.value })} />
                  </label>
                </div>
                <label className={panel["admin-checkbox"]}>
                  <input type="checkbox" checked={question.allowSkip ?? false} onChange={(event) => updateQuestion(index, { allowSkip: event.target.checked })} />
                  Cho phép khách bỏ qua/không chắc
                </label>
                {question.allowSkip && (
                  <label>
                    Giá trị dùng khi bỏ qua
                    <input value={question.skipValue ?? ""} onChange={(event) => updateQuestion(index, { skipValue: event.target.value })} placeholder="Để trống nếu muốn lưu là chưa xác định" />
                  </label>
                )}

                {question.options.map((option, optionIndex) => (
                  <div
                    className={`${panel["admin-option-row"]} ${panel["admin-option-row-code"]}`}
                    key={`${question.id}-option-${optionIndex}`}
                  >
                    <input
                      className={panel["admin-option-code"]}
                      placeholder="Mã lưu"
                      title="Mã ngắn không dấu lưu vào CSDL — tự sinh từ nhãn tiếng Việt, có thể sửa lại"
                      value={option.value}
                      onChange={(event) =>
                        updateQuestion(index, {
                          options: question.options.map((item, childIndex) =>
                            childIndex === optionIndex ? { ...item, value: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <input
                      placeholder="Nhãn hiển thị (tiếng Việt)"
                      value={option.label}
                      onChange={(event) => {
                        const label = event.target.value;
                        const autoValue = !option.value.trim() || AUTO_VALUE_PATTERN.test(option.value) || option.value === toOptionCode(option.label);
                        updateQuestion(index, {
                          options: question.options.map((item, childIndex) =>
                            childIndex === optionIndex
                              ? { ...item, label, value: autoValue ? toOptionCode(label) || item.value : item.value }
                              : item,
                          ),
                        });
                      }}
                    />
                    <input
                      placeholder="Gợi ý phụ"
                      value={option.hint ?? ""}
                      onChange={(event) =>
                        updateQuestion(index, {
                          options: question.options.map((item, childIndex) =>
                            childIndex === optionIndex ? { ...item, hint: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      className={panel.dangerButton}
                      onClick={() =>
                        updateQuestion(index, {
                          options: question.options.filter((_, childIndex) => childIndex !== optionIndex),
                        })
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={panel.ghostButton}
                  style={{ marginTop: 12 }}
                  onClick={() =>
                    updateQuestion(index, {
                      options: [
                        ...question.options,
                        { value: `option_${question.options.length + 1}`, label: "", hint: "" },
                      ],
                    })
                  }
                >
                  <Plus size={14} /> Thêm lựa chọn
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
