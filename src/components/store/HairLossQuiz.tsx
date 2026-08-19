"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_QUIZ_CONFIG,
  QUIZ_DURATIONS,
  QUIZ_FORMATS,
  QUIZ_GOALS,
  QUIZ_PRIORITIES,
  QUIZ_STAGES,
  answerKey,
  hasAnyQuizTags,
  normalizeQuizConfig,
  scoreProduct,
  type QuizAnswers,
  type QuizConfig,
  type QuizOption,
  type QuizTags,
} from "@/lib/hairQuiz";
import styles from "./hair-loss-quiz.module.css";

type Answers = QuizAnswers & { noticed?: string; triedBefore?: string; triedResult?: string };
type StepKey =
  | string
  | "goal"
  | "stage"
  | "stageVisual"
  | "duration"
  | "noticed"
  | "triedBefore"
  | "triedResult"
  | "proof"
  | "format"
  | "priority"
  | "trust"
  | "summary"
  | "matching"
  | "finalizing"
  | "result";

type ProductCandidate = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  images: string[];
  shortDescription?: string;
  quizTags?: QuizTags;
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const STAGE_VISUALS: { value: string; label: string; image: string }[] = [
  { value: "early", label: "Mới bắt đầu", image: "/images/stage1.jpg" },
  { value: "visible", label: "Nhẹ", image: "/images/stage2.jpg" },
  { value: "receding", label: "Trung bình", image: "/images/stage3.jpg" },
  { value: "advanced", label: "Nặng", image: "/images/stage4.jpg" },
];
const PROOF_IMAGES = [1, 2, 3, 4, 5].map((n) => `/images/anhstage${n}.png`);
const TRUST_ROWS = [
  "Gợi ý sản phẩm dựa trên đúng câu trả lời của bạn, không dùng chung một công thức cho tất cả.",
  "Đánh giá hiển thị trên CareWise đều đến từ khách hàng đã mua và nhận sản phẩm thực tế.",
  "Để lại số điện thoại, đội ngũ CareWise phản hồi tư vấn trong vài phút.",
];

function buildSteps(answers: Answers, config: QuizConfig = DEFAULT_QUIZ_CONFIG): StepKey[] {
  const steps: StepKey[] = config.questions.map((question) => answerKey(question.id) as StepKey);
  const stageIndex = config.questions.findIndex((question) => question.id === "stages");
  if (stageIndex >= 0) steps.splice(stageIndex + 1, 0, "stageVisual");
  steps.push("noticed", "triedBefore");
  if (answers.triedBefore === "yes") steps.push("triedResult");
  steps.push("proof", "trust", "summary", "matching", "finalizing", "result");
  return steps;
}

function labelOf(options: QuizOption[], value?: string) {
  return options.find((option) => option.value === value)?.label ?? "—";
}

function explainMatch(tags: Partial<QuizTags> | undefined, answers: Answers, config: QuizConfig = DEFAULT_QUIZ_CONFIG) {
  const parts: string[] = [];
  if (tags) {
    for (const question of config.questions) {
      const answer = answers[answerKey(question.id)];
      if (answer && tags[question.id]?.includes(answer)) parts.push(`"${labelOf(question.options, answer)}"`);
    }
  }
  if (!parts.length) return "Sản phẩm phù hợp với nhu cầu chăm sóc tóc mà bạn vừa mô tả.";
  return `Phù hợp với ${parts.join(", ")} mà bạn vừa chọn.`;
}

function ChoiceStep({
  eyebrow,
  title,
  hint,
  options,
  value,
  onSelect,
  onNotSure,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  options: QuizOption[];
  value?: string;
  onSelect: (value: string) => void;
  onNotSure?: () => void;
}) {
  return (
    <div className={styles.stepBody}>
      {eyebrow && <p className={styles.stepEyebrow}>{eyebrow}</p>}
      <h1>{title}</h1>
      {hint && <p className={styles.stepHint}>{hint}</p>}
      <div className={styles.optionList}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              type="button"
              key={option.value}
              className={`${styles.optionRow} ${active ? styles.optionRowActive : ""}`}
              onClick={() => onSelect(option.value)}
            >
              <span className={styles.optionRowText}>
                <b>{option.label}</b>
                {option.hint && <small>{option.hint}</small>}
              </span>
              {active && <Check size={18} />}
            </button>
          );
        })}
      </div>
      {onNotSure && (
        <button type="button" className={styles.notSureLink} onClick={onNotSure}>
          Tôi không chắc – giúp tôi chọn
        </button>
      )}
    </div>
  );
}

