"use client";

import { FolderTree, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { UploadField } from "@/components/admin/ProductForm";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./categories.module.css";

type Category = { _id: string; parent: string | null; name: string; slug: string; description: string; image: string; bannerImage: string; isActive: boolean; sortOrder: number };
type CategoryTree = Category & { children: Category[] };
type Form = { name: string; slug: string; parent: string; description: string; image: string; bannerImage: string; isActive: boolean; sortOrder: number };

const emptyForm: Form = { name: "", slug: "", parent: "", description: "", image: "", bannerImage: "", isActive: true, sortOrder: 0 };
const slugify = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/categories?tree=true").then((response) => response.json()).then((body) => setTree(body.data ?? [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const roots = tree.map((category) => ({ _id: category._id, name: category.name }));
  const parentName = roots.find((root) => root._id === form.parent)?.name;

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
    setForm({ name: category.name, slug: category.slug, parent: category.parent ?? "", description: category.description, image: category.image, bannerImage: category.bannerImage, isActive: category.isActive, sortOrder: category.sortOrder });
    setSlugTouched(true);
    setEditingId(category._id);
    setDrawerOpen(true);
  }

  async function submit() {
    setMessage("");
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      const response = await fetch(editingId ? `/api/categories/${editingId}` : "/api/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Lưu danh mục thất bại");
      setMessage(editingId ? "Đã cập nhật danh mục." : "Đã tạo danh mục mới.");
      resetForm();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lưu danh mục thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa danh mục này? Danh mục con (nếu có) sẽ không tự động bị xóa.")) return;
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const body = await response.json();
    if (response.ok) { setMessage("Đã xóa danh mục."); load(); } else setMessage(body.error);
  }

  return (
    <AdminShell breadcrumb="Danh mục">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / DANH MỤC</p>
          <h1>Danh mục cha &amp; danh mục con</h1>
        </div>
        <button className={panel.primaryButton} onClick={addRoot}><Plus size={14} /> Danh mục cha mới</button>
      </div>

      <div className={styles.layout}>
        <div className={panel.panel}>
          {!loading && tree.length > 0 && <div className={styles.treeIntro}><div><span className={styles.treeEyebrow}>CATEGORY ARCHITECTURE</span><h2>Sơ đồ danh mục</h2><p>{tree.length} danh mục cha · {tree.reduce((total, category) => total + category.children.length, 0)} danh mục con</p></div><span className={styles.treeLegend}><i /> Đang hiển thị</span></div>}
          {!loading && tree.length === 0 && (
            <div className={panel.empty}>
              <FolderTree size={28} style={{ opacity: .35, marginBottom: 10 }} />
              <p style={{ margin: "0 0 12px" }}>Chưa có danh mục nào. Tạo danh mục cha trước, sau đó thêm danh mục con bên trong nó.</p>
              <button className={panel.primaryButton} onClick={addRoot} style={{ margin: "0 auto" }}><Plus size={14} /> Tạo danh mục cha đầu tiên</button>
            </div>
          )}
          {loading && <p className={panel.empty}>Đang tải…</p>}
          {!loading && tree.length > 0 && (
            <div className={styles.tree}>
              {tree.map((root) => (
                <div key={root._id} className={styles.node}>
                  <div className={styles.nodeRow}>
                    <div className={styles.nodeInfo}>
                      <b>{root.name}</b>
                      <span className={styles.slug}>/{root.slug}</span>
                      <span className={`${panel.status} ${root.isActive ? panel.green : panel.gray}`}>{root.isActive ? "Hoạt động" : "Ẩn"}</span>
                    </div>
                    <div className={panel.actions}>
                      <button className={panel.ghostButton} onClick={() => addChild(root._id)}>+ Danh mục con</button>
                      <button className={panel.ghostButton} onClick={() => edit(root)}>Sửa</button>
                      <button className={panel.dangerButton} onClick={() => remove(root._id)}>Xóa</button>
                    </div>
                  </div>
                  {root.children.length > 0 && (
                    <div className={styles.children}>
                      {root.children.map((child) => (
                        <div key={child._id} className={styles.childRow}>
                          <div className={styles.nodeInfo}>
                            <span className={styles.childName}>{child.name}</span>
                            <span className={styles.slug}>/{child.slug}</span>
                            <span className={`${panel.status} ${child.isActive ? panel.green : panel.gray}`}>{child.isActive ? "Hoạt động" : "Ẩn"}</span>
                          </div>
                          <div className={panel.actions}>
                            <button className={panel.ghostButton} onClick={() => edit(child)}>Sửa</button>
                            <button className={panel.dangerButton} onClick={() => remove(child._id)}>Xóa</button>
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

        <aside className={`${panel.panel} ${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`} aria-hidden={!drawerOpen}>
          <div className={panel.panelPad}>
            <div className={styles.drawerTitle}><span className={styles.drawerEyebrow}>{editingId ? "EDIT CATEGORY" : "NEW CATEGORY"}</span><h3>{editingId ? "Sửa danh mục" : form.parent ? "Thêm danh mục con" : "Tạo danh mục cha mới"}</h3><p>Thiết lập thông tin và hình ảnh hiển thị.</p></div>
            <div className={styles.drawerHeader}><div><span className={styles.drawerEyebrow}>{editingId ? "EDIT CATEGORY" : "NEW CATEGORY"}</span></div><button className={styles.closeDrawer} onClick={resetForm} aria-label="Đóng form"><X size={18} /></button></div>
            <h2>{editingId ? "Sửa danh mục" : form.parent ? "Thêm danh mục con" : "Tạo danh mục cha mới"}</h2>
            {!editingId && form.parent && (
              <div className={styles.parentBadge}>
                Thuộc danh mục cha: <b>{parentName}</b>
                <button onClick={() => setForm((current) => ({ ...current, parent: "" }))} aria-label="Bỏ chọn danh mục cha"><X size={12} /></button>
              </div>
            )}
            <div className={styles.formGrid}>
              <label>Tên danh mục
                <input type="text" value={form.name} onChange={(event) => { const name = event.target.value; setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) })); }} placeholder={form.parent ? "vd: Bộ chăm sóc" : "vd: Tóc"} />
              </label>
              <div className={styles.drawerSectionLabel}>Thông tin chính</div>
              <label>Slug
                <input type="text" value={form.slug} onChange={(event) => { setSlugTouched(true); setForm((current) => ({ ...current, slug: event.target.value })); }} />
              </label>
              <label>Danh mục cha
                <select value={form.parent} onChange={(event) => setForm((current) => ({ ...current, parent: event.target.value }))}>
                  <option value="">— Không (là danh mục cha) —</option>
                  {roots.filter((root) => root._id !== editingId).map((root) => <option key={root._id} value={root._id}>{root.name}</option>)}
                </select>
              </label>
              <label>Thứ tự hiển thị
                <input type="number" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
              </label>
              <label>Mô tả
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={2} />
              </label>
              <label>Ảnh đại diện
                <UploadField value={form.image} onChange={(image) => setForm((current) => ({ ...current, image }))} label="Upload ảnh đại diện" />
              </label>
              <label>Ảnh banner
                <UploadField value={form.bannerImage} onChange={(bannerImage) => setForm((current) => ({ ...current, bannerImage }))} label="Upload ảnh banner" />
              </label>
              <label className={panel["admin-checkbox"]}>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                Hiển thị danh mục này
              </label>
            </div>
            {message && <p className={panel.message}>{message}</p>}
          </div>
          <footer className={styles.drawerFooter}>
            <button className={styles.drawerCancel} onClick={resetForm}>Đóng</button>
            <button className={panel.saveButton} disabled={saving || !form.name || !form.slug} onClick={submit}>{saving ? "Đang lưu…" : editingId ? "Cập nhật danh mục" : form.parent ? "Tạo danh mục con" : "Tạo danh mục cha"}</button>
          </footer>
        </aside>
      </div>
      {drawerOpen && <button className={styles.drawerBackdrop} onClick={resetForm} aria-label="Đóng form danh mục" />}
    </AdminShell>
  );
}
