"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import styles from "../auth.module.css";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Đặt lại mật khẩu thất bại");
      setDone(true);
      window.setTimeout(() => router.push("/login"), 2000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Đặt lại mật khẩu thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className={styles.error}>
        Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại từ{" "}
        <Link href="/forgot-password">đây</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <p className={styles.subtitle}>
        Đã đặt lại mật khẩu thành công. Đang chuyển tới trang đăng nhập…
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <label className={styles.field}>
        Mật khẩu mới
        <input
          required
          type="password"
          minLength={8}
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={styles.input}
        />
      </label>
      <label className={styles.field}>
        Nhập lại mật khẩu mới
        <input
          required
          type="password"
          minLength={8}
          placeholder="Nhập lại mật khẩu mới"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className={styles.input}
        />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button disabled={loading} className={styles.submit}>
        {loading ? "Đang lưu…" : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.formSide} style={{ margin: "0 auto" }}>
          <div className={styles.formWrap}>
            <Link href="/" className={`${styles.brand} ${styles.mobileBrand}`}>
              <span className={styles.brandMark}>T</span>Tóc Tai
            </Link>
            <h1 className={styles.title}>Đặt lại mật khẩu</h1>
            <p className={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </section>
      </div>
    </main>
  );
}
