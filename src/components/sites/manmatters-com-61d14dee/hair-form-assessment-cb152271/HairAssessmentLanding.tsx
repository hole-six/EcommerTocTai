"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HairLossQuiz } from "@/components/store/HairLossQuiz";
import { SiteFooter } from "../shared/SiteFooter";
import { SiteHeader } from "../shared/SiteHeader";
import styles from "./HairAssessmentLanding.module.css";

const stageResults = [1, 2, 3, 4, 5].map((n) => `/images/anhstage${n}.png`);

const defaultVideos = [
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c14/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c398649c9137d0ba3c18/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c452749a2a229b7e00f6/main.mp4",
  "https://video.gumlet.io/6453a8cc56ecc7951d7ae765/6a06c4529981f11df328a048/main.mp4",
];

export function HairAssessmentLanding() {
  const [quizStarted, setQuizStarted] = useState(false);
  const [videos, setVideos] = useState(
    defaultVideos.map((src) => ({ src, href: "" })),
  );

  useEffect(() => {
    fetch("/api/banners?placement=hair_assessment_videos")
      .then((response) => (response.ok ? response.json() : { data: [] }))
      .then((body) => {
        const list = (body.data ?? []) as Array<{
          slotKey: string;
          videoUrl: string;
          ctaHref: string;
        }>;
        setVideos(
          defaultVideos.map((fallback, index) => {
            const match = list.find(
              (item) => item.slotKey === `assessment-video-${index + 1}`,
            );
            return {
              src: match?.videoUrl || fallback,
              href: match?.ctaHref || "",
            };
          }),
        );
      })
      .catch(() => undefined);
  }, []);

  function startQuiz() {
    setQuizStarted(true);
    window.setTimeout(() => {
      document.getElementById("quiz")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/baikiemtra.png"
            alt="Rụng tóc, có lời giải — bài kiểm tra tóc miễn phí chỉ 1 phút, lộ trình cá nhân hóa từ chuyên gia"
            className={styles.heroImage}
            width={1508}
            height={1043}
            priority
            sizes="(max-width: 1100px) 100vw, 1100px"
          />
          <a href="#quiz" className={styles.heroCta} onClick={startQuiz}>
            Làm bài kiểm tra tóc ngay <span>→</span>
          </a>
        </div>
      </section>

      <div
        id="quiz"
        className={`${styles.quizSection} ${quizStarted ? styles.quizStarted : ""}`}
      >
        {quizStarted && <HairLossQuiz />}
      </div>

      <section className={styles.stageSection}>
        <div className={styles.stageRow}>
          {stageResults.map((src, i) => (
            <Image key={src} src={src} alt={`Kết quả thực tế trước và sau giai đoạn ${i + 1}`} width={936} height={1681} sizes="(max-width: 640px) 62vw, 230px" loading="lazy" />
          ))}
        </div>
      </section>

      <section className={styles.videoSection}>
        <h2>Khách hàng chia sẻ sau khi theo lộ trình cá nhân hóa</h2>
        <div className={styles.videoGrid}>
          {videos.map((video, index) => {
            const player = (
              <video
                className={styles.video}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controlsList="nodownload noplaybackrate nofullscreen"
                onContextMenu={(event) => event.preventDefault()}
              >
                <source src={video.src} type="video/mp4" />
              </video>
            );
            return video.href ? (
              <a
                key={video.src + index}
                className={styles.videoLink}
                href={video.href}
                aria-label={`Xem sản phẩm trong video ${index + 1}`}
              >
                {player}
              </a>
            ) : (
              <div key={video.src + index} className={styles.videoLink}>
                {player}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.bannerSection}>
        <Image
          src="/images/baikiemtra1.png"
          alt="Hiệu quả rõ rệt sau 6 tháng sử dụng lộ trình chăm sóc tóc Tóc Tai"
          className={styles.bannerImage}
          width={1756}
          height={896}
          loading="lazy"
          sizes="(max-width: 1200px) 100vw, 1200px"
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
