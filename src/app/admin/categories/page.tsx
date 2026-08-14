"use client";

import { Edit3, FolderTree, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableToolbar } from "@/components/admin/AdminTableTools";
import { UploadField } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";
import { extractApiError } from "@/lib/client/errors";
import styles from "./categories.module.css";

type Category = {
  _id: string;
  parent: string | null;
  name: string;
  slug: string;
  description: string;
  image: string;
  bannerImage: string;
  isActive: boolean;
  sortOrder: number;
};
type CategoryTree = Category & { children: Category[] };
type Form = {
  name: string;
  slug: string;
  parent: string;
  description: string;
  image: string;
  bannerImage: string;
  isActive: boolean;
  sortOrder: number;
};

const emptyForm: Form = {
  name: "",
  slug: "",
  parent: "",
  description: "",
  image: "",
  bannerImage: "",
  isActive: true,
  sortOrder: 0,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalize(value: string) {
  return value.toLocaleLowerCase("vi-VN");
}

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  function load() {
    setLoading(true);
    fetch("/api/categories?tree=true")
      .then((response) => response.json())
      .then((body) => setTree(body.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const roots = tree.map((category) => ({
    _id: category._id,
    name: category.name,
  }));
  const parentName = roots.find((root) => root._id === form.parent)?.name;
  const childCount = tree.reduce(
    (total, category) => total + category.children.length,
    0,
  );
  const filteredTree = useMemo(() => {
    const term = normalize(search.trim());
    return tree
      .map((root) => {
        const rootMatches =
          !term || normalize(`${root.name} ${root.slug}`).includes(term);
        const children = root.children.filter((child) => {
          const matchesSearch =
            !term || normalize(`${child.name} ${child.slug}`).includes(term);
          const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && child.isActive) ||
            (statusFilter === "hidden" && !child.isActive);
          return matchesSearch && matchesStatus;
        });
        const rootStatusMatches =
          statusFilter === "all" ||
          (statusFilter === "active" && root.isActive) ||
          (statusFilter === "hidden" && !root.isActive);
        if ((rootMatches && rootStatusMatches) || children.length > 0) {
          return { ...root, children: rootMatches ? children : children };
        }
        return null;
      })
      .filter(Boolean) as CategoryTree[];
  }, [search, statusFilter, tree]);

  function resetForm() {
    setForm(emptyForm);
    setSlugTouched(false);
    setEditingId(null);
    setDrawerOpen(false);
  }

  function addRoot() {
    resetForm();
    setDrawerOpen(true);
  }

  function addChild(parentId: string) {
    setForm({ ...emptyForm, parent: parentId });
    setSlugTouched(false);
    setEditingId(null);
    setDrawerOpen(true);
  }

  function edit(category: Category) {
    setForm({
      name: category.name,
      slug: category.slug,
      parent: category.parent ?? "",
      description: category.description,
      image: category.image,
      bannerImage: category.bannerImage,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setSlugTouched(true);
    setEditingId(category._id);
    setDrawerOpen(true);
  }

  async function submit() {
    setMessage("");
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      const response = await fetch(
        editingId ? `/api/categories/${editingId}` : "/api/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Lưu danh mục thất bại"));
      setMessage(editingId ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
      resetForm();
      load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Lưu danh mục thất bại",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Xóa danh mục này? Danh mục con nếu có sẽ không tự động bị xóa.",
      )
    )
      return;
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const body = await response.json();
    if (response.ok) {
      setMessage("Đã xóa danh mục.");
      load();
    } else {
      setMessage(extractApiError(body, "Không thể xóa danh mục."));
    }
  }

  return (
    <AdminShell breadcrumb="Danh mục">
      <div className={panel.header}>
        <div>
          <p>THƯƠNG MẠI / DANH MỤC</p>
          <h1>Danh mục cha & danh mục con</h1>
        </div>
        <button className={panel.primaryButton} onClick={addRoot}>
          <Plus size={14} /> Danh mục cha mới
        </button>
      </div>

      <div className={styles.layout}>
        <div className={panel.panel}>
          {!loading && tree.length > 0 && (
            <>
              <div className={styles.treeIntro}>
                <div>
                  <span className={styles.treeEyebrow}>SƠ ĐỒ DANH MỤC</span>
                  <h2>Sơ đồ danh mục</h2>
                  <p>
                    {tree.length} danh mục cha · {childCount} danh mục con
                  </p>
                </div>
                <span className={styles.treeLegend}>
                  <i /> Đang hiển thị
                </span>
              </div>
              <AdminTableToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Tìm tên danh mục hoặc slug..."
                filters={
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hiển thị</option>
                    <option value="hidden">Đã ẩn</option>
                  </select>
                }
                right={<strong>{filteredTree.length} nhóm</strong>}
              />
            </>
          )}
          {!loading && tree.length === 0 && (
            <div className={panel.empty}>
              <FolderTree size={28} style={{ opacity: 0.35, marginBottom: 10 }} />
              <p style={{ margin: "0 0 12px" }}>
                Chưa có danh mục nào. Tạo danh mục cha trước, sau đó thêm danh
                mục con bên trong.
              </p>
              <button className={panel.primaryButton} onClick={addRoot}>
                <Plus size={14} /> Tạo danh mục cha đầu tiên
              </button>
            </div>
          )}
          {loading && <p className={panel.empty}>Đang tải...</p>}
          {!loading && tree.length > 0 && filteredTree.length === 0 && (
            <p className={panel.empty}>Không có danh mục phù hợp.</p>
          )}
          {!loading && filteredTree.length > 0 && (
            <div className={styles.tree}>
              {filteredTree.map((root) => (
                <div key={root._id} className={styles.node}>
                  <div className={styles.nodeRow}>
                    <div className={styles.nodeInfo}>
                      <b>{root.name}</b>
                      <span className={styles.slug}>/{root.slug}</span>
                      <span
                        className={`${panel.status} ${
                          root.isActive ? panel.green : panel.gray
                        }`}
                      >
                        {root.isActive ? "Hoạt động" : "Ẩn"}
                      </span>
                    </div>
                    <div className={panel.tableActions}>
                      <button
                        className={`${panel.iconButton} ${panel.editButton}`}
                        onClick={() => addChild(root._id)}
                      >
                        <Plus size={14} /> Con
                      </button>
                      <button
                        className={`${panel.iconButton} ${panel.editButton}`}
                        onClick={() => edit(root)}
                      >
                        <Edit3 size={14} /> Sửa
                      </button>
                      <button
                        className={`${panel.iconButton} ${panel.dangerIconButton}`}
                        onClick={() => void remove(root._id)}
                        aria-label="Xóa danh mục"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {root.children.length > 0 && (
                    <div className={styles.children}>
                      {root.children.map((child) => (
                        <div key={child._id} className={styles.childRow}>
                          <div className={styles.nodeInfo}>
                            <span className={styles.childName}>{child.name}</span>
                            <span className={styles.slug}>/{child.slug}</span>
                            <span
                              className={`${panel.status} ${
                                child.isActive ? panel.green : panel.gray
                              }`}
                            >
                              {child.isActive ? "Hoạt động" : "Ẩn"}
                            </span>
                          </div>
                          <div className={panel.tableActions}>
                            <button
                              className={`${panel.iconButton} ${panel.editButton}`}
                              onClick={() => edit(child)}
                            >
                              <Edit3 size={14} /> Sửa
                            </button>
                            <button
                              className={`${panel.iconButton} ${panel.dangerIconButton}`}
                              onClick={() => void remove(child._id)}
                              aria-label="Xóa danh mục con"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside
          className={`${panel.panel} ${styles.drawer} ${
            drawerOpen ? styles.drawerOpen : ""
          }`}
          aria-hidden={!drawerOpen}
        >
          <div className={panel.panelPad}>
            <div className={styles.drawerTitle}>
              <span className={styles.drawerEyebrow}>
                {editingId ? "SỬA DANH MỤC" : "DANH MỤC MỚI"}
              </span>
              <h3>
                {editingId
                  ? "Sửa danh mục"
                  : form.parent
                    ? "Thêm danh mục con"
                    : "Tạo danh mục cha mới"}
              </h3>
              <p>Thiết lập thông tin và hình ảnh hiển thị.</p>
            </div>
            <div className={styles.drawerHeader}>
              <button
                className={styles.closeDrawer}
                onClick={resetForm}
                aria-label="Đóng form"
              >
                <X size={18} />
              </button>
            </div>
            {!editingId && form.parent && (
              <div className={styles.parentBadge}>
                Thuộc danh mục cha: <b>{parentName}</b>
                <button
                  onClick={() =>
                    setForm((current) => ({ ...current, parent: "" }))
                  }
                  aria-label="Bỏ chọn danh mục cha"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <div className={styles.formGrid}>
              <label>
                Tên danh mục
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name,
                      slug: slugTouched ? current.slug : slugify(name),
                    }));
                  }}
                  placeholder={form.parent ? "vd: Bộ chăm sóc" : "vd: Tóc"}
                />
              </label>
              <div className={styles.drawerSectionLabel}>Thông tin chính</div>
              <label>
                Slug
                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }));
                  }}
                />
              </label>
              <label>
                Danh mục cha
                <select
                  value={form.parent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      parent: event.target.value,
                    }))
                  }
                >
                  <option value="">Không, đây là danh mục cha</option>
                  {roots
                    .filter((root) => root._id !== editingId)
                    .map((root) => (
                      <option key={root._id} value={root._id}>
                        {root.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Thứ tự hiển thị
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Mô tả
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={2}
                />
              </label>
              <label>
                Ảnh đại diện
                <UploadField
                  value={form.image}
                  onChange={(image) =>
                    setForm((current) => ({ ...current, image }))
                  }
                  label="Upload ảnh đại diện"
                />
              </label>
              <label>
                Ảnh banner
                <UploadField
                  value={form.bannerImage}
                  onChange={(bannerImage) =>
                    setForm((current) => ({ ...current, bannerImage }))
                  }
                  label="Upload ảnh banner"
                />
              </label>
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Hiển thị danh mục này
              </label>
            </div>
            {message && <p className={panel.message}>{message}</p>}
          </div>
          <footer className={styles.drawerFooter}>
            <button className={styles.drawerCancel} onClick={resetForm}>
              Đóng
            </button>
            <button
              className={panel.saveButton}
              disabled={saving || !form.name || !form.slug}
              onClick={() => void submit()}
            >
              {saving
                ? "Đang lưu..."
                : editingId
                  ? "Cập nhật danh mục"
                  : form.parent
                    ? "Tạo danh mục con"
                    : "Tạo danh mục cha"}
            </button>
          </footer>
        </aside>
      </div>
      {drawerOpen && (
        <button
          className={styles.drawerBackdrop}
          onClick={resetForm}
          aria-label="Đóng form danh mục"
        />
      )}
    </AdminShell>
  );
}
