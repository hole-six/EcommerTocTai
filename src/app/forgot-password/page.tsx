"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { extractApiError } from "@/lib/client/errors";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(extractApiError(body, "Gửi yêu cầu thất bại"));
      setMessage(body.data.message);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Gửi yêu cầu thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.formSide} style={{ margin: "0 auto" }}>
          <div className={styles.formWrap}>
            <Link href="/" className={`${styles.brand} ${styles.mobileBrand}`}>
              <span className={styles.brandMark}>T</span>Tóc Tai
            </Link>
            <Link href="/login" className={styles.back}>
              ← Quay lại đăng nhập
            </Link>
            <h1 className={styles.title}>Quên mật khẩu</h1>
            <p className={styles.subtitle}>
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt lại mật
              khẩu.
            </p>
            <form onSubmit={submit} className={styles.form}>
              <label className={styles.field}>
                Email
                <input
                  required
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.input}
                />
              </label>
              {error && <p className={styles.error}>{error}</p>}
              {message && <p className={styles.subtitle}>{message}</p>}
              <button disabled={loading} className={styles.submit}>
                {loading ? "Đang gửi…" : "Gửi liên kết đặt lại"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
