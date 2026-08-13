import { HairLossQuiz } from "@/components/store/HairLossQuiz";
import { SiteFooter } from "../shared/SiteFooter";
import { SiteHeader } from "../shared/SiteHeader";
import styles from "./HairAssessmentLanding.module.css";

const stageResults = [1, 2, 3, 4, 5].map((n) => `/images/anhstage${n}.png`);

const videos = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c14/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c18/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c452749a2a229b7e00f6/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c4529981f11df328a048/main.mp4",
];

export function HairAssessmentLanding() {
  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <img
            src="/images/baikiemtra.png"
            alt="Rụng tóc, có lời giải — bài kiểm tra tóc miễn phí chỉ 1 phút, lộ trình cá nhân hóa từ chuyên gia"
            className={styles.heroImage}
          />
          <a href="#quiz" className={styles.heroCta}>
            Làm bài kiểm tra tóc ngay <span>→</span>
          </a>
        </div>
      </section>

      <div id="quiz">
        <HairLossQuiz />
      </div>

      <section className={styles.stageSection}>
        <div className={styles.stageRow}>
          {stageResults.map((src, i) => (
            <img key={src} src={src} alt={`Kết quả thực tế trước và sau giai đoạn ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className={styles.videoSection}>
        <h2>Khách hàng chia sẻ sau khi theo lộ trình cá nhân hóa</h2>
        <div className={styles.videoGrid}>
          {videos.map((src) => (
            <video key={src} className={styles.video} controls preload="metadata" playsInline>
              <source src={src} type="video/mp4" />
            </video>
          ))}
        </div>
      </section>

      <section className={styles.bannerSection}>
        <img
          src="/images/baikiemtra1.png"
          alt="Hiệu quả rõ rệt sau 6 tháng sử dụng lộ trình chăm sóc tóc Tóc Tai"
          className={styles.bannerImage}
        />
      </section>

      <section className={styles.steps}>
        <h2>Cách hoạt động</h2>
        <div>
          {[
            [1, "Trả lời một vài câu hỏi cơ bản về tóc và sức khỏe"],
            [2, "Nhận tư vấn miễn phí về dinh dưỡng và thói quen sinh hoạt"],
            [3, "Nhiều khách hàng ghi nhận cải thiện khi duy trì đúng lộ trình cá nhân hóa"],
          ].map(([n, t]) => (
            <article key={String(n)}>
              <b>{n}</b>
              <p>{t}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.trust}>
        <span>
          <b>5L+</b> Lượt tư vấn
        </span>
        <span>
          <b>150+</b> Chuyên gia
        </span>
        <span>
          <b>10L+</b> Khách hàng
        </span>
      </section>

      <SiteFooter />
    </main>
  );
}