export function HairLossQuiz() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [stepKey, setStepKey] = useState<StepKey>("goal");
  const [matchProgress, setMatchProgress] = useState(0);
  const [checklistDone, setChecklistDone] = useState(0);
  const [products, setProducts] = useState<ProductCandidate[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuizConfig>(DEFAULT_QUIZ_CONFIG);

  useEffect(() => {
    fetch("/api/commerce/products").then((response) => response.json()).then((body) => setProducts(body.data ?? [])).finally(() => setProductsLoaded(true));
  }, []);
  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setQuizConfig(normalizeQuizConfig(body.data?.quizConfig)))
      .catch(() => setQuizConfig(DEFAULT_QUIZ_CONFIG));
  }, []);

  const steps = useMemo(() => buildSteps(answers, quizConfig), [answers, quizConfig]);
  const currentQuestion = quizConfig.questions.find((question) => answerKey(question.id) === stepKey);
  const currentIndex = Math.max(0, steps.indexOf(stepKey));
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đưa về bước hợp lệ khi cấu hình khảo sát đổi
    if (!steps.includes(stepKey)) setStepKey(steps[0] ?? "result");
  }, [stepKey, steps]);

  const scored = useMemo(() => {
    return products
      .filter((product) => hasAnyQuizTags(product.quizTags))
      .map((product) => ({ product, score: scoreProduct(product.quizTags, answers, quizConfig) }))
      .sort((a, b) => b.score - a.score);
  }, [products, answers, quizConfig]);
  const best = scored[0];
  const hasMatch = Boolean(best && best.score > 0);
  const recommended = scored.filter((entry) => entry.score > 0).slice(0, 6);

  useEffect(() => {
    if (stepKey !== "matching") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset thanh tiến trình mỗi lần vào bước ghép sản phẩm
    setMatchProgress(0);
    const start = Date.now();
    const duration = 2000;
    const timer = window.setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setMatchProgress(pct);
      if (pct >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => setStepKey("finalizing"), 300);
      }
    }, 60);
    return () => window.clearInterval(timer);
  }, [stepKey]);

  useEffect(() => {
    if (stepKey !== "finalizing") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset checklist mỗi lần vào bước tổng hợp
    setChecklistDone(0);
    const timer = window.setInterval(() => {
      setChecklistDone((value) => {
        const next = value + 1;
        if (next >= 4) {
          window.clearInterval(timer);
          window.setTimeout(() => setStepKey("result"), 500);
        }
        return next;
      });
    }, 450);
    return () => window.clearInterval(timer);
  }, [stepKey]);

  function goNext() {
    const seq = buildSteps(answers, quizConfig);
    const idx = seq.indexOf(stepKey);
    setStepKey(seq[idx + 1] ?? stepKey);
  }
  function goBack() {
    const seq = buildSteps(answers, quizConfig);
    const idx = seq.indexOf(stepKey);
    if (idx <= 0) {
      router.push("/");
      return;
    }
    setStepKey(seq[idx - 1]);
  }
  function selectAndAdvance(patch: Partial<Answers>) {
    const nextAnswers = { ...answers, ...patch };
    setAnswers(nextAnswers);
    const seq = buildSteps(nextAnswers, quizConfig);
    const idx = seq.indexOf(stepKey);
    window.setTimeout(() => setStepKey(seq[idx + 1] ?? stepKey), 260);
  }
  function restart() {
    setAnswers({});
    setStepKey("goal");
  }

  if (stepKey === "result") {
    return (
      <div className={styles.page}>
        <main className={styles.resultMain}>
          <p className={styles.resultEyebrow}>PHÁC ĐỒ GỢI Ý DÀNH RIÊNG CHO BẠN</p>
          {!productsLoaded ? (
            <p className={styles.stepHint}>Đang tìm sản phẩm phù hợp…</p>
          ) : hasMatch && best ? (
            <>
              <h1>Đã tìm được sản phẩm phù hợp nhất với bạn.</h1>
              <p className={styles.resultLead}>{explainMatch(best.product.quizTags, answers, quizConfig)}</p>
              <div className={styles.productCard}>
                <div className={styles.productImage}>
                  {best.product.images[0] && (
                    <Image src={best.product.images[0]} alt={best.product.name} fill sizes="180px" style={{ objectFit: "cover" }} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <b>{best.product.name}</b>
                  {best.product.shortDescription && <p>{best.product.shortDescription}</p>}
                  <div className={styles.productPriceRow}>
                    <span className={styles.productPrice}>{money.format(best.product.salePrice ?? best.product.price)}</span>
                    {best.product.salePrice && <span className={styles.productCompare}>{money.format(best.product.price)}</span>}
                  </div>
                  <Link href={`/san-pham/${best.product.slug}`} className={styles.primaryCta}>
                    Xem sản phẩm &amp; đặt hàng
                  </Link>
                </div>
              </div>
              {recommended.length > 1 && (
                <div className={styles.recommendations}>
                  <p className={styles.resultEyebrow}>SẢN PHẨM PHÙ HỢP KHÁC</p>
                  <div className={styles.recommendationGrid}>
                    {recommended.slice(1).map(({ product, score }) => (
                      <article key={product._id} className={styles.recommendationCard}>
                        <div className={styles.recommendationImage}>
                          {product.images[0] && (
                            <Image src={product.images[0]} alt={product.name} fill sizes="160px" style={{ objectFit: "cover" }} />
                          )}
                        </div>
                        <div>
                          <b>{product.name}</b>
                          {product.shortDescription && <p>{product.shortDescription}</p>}
                          <span>{money.format(product.salePrice ?? product.price)}</span>
                        </div>
                        <Link href={`/san-pham/${product.slug}`}>Xem sản phẩm</Link>
                        <small>{score} điểm phù hợp</small>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h1>Chưa tìm được sản phẩm khớp hoàn toàn hồ sơ của bạn.</h1>
              <p className={styles.resultLead}>Bạn có thể xem toàn bộ sản phẩm CareWise hoặc làm lại bài test với lựa chọn khác để hệ thống gợi ý chính xác hơn.</p>
              <Link href="/shop/all" className={styles.primaryCta}>Xem tất cả sản phẩm</Link>
            </>
          )}

          <div className={styles.summaryTable}>
            {quizConfig.questions.map((question) => {
              const value = answers[answerKey(question.id)];
              return (
                <div className={styles.summaryRow} key={question.id}>
                  <span>{question.title}</span>
                  <b>{value ? labelOf(question.options, value) : "Chưa xác định"}</b>
                </div>
              );
            })}
          </div>

          <button type="button" className={styles.restartLink} onClick={restart}>Làm lại bài test</button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.quizHeader}>
        <button type="button" onClick={goBack} aria-label="Quay lại" className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <Link href="/" className={styles.quizLogo}>
          <Image src="/images/logocarewise.png" alt="CareWise" width={132} height={88} />
        </Link>
        <span className={styles.headerSpacer} />
      </header>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {currentQuestion && (
        <ChoiceStep
          eyebrow={currentQuestion.eyebrow}
          title={currentQuestion.title}
          hint={currentQuestion.hint}
          options={currentQuestion.options}
          value={answers[answerKey(currentQuestion.id)]}
          onSelect={(value) => selectAndAdvance({ [answerKey(currentQuestion.id)]: value })}
          onNotSure={
            currentQuestion.allowSkip
              ? () => selectAndAdvance({ [answerKey(currentQuestion.id)]: currentQuestion.skipValue || undefined })
              : undefined
          }
        />
      )}

      {false && stepKey === "goal" && (
        <ChoiceStep
          eyebrow="BƯỚC 1"
          title="Mục tiêu của bạn với mái tóc là gì?"
          hint="Điều này giúp xác định phác đồ phù hợp nhất."
          options={QUIZ_GOALS}
          value={answers.goal}
          onSelect={(value) => selectAndAdvance({ goal: value })}
        />
      )}
      {false && stepKey === "stage" && (
        <ChoiceStep
          eyebrow="BƯỚC 2"
          title="Bạn mô tả tình trạng rụng tóc hiện tại như thế nào?"
          options={QUIZ_STAGES}
          value={answers.stage}
          onSelect={(value) => selectAndAdvance({ stage: value })}
          onNotSure={() => selectAndAdvance({ stage: "visible" })}
        />
      )}
      {stepKey === "stageVisual" && (
        <div className={styles.stepBody}>
          <h1>Hình nào gần giống tình trạng của bạn nhất?</h1>
          <p className={styles.stepHint}>Chỉ mang tính tham khảo trực quan, không thay thế chẩn đoán y tế.</p>
          <div className={styles.imageGrid}>
            {STAGE_VISUALS.map((option) => {
              const active = answers.stage === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  className={`${styles.imageOption} ${active ? styles.imageOptionActive : ""}`}
                  onClick={() => selectAndAdvance({ stage: option.value })}
                >
                  <span className={styles.imageOptionPic}>
                    <Image src={option.image} alt={option.label} fill sizes="240px" style={{ objectFit: "cover" }} />
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {false && stepKey === "duration" && (
        <ChoiceStep
          eyebrow="BƯỚC 3"
          title="Tình trạng này đã kéo dài bao lâu?"
          options={QUIZ_DURATIONS}
          value={answers.duration}
          onSelect={(value) => selectAndAdvance({ duration: value })}
          onNotSure={() => selectAndAdvance({ duration: "6_12m" })}
        />
      )}
      {stepKey === "noticed" && (
        <ChoiceStep
          title="Có ai nhận xét hoặc để ý tóc bạn thưa đi không?"
          hint="Điều này giúp hiểu mức độ rõ rệt của tình trạng."
          options={[{ value: "yes", label: "Có" }, { value: "no", label: "Không" }]}
          value={answers.noticed}
          onSelect={(value) => selectAndAdvance({ noticed: value })}
        />
      )}
      {stepKey === "triedBefore" && (
        <ChoiceStep
          title="Bạn đã từng điều trị rụng tóc trước đây chưa?"
          options={[{ value: "yes", label: "Có" }, { value: "no", label: "Không" }]}
          value={answers.triedBefore}
          onSelect={(value) => selectAndAdvance({ triedBefore: value })}
        />
      )}
      {stepKey === "triedResult" && (
        <ChoiceStep
          title="Kết quả điều trị trước đó thế nào?"
          options={[
            { value: "some", label: "Có thấy cải thiện" },
            { value: "none", label: "Không thấy cải thiện" },
            { value: "early_stop", label: "Dừng quá sớm" },
            { value: "side_effect", label: "Bị tác dụng phụ" },
          ]}
          value={answers.triedResult}
          onSelect={(value) => selectAndAdvance({ triedResult: value })}
        />
      )}
      {stepKey === "proof" && (
        <div className={styles.stepBody}>
          <h1>Khách hàng CareWise chia sẻ hành trình của họ.</h1>
          <div className={styles.testimonialRow}>
            {PROOF_IMAGES.map((src) => (
              <div key={src} className={styles.testimonialCard}>
                <Image src={src} alt="Chia sẻ từ khách hàng CareWise" width={280} height={430} />
              </div>
            ))}
          </div>
          <button type="button" className={styles.continueButton} onClick={goNext}>Tiếp tục</button>
        </div>
      )}
      {false && stepKey === "format" && (
        <ChoiceStep
          eyebrow="BƯỚC 4"
          title="Bạn muốn điều trị theo hình thức nào?"
          options={QUIZ_FORMATS}
          value={answers.format}
          onSelect={(value) => selectAndAdvance({ format: value })}
          onNotSure={() => selectAndAdvance({ format: undefined })}
        />
      )}
      {false && stepKey === "priority" && (
        <ChoiceStep
          eyebrow="BƯỚC 5"
          title="Ưu tiên hàng đầu của bạn là gì?"
          hint="Giúp CareWise chọn đúng hướng chăm sóc cho bạn."
          options={QUIZ_PRIORITIES}
          value={answers.priority}
          onSelect={(value) => selectAndAdvance({ priority: value })}
        />
      )}
      {stepKey === "trust" && (
        <div className={styles.stepBody}>
          <h1>Bạn đang ở đúng nơi.</h1>
          <p className={styles.stepHint}>Cách CareWise gợi ý sản phẩm cho bạn:</p>
          <div className={styles.trustList}>
            {TRUST_ROWS.map((row) => (
              <div key={row} className={styles.trustRow}>
                <CheckCircle2 size={18} />
                <span>{row}</span>
              </div>
            ))}
          </div>
          <button type="button" className={styles.continueButton} onClick={goNext}>Tiếp tục</button>
        </div>
      )}
      {stepKey === "summary" && (
        <div className={styles.stepBody}>
          <h1>Phân tích của bạn đã hoàn tất.</h1>
          <p className={styles.stepHint}>Hồ sơ tóc của bạn:</p>
          <div className={styles.summaryTable}>
            {quizConfig.questions.map((question) => {
              const value = answers[answerKey(question.id)];
              return (
                <div className={styles.summaryRow} key={question.id}>
                  <span>{question.title}</span>
                  <b>{value ? labelOf(question.options, value) : "Chưa xác định"}</b>
                </div>
              );
            })}
          </div>
          <button type="button" className={styles.continueButton} onClick={goNext}>Tiếp tục</button>
        </div>
      )}
      {stepKey === "matching" && (
        <div className={styles.stepBody}>
          <div className={styles.loadingIcon}><Sparkles size={26} /></div>
          <h1>Đang tìm phác đồ phù hợp.</h1>
          <div className={styles.matchTrack}>
            <div className={styles.matchFill} style={{ width: `${matchProgress}%` }} />
          </div>
          <p className={styles.matchPercent}>{matchProgress}%</p>
        </div>
      )}
      {stepKey === "finalizing" && (
        <div className={styles.stepBody}>
          <h1>Đang hoàn tất.</h1>
          <div className={styles.matchTrack}>
            <div className={styles.matchFill} style={{ width: `${(checklistDone / 4) * 100}%` }} />
          </div>
          <div className={styles.checklist}>
            {["Xác nhận thông tin", "Chọn phác đồ phù hợp", "Đối chiếu sản phẩm còn hàng", "Chuẩn bị kết quả"].map((label, index) => (
              <div key={label} className={`${styles.checklistRow} ${index < checklistDone ? styles.checklistDone : ""}`}>
                {index < checklistDone ? <CheckCircle2 size={16} /> : <span className={styles.checklistDot} />}
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
