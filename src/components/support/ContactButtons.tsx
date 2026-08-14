"use client";

import { Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./ContactButtons.module.css";

const ZALO_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'/%3E%3C/svg%3E";
const FANPAGE_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94Z'/%3E%3C/svg%3E";

const SLOTS = [
  { key: "contact-zalo", label: "Nhắn Zalo" },
  { key: "contact-call", label: "Gọi điện" },
  { key: "contact-fanpage", label: "Fanpage" },
] as const;

export function ContactButtons() {
  const pathname = usePathname();
  const [hrefs, setHrefs] = useState<Record<string, string>>({});
  const hidden =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  useEffect(() => {
    if (hidden) return;
    fetch("/api/banners?placement=site_contact_buttons")
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((body) => {
        const list = (body.data ?? []) as Array<{ slotKey: string; ctaHref: string }>;
        setHrefs(
          Object.fromEntries(
            list.map((item) => [item.slotKey, item.ctaHref]).filter(([, href]) => href),
          ),
        );
      })
      .catch(() => undefined);
  }, [hidden]);

  if (hidden) return null;
  const visible = SLOTS.filter(({ key }) => hrefs[key]);
  if (!visible.length) return null;

  return (
    <div className={styles.stack}>
      {visible.map(({ key, label }) => (
        <a
          key={key}
          href={hrefs[key]}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className={styles.button}
        >
          {key === "contact-zalo" && (
            <img src={ZALO_ICON} alt="" width={20} height={20} />
          )}
          {key === "contact-call" && <Phone size={20} />}
          {key === "contact-fanpage" && (
            <img src={FANPAGE_ICON} alt="" width={20} height={20} />
          )}
        </a>
      ))}
    </div>
  );
}
