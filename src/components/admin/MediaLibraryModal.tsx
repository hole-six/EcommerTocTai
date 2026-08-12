"use client";

import { Check, Loader2, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MediaItem = { _id: string; url: string; originalName: string; size: number };

export function MediaLibraryModal({
  multiple = false,
  initialSelected = [],
  onClose,
  onSelect,
}: {
  multiple?: boolean;
  initialSelected?: string[];
  onClose: () => void;
  onSelect: (urls: string[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load(query?: string) {
    fetch(`/api/admin/uploads${query ? `?search=${encodeURIComponent(query)}` : ""}`)
      .then((response) => response.json())
      .then((body) => setItems(body.data ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function uploadFiles(files: FileList) {
    setUploadingCount(files.length);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
        const body = await response.json();
        if (response.ok) {
          setItems((current) => [{ _id: body.data._id, url: body.data.url, originalName: file.name, size: file.size }, ...current]);
          uploaded.push(body.data.url);
        }
      } catch { /* skip failed file */ }
      setUploadingCount((current) => current - 1);
    }
    setSelected((current) => (multiple ? [...uploaded, ...current] : uploaded.slice(0, 1)));
  }

  function toggle(url: string) {
    setSelected((current) => {
      if (multiple) return current.includes(url) ? current.filter((item) => item !== url) : [...current, url];
      return current[0] === url ? [] : [url];
    });
  }

  async function remove(id: string, url: string) {
    if (!confirm("Xóa ảnh này khỏi thư viện?")) return;
    const response = await fetch(`/api/admin/uploads/${id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item._id !== id));
      setSelected((current) => current.filter((item) => item !== url));
    }
  }

  function confirm_() {
    onSelect(selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[var(--admin-ink)]">Thư viện ảnh</h2>
            <p className="mt-0.5 text-xs text-[var(--admin-faint)]">{multiple ? "Chọn một hoặc nhiều ảnh" : "Chọn một ảnh"} để sử dụng, hoặc tải ảnh mới lên.</p>
          </div>
          <button onClick={onClose} aria-label="Đóng" className="grid h-8 w-8 place-items-center rounded-full text-[var(--admin-faint)] hover:bg-[var(--admin-soft)]"><X size={18} /></button>
        </div>

        <div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-5 py-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingCount > 0}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
            style={{ background: "var(--admin-blue)" }}
          >
            {uploadingCount > 0 ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploadingCount > 0 ? `Đang tải ${uploadingCount} ảnh…` : "Tải ảnh lên"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(event) => { const files = event.target.files; if (files?.length) void uploadFiles(files); event.currentTarget.value = ""; }} />
          <label className="ml-auto flex min-w-[220px] items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2">
            <Search size={14} className="text-[var(--admin-faint)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm ảnh theo tên..." className="w-full bg-transparent text-xs text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-faint)]" />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && <p className="py-16 text-center text-xs text-[var(--admin-faint)]">Đang tải thư viện…</p>}
          {!loading && items.length === 0 && (
            <div className="py-16 text-center text-xs text-[var(--admin-faint)]">
              Thư viện chưa có ảnh nào. Bấm &quot;Tải ảnh lên&quot; để bắt đầu.
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {items.map((item) => {
              const isSelected = selected.includes(item.url);
              return (
                <button
                  key={item._id}
                  onClick={() => toggle(item.url)}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 bg-[var(--admin-soft)]"
                  style={{ borderColor: isSelected ? "var(--admin-blue)" : "transparent" }}
                  title={item.originalName}
                >
                  <img src={item.url} alt={item.originalName} className="h-full w-full object-cover" />
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "var(--admin-blue)" }}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={-1}
                    onClick={(event) => { event.stopPropagation(); void remove(item._id, item.url); }}
                    className="absolute bottom-1.5 right-1.5 hidden h-6 w-6 place-items-center rounded-full bg-black/60 text-white group-hover:grid"
                    aria-label="Xóa ảnh"
                  >
                    <Trash2 size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-5 py-4">
          <span className="text-xs font-semibold text-[var(--admin-muted)]">{selected.length > 0 ? `Đã chọn ${selected.length} ảnh` : "Chưa chọn ảnh nào"}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-xs font-semibold text-[var(--admin-ink)]">Hủy</button>
            <button onClick={confirm_} disabled={selected.length === 0} className="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-40" style={{ background: "var(--admin-blue)" }}>Dùng ảnh đã chọn</button>
          </div>
        </div>
      </div>
    </div>
  );
}
