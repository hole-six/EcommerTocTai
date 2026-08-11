"use client";

import { Check, ChevronDown, FileCheck2, FlaskConical, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { SiteFooter } from "@/components/sites/manmatters-com-61d14dee/shared/SiteFooter";
import { SiteHeader } from "@/components/sites/manmatters-com-61d14dee/shared/SiteHeader";
import styles from "./honest-report.module.css";

const tests = [
  ["Chiết xuất thảo mộc", ["Hàm lượng hoạt chất", "Kim loại nặng", "Aflatoxins"]],
  ["Super Blend", ["Tỷ lệ Protein"]],
  ["Creatine Powder", ["Tỷ lệ Creatine", "Kim loại nặng"]],
  ["Creatine Gummies", ["Tỷ lệ Creatine"]],
];
const faqs = [
  ["Làm sao để truy cập báo cáo cho sản phẩm của tôi?", "Nhập batch number được in ở đáy hoặc mặt sau bao bì vào ô tra cứu. Khi báo cáo đã được cập nhật, bạn sẽ thấy chứng nhận tương ứng."],
  ["Vì sao cần kiểm tra hàm lượng hoạt chất?", "Kết quả giúp đối chiếu hàm lượng thực tế trong mỗi lô với thông tin đã công bố, để bạn chủ động hiểu sản phẩm mình đang dùng."],
  ["Vì sao cần kiểm tra kim loại nặng?", "Kiểm tra độc lập giúp phát hiện các tạp chất không mong muốn và là một phần trong quy trình kiểm soát chất lượng nghiêm ngặt."],
  ["Nếu batch number hiển thị không hợp lệ thì sao?", "Hãy kiểm tra lại ký tự, không thêm khoảng trắng. Nếu vẫn không tìm thấy, gửi ảnh bao bì cho đội ngũ Tóc Tai để được hỗ trợ."],
  ["Báo cáo có được xác minh độc lập không?", "Mỗi lô công bố được đối chiếu với hồ sơ kiểm nghiệm từ phòng lab bên thứ ba đủ tiêu chuẩn."],
];

export default function HonestReportPage() {
  const [batch, setBatch] = useState("");
  const [message, setMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const submit = (event: FormEvent) => { event.preventDefault(); setMessage(batch.trim() ? "Batch number đang chờ đối chiếu với dữ liệu kiểm nghiệm." : "Vui lòng nhập batch number trên bao bì."); };
  return <main className={styles.page}><SiteHeader />
    <section className={styles.hero}><div className={styles.heroGlow} /><div className={styles.heroCopy}><p className={styles.kicker}>HONEST REPORT</p><h1>Không phỏng đoán.<br /><em>Chỉ dữ liệu thật.</em></h1><p>Mỗi lô sản phẩm được chọn lọc đều hướng đến sự minh bạch: thành phần rõ ràng, quy trình kiểm tra rõ ràng và dữ liệu có thể đối chiếu.</p><a href="#lookup">TRA CỨU BÁO CÁO <Search size={15} /></a></div><div className={styles.heroSeal}><FileCheck2 size={48} /><span>QUALITY<br />VERIFIED</span><b>100%</b></div></section>
    <section className={styles.intro}><p className={styles.kicker}>MINH BẠCH LÀ TIÊU CHUẨN</p><h2>Bạn xứng đáng biết chính xác<br />điều gì đi vào cơ thể mình.</h2><p>Tóc Tai tin rằng sản phẩm tốt không chỉ cần lời hứa. Đó là lý do mỗi batch được lưu hồ sơ kiểm định độc lập trước khi đến tay khách hàng.</p></section>
    <section className={styles.testSection}><div className={styles.testHeading}><p className={styles.kicker}>KIỂM NGHIỆM THEO LÔ</p><h2>Mỗi batch được đối chiếu các chỉ số quan trọng.</h2></div><div className={styles.testGrid}>{tests.map(([name, items], index) => <article key={name as string}><span>0{index + 1}</span><h3>{name}</h3><ul>{(items as string[]).map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></article>)}</div><p className={styles.noClaims}>Không khoa trương. Chỉ dữ liệu có thể kiểm chứng.</p></section>
    <section className={styles.lookup} id="lookup"><div><p className={styles.kicker}>TRA CỨU BÁO CÁO</p><h2>Nhập batch number<br />để xem báo cáo xác thực.</h2><p>Ví dụ: <b>MSHG25003</b></p></div><form onSubmit={submit}><label htmlFor="batch">Batch Number</label><div><input id="batch" value={batch} onChange={(event) => setBatch(event.target.value.toUpperCase())} placeholder="VD: MSHG25003" /><button type="submit">KIỂM TRA</button></div>{message && <small>{message}</small>}</form></section>
    <section className={styles.batchHelp}><div className={styles.packMock}><span>BATCH<br />NUMBER</span><b>MSHG25003</b><i>MRP ₹ 000</i></div><div><p className={styles.kicker}>TÌM BATCH NUMBER Ở ĐÂU?</p><h2>Tìm ở mặt sau bao bì,<br />cạnh MRP và ngày sản xuất.</h2><p>Batch number là mã định danh riêng của từng lô. Hãy nhập đúng ký tự để đối chiếu hồ sơ kiểm nghiệm.</p></div></section>
    <section className={styles.faqSection}><div><p className={styles.kicker}>FAQ</p><h2>Những điều<br />bạn có thể muốn biết.</h2></div><div className={styles.faqList}>{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<ChevronDown className={openFaq === index ? styles.rotate : ""} size={19} /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div></section>
    <section className={styles.certifications}><p className={styles.kicker}>OUR CERTIFICATIONS</p><h2>Chất lượng không phải là lời tuyên bố.</h2><div>{[[ShieldCheck, "Third-party tested"], [FlaskConical, "Quality controlled"], [FileCheck2, "Batch documented"]].map(([Icon, text]) => { const CertificationIcon = Icon as typeof ShieldCheck; return <span key={text as string}><CertificationIcon size={26} />{text as string}</span>; })}</div></section>
    <SiteFooter />
  </main>;
}
