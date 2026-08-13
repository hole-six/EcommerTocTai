"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../auth.module.css";

const heroImage = "/anhdesginlogin.png";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const isEmail = identifier.includes("@");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [isEmail ? "email" : "phone"]: identifier,
          password,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Đăng nhập thất bại");
      router.push(body.data.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Đăng nhập thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.visual}>
          <Image
            className={styles.visualImage}
            src={heroImage}
            alt="Chăm sóc tóc nam cùng Tóc Tai"
            fill
            priority
            sizes="50vw"
          />
          <div className={styles.visualContent}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>T</span>Tóc Tai
            </Link>
            <div className={styles.visualCopy}>
              <span className={styles.eyebrow}>CHĂM SÓC NAM GIỚI KHOA HỌC</span>
              <h2>Bắt đầu hành trình tóc khỏe hơn.</h2>
              <p>
                Giải pháp cá nhân hóa, sản phẩm minh bạch và lộ trình rõ ràng
                cho bạn.
              </p>
            </div>
            <div className={styles.trust}>
              <span>
                <strong>10.000+</strong>Khách hàng tin chọn
              </span>
              <span>
                <strong>4.9/5</strong>Đánh giá trung bình
              </span>
            </div>
          </div>
        </aside>
        <section className={styles.formSide}>
          <div className={styles.formWrap}>
            <Link href="/" className={`${styles.brand} ${styles.mobileBrand}`}>
              <span className={styles.brandMark}>T</span>Tóc Tai
            </Link>
            <Link href="/" className={styles.back}>
              ← Trở về trang chủ
            </Link>
            <h1 className={styles.title}>Chào mừng trở lại</h1>
            <p className={styles.subtitle}>
              Đăng nhập để theo dõi đơn hàng, lưu địa chỉ và mua sắm nhanh hơn.
            </p>
            <form onSubmit={submit} className={styles.form}>
              <label className={styles.field}>
                Số điện thoại hoặc email
                <input
                  required
                  placeholder="Nhập số điện thoại hoặc email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                Mật khẩu
                <input
                  required
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.input}
                />
              </label>
              {error && <p className={styles.error}>{error}</p>}
              <button disabled={loading} className={styles.submit}>
                {loading ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </form>
            <p className={styles.switch}>
              Chưa có tài khoản?<Link href="/register">Tạo tài khoản</Link>
            </p>
            <p className={styles.note}>
              Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính
              sách bảo mật của Tóc Tai.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
