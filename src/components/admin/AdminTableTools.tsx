"use client";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import styles from "./admin-table-tools.module.css";

export function AdminTableToolbar({
  search,
  onSearchChange,
  placeholder = "Tìm theo tên, mã hoặc thông tin...",
  filters,
  right,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.search}>
        <Search size={16} />
        <input
          className={styles.searchInput}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Tìm kiếm"
        />
      </div>
      {filters && (
        <div className={styles.filters}>
          <SlidersHorizontal size={15} />
          {filters}
        </div>
      )}
      {right && <div className={styles.right}>{right}</div>}
    </div>
  );
}

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className={styles.pagination}>
      <span>
        Hiển thị {from}-{to} trong {total}
      </span>
      <div>
        <button
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} />
        </button>
        <b>{page}</b>
        <span>/ {pageCount}</span>
        <button
          aria-label="Trang sau"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
