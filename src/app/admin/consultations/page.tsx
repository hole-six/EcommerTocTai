"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import styles from "./consultations.module.css";

type Consultation = { _id: string; customer?: { fullName?: string; phone?: string; email?: string }; answers?: Record<string, string>; images?: string[]; appointment?: { mode?: string; language?: string; date?: string; time?: string }; status: string; createdAt: string };
export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  useEffect(() => { fetch("/api/consultations").then((r) => r.json()).then((body) => setItems(body.data ?? [])); }, []);
  return <AdminShell breadcrumb="Tư vấn tóc"><section className={styles.page}><div className={styles.heading}><div><p>CONSULTATIONS</p><h1>Hair consultations</h1><span>Answers submitted by customers from the hair assessment flow.</span></div><b>{items.length} total</b></div><div className={styles.tableWrap}><table><thead><tr><th>Customer</th><th>Answers</th><th>Appointment</th><th>Images</th><th>Status</th><th>Created</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td><strong>{item.customer?.fullName}</strong><small>{item.customer?.phone}</small><small>{item.customer?.email}</small></td><td>{Object.entries(item.answers ?? {}).map(([key, value]) => <span className={styles.answer} key={key}>{key}: {value}</span>)}</td><td>{item.appointment?.mode === "schedule" ? `${item.appointment.date ?? ""} ${item.appointment.time ?? ""}` : "Now · 3–5 mins"}</td><td>{item.images?.length ?? 0}/2</td><td><span className={styles.status}>{item.status}</span></td><td>{new Date(item.createdAt).toLocaleString("en-GB")}</td></tr>)}</tbody></table>{items.length === 0 && <p className={styles.empty}>No consultations submitted yet.</p>}</div></section></AdminShell>;
}
