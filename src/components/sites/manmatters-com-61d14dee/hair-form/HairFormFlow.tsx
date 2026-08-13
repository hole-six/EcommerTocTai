"use client";
import { useState } from "react";
import styles from "./HairFormFlowFixed.module.css";

const answers = ["Giai đoạn 1 - Tóc bắt đầu rụng", "Giai đoạn 2 - Tóc rụng rõ hơn", "Giai đoạn 3 - Tóc thưa nhiều", "Chưa chắc chắn"];

export function HairFormFlow() {
  const [screen, setScreen] = useState<"intro" | "question" | "upload">("intro");
  const [selected, setSelected] = useState("");
  const header = (back?: () => void, step = "Kiểm tra tóc") => <header><button className={styles.back} onClick={back}>←</button><b>Tóc Tai</b><span>{step}</span></header>;
  if (screen === "intro") return <main className={styles.page}>{header()}<section className={styles.intro}><div className={styles.illustration}><span>✦</span><i>✓</i></div><p className={styles.kicker}>CHĂM SÓC TÓC CÁ NHÂN HÓA</p><h1>Cùng hiểu mái tóc của bạn rõ hơn</h1><p>Trả lời vài câu hỏi cơ bản để nhận lộ trình giảm rụng tóc từ chuyên gia.</p><button onClick={() => setScreen("question")}>Bắt đầu <span>→</span></button><small>Chỉ mất chưa đến 1 phút</small></section></main>;
  if (screen === "question") return <main className={styles.page}>{header(() => setScreen("intro"), "1 / 1")}<section className={styles.form}><div className={styles.progress}><i /></div><p className={styles.kicker}>ĐÁNH GIÁ RỤNG TÓC</p><h1>Mô tả nào phù hợp nhất với tình trạng rụng tóc của bạn?</h1><p className={styles.muted}>Chọn lựa chọn gần nhất với tình trạng hiện tại của bạn.</p><div className={styles.options}>{answers.map((answer) => <button className={selected === answer ? styles.selected : ""} key={answer} onClick={() => setSelected(answer)}><span>{answer}</span>{selected === answer && <b>✓</b>}</button>)}</div><button className={styles.next} disabled={!selected} onClick={() => setScreen("upload")}>Tiếp theo <span>→</span></button></section></main>;
  return <main className={styles.page}>{header(() => setScreen("question"), "2 / 2")}<section className={styles.form}><div className={styles.progress}><i className={styles.full} /></div><p className={styles.kicker}>TẢI ẢNH LÊN</p><h1>Tải ảnh vùng tóc cần đánh giá</h1><p className={styles.muted}>Tải ảnh lên giúp chuyên gia đánh giá tình trạng của bạn chính xác hơn.</p><div className={styles.uploadCard}><div className={styles.uploadIcon}>＋</div><b>Tải ảnh lên</b><span>Chụp ảnh đường chân tóc và vùng đỉnh đầu</span><label>Chọn từ thư viện<input type="file" accept="image/*" /></label></div><p className={styles.skip}>Bỏ qua tải ảnh?</p><button className={styles.next} onClick={() => setScreen("intro")}>Tiếp tục <span>→</span></button></section></main>;
}
