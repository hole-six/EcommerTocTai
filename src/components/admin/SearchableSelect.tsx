"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./searchable-select.module.css";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
  description?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN");
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn một mục",
  searchPlaceholder = "Gõ để tìm kiếm...",
  emptyLabel = "Không tìm thấy kết quả phù hợp",
  clearLabel,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  clearLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return options;
    return options.filter((option) =>
      normalize(`${option.label} ${option.keywords ?? ""} ${option.description ?? ""}`).includes(
        term,
      ),
    );
  }, [options, query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
  }

  function toggleMenu() {
    if (!open) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
    setOpen((current) => !current);
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={toggleMenu}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? styles.selectedText : styles.placeholder}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={15} className={open ? styles.chevronOpen : ""} />
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          <div className={styles.searchBox}>
            <Search size={15} />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Xóa tìm kiếm">
                <X size={13} />
              </button>
            )}
          </div>
          <div className={styles.options}>
            {clearLabel && (
              <button
                type="button"
                className={`${styles.option} ${!value ? styles.optionSelected : ""}`}
                onClick={() => choose("")}
                role="option"
                aria-selected={!value}
              >
                <span>{clearLabel}</span>
                {!value && <Check size={14} />}
              </button>
            )}
            {filtered.map((option) => (
              <button
                type="button"
                key={option.value}
                className={`${styles.option} ${option.value === value ? styles.optionSelected : ""}`}
                onClick={() => choose(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                <span>
                  <b>{option.label}</b>
                  {option.description && <small>{option.description}</small>}
                </span>
                {option.value === value && <Check size={14} />}
              </button>
            ))}
            {filtered.length === 0 && <p className={styles.empty}>{emptyLabel}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
