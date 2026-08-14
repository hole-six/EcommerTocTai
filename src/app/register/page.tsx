"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import styles from "../auth.module.css";

type Form = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
};
const empty: Form = { fullName: "", phone: "", email: "", password: "" };
const heroImage = "/anhdesginlogin.png";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function field(key: keyof Form) {
    return {
      value: form[key],
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email || undefined }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Đăng ký thất bại");
      router.push(body.data.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Đăng ký thất bại",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={`${styles.shell} ${styles.register}`}>
        <aside className={styles.visual}>
          <Image
            className={styles.visualImage}
            src={heroImage}
            alt="Lộ trình chăm sóc toàn diện cùng Tóc Tai"
            fill
            priority
            sizes="50vw"
          />
          <div className={styles.visualContent}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brandMark}>T</span>Tóc Tai
            </Link>
            <div className={styles.visualCopy}>
              <span className={styles.eyebrow}>CÁ NHÂN HÓA CHO BẠN</span>
              <h2>Chăm sóc đúng cách, thấy thay đổi thật.</h2>
              <p>
                Tạo tài khoản để lưu lộ trình, địa chỉ giao hàng và những sản
                phẩm phù hợp nhất.
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
            <h1 className={styles.title}>Tạo tài khoản</h1>
            <p className={styles.subtitle}>
              Lưu thông tin để đặt hàng nhanh, quản lý đơn và không phải nhập
              lại địa chỉ.
            </p>
            <form onSubmit={submit} className={styles.form}>
              <label className={styles.field}>
                Họ và tên
                <input
                  required
                  placeholder="Nhập họ và tên"
                  {...field("fullName")}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                Số điện thoại
                <input
                  required
                  inputMode="tel"
                  placeholder="Nhập số điện thoại"
                  {...field("phone")}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                Email
                <input
                  required
                  type="email"
                  placeholder="Nhập email của bạn"
                  {...field("email")}
                  className={styles.input}
                />
              </label>
              <label className={styles.field}>
                Mật khẩu
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="Tối thiểu 8 ký tự"
                  {...field("password")}
                  className={styles.input}
                />
              </label>
              {error && <p className={styles.error}>{error}</p>}
              <button disabled={loading} className={styles.submit}>
                {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
              </button>
            </form>
            <p className={styles.switch}>
              Đã có tài khoản?<Link href="/login">Đăng nhập</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
