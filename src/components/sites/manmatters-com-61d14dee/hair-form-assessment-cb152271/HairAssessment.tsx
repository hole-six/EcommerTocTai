"use client";

import { Check, ChevronLeft, ChevronRight, Loader2, PhoneCall, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../shared/SiteHeader";
import styles from "./HairAssessment.module.css";
import Image from "next/image";

type SessionUser = { _id: string; fullName: string; phone: string } | null;

type Option = { label: string; image?: string; id: string };
type Question = { id: string; title: string; helper: string; options: Option[] };

const questions: Question[] = [
  {
    id: "stage",
    title: "Mức độ rụng tóc hiện tại của bạn trông giống hình nào nhất?",
    helper: "Hãy chọn hình ảnh sát nhất với đường chân tóc của bạn hiện tại.",
    options: [
      { id: "stage1", label: "Chân tóc nguyên vẹn, chưa có dấu hiệu lùi", image: "/images/stage1.jpg" },
      { id: "stage2", label: "Bắt đầu lùi nhẹ ở hai bên thái dương", image: "/images/stage2.jpg" },
      { id: "stage3", label: "Đường chân tóc chữ M hoặc chữ U lộ rõ", image: "/images/stage3.jpg" },
      { id: "stage4", label: "Hói sâu chữ M/U hoặc thưa dần đỉnh đầu", image: "/images/stage4.jpg" },
    ]
  },
  {
    id: "area",
    title: "Khu vực nào trên đầu khiến bạn bận tâm nhất?",
    helper: "Nơi bạn nhìn thấy tóc mỏng đi rõ rệt nhất.",
    options: [
      { id: "hairline", label: "Đường chân tóc (Trán)" },
      { id: "crown", label: "Đỉnh đầu (Vùng xoáy)" },
      { id: "overall", label: "Rụng thưa toàn bộ da đầu" },
      { id: "not_sure", label: "Tôi không chắc chắn" },
    ]
  },
  {
    id: "duration",
    title: "Bạn đã nhận thấy tình trạng này diễn ra trong bao lâu?",
    helper: "Thời gian giúp chúng tôi xác định tình trạng là cấp tính hay mãn tính.",
    options: [
      { id: "under_3m", label: "Dưới 3 tháng (Mới bắt đầu)" },
      { id: "3_to_6m", label: "3 đến 6 tháng" },
      { id: "6_to_12m", label: "6 đến 12 tháng" },
      { id: "over_1y", label: "Hơn 1 năm (Đã kéo dài)" },
    ]
  },
  {
    id: "scalp",
    title: "Bạn mô tả tình trạng da đầu của mình như thế nào?",
    helper: "Da đầu khỏe mạnh là nền tảng để tóc mọc lại.",
    options: [
      { id: "oily", label: "Rất nhiều dầu nhờn & bết dính" },
      { id: "dry", label: "Khô, căng & dễ bong tróc (Gàu)" },
      { id: "itchy", label: "Thường xuyên mẩn đỏ & ngứa ngáy" },
      { id: "balanced", label: "Bình thường, khá cân bằng" },
    ]
  },
  {
    id: "genetics",
    title: "Trong gia đình bạn có ai (bố, ông, chú) bị rụng tóc/hói đầu không?",
    helper: "Yếu tố di truyền ảnh hưởng lớn đến phác đồ điều trị.",
    options: [
      { id: "yes", label: "Có (Khả năng cao do di truyền)" },
      { id: "no", label: "Không có ai" },
      { id: "not_sure", label: "Tôi không rõ" },
    ]
  },
  {
    id: "lifestyle",
    title: "Thói quen sinh hoạt và mức độ căng thẳng của bạn dạo này ra sao?",
    helper: "Căng thẳng và thiếu ngủ có thể kích hoạt rụng tóc tạm thời.",
    options: [
      { id: "stress", label: "Rất áp lực, căng thẳng cao độ" },
      { id: "nosleep", label: "Thường xuyên thức khuya, thiếu ngủ" },
      { id: "diet", label: "Chế độ ăn uống thất thường, thiếu chất" },
      { id: "normal", label: "Sinh hoạt điều độ, tinh thần thoải mái" },
    ]
  },
  {
    id: "history",
    title: "Trước đây bạn đã từng thử phương pháp nào để cải thiện chưa?",
    helper: "Biết được bạn đã dùng gì giúp chúng tôi tối ưu giải pháp tiếp theo.",
    options: [
      { id: "none", label: "Chưa từng thử gì" },
      { id: "natural", label: "Chỉ dùng dầu gội/tinh dầu thiên nhiên" },
      { id: "medical", label: "Đã dùng thuốc đặc trị (Minoxidil...)" },
      { id: "surgery", label: "Đã can thiệp y khoa (Cấy tóc, PRP...)" },
    ]
  },
  {
    id: "goal",
    title: "Mục tiêu ưu tiên số 1 của bạn ngay lúc này là gì?",
    helper: "Để chúng tôi tập trung vào điều bạn mong muốn nhất.",
    options: [
      { id: "stop_fall", label: "Cầm máu rụng tóc khẩn cấp" },
      { id: "regrowth", label: "Kích thích mọc lại vùng tóc đã mất" },
      { id: "thicken", label: "Nuôi dưỡng nang tóc dày & chắc khỏe hơn" },
      { id: "scalp_care", label: "Phục hồi & làm sạch sâu da đầu" },
    ]
  }
];

export function HairAssessment({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const complete = step === questions.length;
  const current = questions[step];
  const progress = complete ? 100 : ((step + 1) / questions.length) * 100;

  const [sessionUser, setSessionUser] = useState<SessionUser>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadStatus, setLeadStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [leadError, setLeadError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((body) => setSessionUser(body.data ?? null))
      .finally(() => setSessionChecked(true));
  }, []);

  async function submitLead(fullName: string, phone: string) {
    setLeadStatus("saving");
    setLeadError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { fullName, phone },
          category: "hair",
          answers: { ...answers, diagnosis: analysis?.diagnosis ?? "" },
          appointment: { mode: "now" },
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Không thể gửi thông tin, vui lòng thử lại.");
      setLeadStatus("done");
    } catch (error) {
      setLeadStatus("error");
      setLeadError(error instanceof Error ? error.message : "Không thể gửi thông tin, vui lòng thử lại.");
    }
  }

  useEffect(() => {
    if (complete && sessionChecked && sessionUser?.phone && leadStatus === "idle") {
      void submitLead(sessionUser.fullName, sessionUser.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete, sessionChecked, sessionUser]);

  // Personalized Diagnosis Engine
  const analysis = useMemo(() => {
    if (!complete) return null;
    
    const stage = answers["stage"];
    const duration = answers["duration"];
    const genetics = answers["genetics"];
    const scalp = answers["scalp"];
    const lifestyle = answers["lifestyle"];
    
    let diagnosis = "";
    let routine = "";
    let activeIngredients = [];
    let lifestyleAdvice = "";
    
    // 1. Diagnosis Logic
    if (stage === "stage3" || stage === "stage4") {
      diagnosis = "Rụng tóc kiểu hói nam giới (Androgenetic Alopecia) giai đoạn tiến triển. Nang tóc tại vùng trán/đỉnh đầu đang có dấu hiệu thu nhỏ rõ rệt do sự nhạy cảm với hormone DHT.";
      activeIngredients.push("Minoxidil 5%", "Finasteride / Saw Palmetto (Ức chế DHT)");
    } else if (genetics === "yes" && (stage === "stage2" || stage === "stage1")) {
      diagnosis = "Dấu hiệu khởi phát của rụng tóc di truyền (Androgenetic Alopecia) giai đoạn sớm. Việc can thiệp ngay lúc này sẽ giúp giữ lại tối đa số lượng nang tóc khỏe mạnh.";
      activeIngredients.push("Redensyl 3%", "Capixyl", "Saw Palmetto");
    } else if (duration === "under_3m" && (lifestyle === "stress" || lifestyle === "nosleep" || lifestyle === "diet")) {
      diagnosis = "Rụng tóc phản ứng (Telogen Effluvium) cấp tính. Cơ thể phản ứng với căng thẳng/thiếu hụt dinh dưỡng khiến chu kỳ sống của tóc bị rút ngắn đột ngột.";
      activeIngredients.push("Biotin", "Peptide đồng", "Kẽm & Acid Amin");
    } else {
      diagnosis = "Rụng tóc hỗn hợp hoặc do suy giảm chất lượng nang tóc theo thời gian. Cần một phác đồ nuôi dưỡng toàn diện để phục hồi hàng rào bảo vệ da đầu và kích thích mọc mới.";
      activeIngredients.push("Biotin", "Chiết xuất nhân sâm", "Keratin");
    }
    
    // 2. Scalp specific logic
    if (scalp === "oily") {
      routine = "Bước 1: Làm sạch sâu bã nhờn bằng Dầu gội chứa Salicylic Acid (BHA). Bước 2: Thoa tinh chất đặc trị lên vùng tóc thưa. Bước 3: Massage nhẹ nhàng.";
      activeIngredients.push("Salicylic Acid");
    } else if (scalp === "dry" || scalp === "itchy") {
      routine = "Bước 1: Gội đầu bằng Dầu gội dịu nhẹ, cân bằng ẩm chứa Ketoconazole hoặc Piroctone Olamine. Bước 2: Dùng serum phục hồi da đầu. Bước 3: Thoa tinh chất kích mọc.";
      if (scalp === "itchy") activeIngredients.push("Ketoconazole / Piroctone Olamine");
    } else {
      routine = "Bước 1: Làm sạch với dầu gội dịu nhẹ (Sulfate-free). Bước 2: Thoa tinh chất đặc trị 1-2 lần/ngày. Bước 3: Đảm bảo da đầu khô ráo trước khi ngủ.";
    }
    
    // 3. Lifestyle Advice
    if (lifestyle === "stress") {
      lifestyleAdvice = "Cortisol (hormone căng thẳng) đang cản trở sự phát triển của nang tóc. Hãy dành 15-30 phút mỗi ngày cho thiền, hít thở sâu hoặc thể thao để giảm tải áp lực.";
    } else if (lifestyle === "nosleep") {
      lifestyleAdvice = "Nang tóc phục hồi mạnh nhất trong lúc ngủ sâu (từ 11h đêm - 2h sáng). Việc thức khuya đang làm chậm quá trình tái tạo của tóc, hãy cố gắng ngủ đủ 7-8 tiếng.";
    } else if (lifestyle === "diet") {
      lifestyleAdvice = "Tóc được cấu tạo chủ yếu từ Protein (Keratin). Bạn cần bổ sung thêm Trứng, Cá hồi, Hạt óc chó và vitamin tổng hợp (đặc biệt là Biotin và Sắt) vào bữa ăn.";
    } else {
      lifestyleAdvice = "Tiếp tục duy trì thói quen sinh hoạt điều độ, kết hợp massage da đầu 3-5 phút mỗi ngày để tăng tuần hoàn máu đến nang tóc.";
    }
    
    // Deduplicate active ingredients
    activeIngredients = Array.from(new Set(activeIngredients));

    return { diagnosis, routine, activeIngredients, lifestyleAdvice };
  }, [answers, complete]);

  function choose(optionId: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: optionId }));
    // Auto-advance for better UX
    setTimeout(() => {
      setStep((value) => Math.min(value + 1, questions.length));
    }, 300);
  }

  function next() {
    if (!answers[current.id]) return;
    setStep((value) => Math.min(value + 1, questions.length));
  }

  function restart() {
    setAnswers({});
    setStep(0);
  }

  const Wrapper = embedded ? "div" : "main";

  return (
    <Wrapper className={embedded ? styles.embedded : styles.page}>
      {!embedded && <SiteHeader />}
      <section className={styles.canvas} id="quiz">
        <div className={styles.orbOne} />
        <div className={styles.orbTwo} />
        <div className={styles.intro}>
          <span><Sparkles size={15} /> Kiểm tra sức khỏe mái tóc</span>
          <h1>Phân tích chuyên sâu.</h1>
          <p>Chỉ mất 1 phút để nhận ngay phác đồ chăm sóc cá nhân hóa chuẩn y khoa dành riêng cho bạn.</p>
        </div>
        <div className={styles.card}>
          {!complete ? (
            <>
              <div className={styles.progressMeta}><span>Bước {step + 1} / {questions.length}</span><span>{Math.round(progress)}%</span></div>
              <div className={styles.progressTrack}><i style={{ width: `${progress}%` }} /></div>
              
              <div className={styles.questionContainer}>
                <p className={styles.eyebrow}>ĐÁNH GIÁ TÌNH TRẠNG TÓC</p>
                <h2>{current.title}</h2>
                <p className={styles.helper}>{current.helper}</p>
                
                <div className={current.options[0].image ? styles.imageOptions : styles.options}>
                  {current.options.map((option) => {
                    const selected = answers[current.id] === option.id;
                    return (
                      <button 
                        className={selected ? styles.selected : ""} 
                        key={option.id} 
                        onClick={() => choose(option.id)}
                      >
                        {option.image && (
                          <div className={styles.optionImage}>
                            <Image src={option.image} alt={option.label} width={200} height={200} />
                          </div>
                        )}
                        <span>{option.label}</span>
                        {selected && !option.image && <Check size={18} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.controls}>
                <button className={styles.back} disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ChevronLeft size={18} /> Quay lại</button>
                <button className={styles.next} disabled={!answers[current.id]} onClick={next}>Tiếp tục <ChevronRight size={18} /></button>
              </div>
            </>
          ) : (
            <div className={styles.result}>
              <div className={styles.resultHeader}>
                <div className={styles.resultMark}><Check size={28} /></div>
                <p className={styles.eyebrow}>HOÀN THÀNH ĐÁNH GIÁ</p>
                <h2>Phác đồ chăm sóc dành riêng cho bạn</h2>
                <p>Hệ thống đã phân tích các yếu tố từ độ tuổi, thói quen sinh hoạt đến tình trạng da đầu của bạn để đưa ra chẩn đoán dưới đây.</p>
              </div>

              <div className={styles.leadBox}>
                {sessionUser?.phone ? (
                  <p className={styles.leadNote}>
                    <PhoneCall size={16} />
                    {leadStatus === "saving" && "Đang ghi nhận thông tin của bạn…"}
                    {leadStatus === "done" &&
                      `Đã ghi nhận! Chuyên gia sẽ gọi tới số ${sessionUser.phone} để tư vấn cho bạn trong ít phút.`}
                    {leadStatus === "error" && (
                      <>
                        {leadError}{" "}
                        <button type="button" onClick={() => void submitLead(sessionUser.fullName, sessionUser.phone)}>
                          Thử lại
                        </button>
                      </>
                    )}
                  </p>
                ) : leadStatus === "done" ? (
                  <p className={styles.leadNote}>
                    <PhoneCall size={16} /> Cảm ơn bạn! Chuyên gia sẽ gọi tới số {leadPhone} trong ít phút để tư vấn lộ trình phù hợp.
                  </p>
                ) : (
                  <form
                    className={styles.leadForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!leadName.trim() || !leadPhone.trim()) return;
                      void submitLead(leadName.trim(), leadPhone.trim());
                    }}
                  >
                    <p className={styles.leadTitle}>Để lại số điện thoại để chuyên gia gọi tư vấn miễn phí theo đúng phác đồ này</p>
                    <div className={styles.leadFields}>
                      <input
                        placeholder="Họ và tên"
                        value={leadName}
                        onChange={(event) => setLeadName(event.target.value)}
                        required
                      />
                      <input
                        placeholder="Số điện thoại"
                        inputMode="tel"
                        value={leadPhone}
                        onChange={(event) => setLeadPhone(event.target.value)}
                        required
                      />
                      <button type="submit" disabled={leadStatus === "saving"}>
                        {leadStatus === "saving" ? <Loader2 size={16} className={styles.spin} /> : <PhoneCall size={16} />}
                        {leadStatus === "saving" ? "Đang gửi…" : "Gửi cho tôi"}
                      </button>
                    </div>
                    {leadStatus === "error" && <p className={styles.leadError}>{leadError}</p>}
                  </form>
                )}
              </div>

              <div className={styles.diagnosisBox}>
                <h3>1. Chẩn đoán lâm sàng</h3>
                <p>{analysis?.diagnosis}</p>
              </div>

              <div className={styles.activeIngredientsBox}>
                <h3>2. Hoạt chất & Dưỡng chất thiết yếu</h3>
                <div className={styles.tags}>
                  {analysis?.activeIngredients.map((ing: string) => <span key={ing}><Sparkles size={14}/> {ing}</span>)}
                </div>
              </div>

              <div className={styles.routineBox}>
                <h3>3. Chu trình chăm sóc đề xuất (Routine)</h3>
                <p>{analysis?.routine}</p>
              </div>

              <div className={styles.lifestyleBox}>
                <h3>4. Lời khuyên Sinh hoạt & Thói quen</h3>
                <p>{analysis?.lifestyleAdvice}</p>
              </div>

              <div className={styles.actions}>
                <button className={styles.primaryAction}>Mua Phác Đồ Đề Xuất</button>
                <button className={styles.restart} onClick={restart}><RotateCcw size={17} /> Làm lại bài kiểm tra</button>
              </div>
            </div>
          )}
        </div>
        <p className={styles.note}>Lưu ý: Đánh giá này mang tính chất định hướng chăm sóc và không thay thế cho chẩn đoán y tế trực tiếp từ bác sĩ chuyên khoa.</p>
      </section>
    </Wrapper>
  );
}
