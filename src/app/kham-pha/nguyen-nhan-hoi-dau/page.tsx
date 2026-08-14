import { Metadata } from "next";
import { canonical, buildSocialMeta, articleJsonLd, breadcrumbJsonLd, faqJsonLd, SITE_URL } from "@/lib/seo.config";

const title = "Nguyên nhân hói đầu nam giới: Yếu tố di truyền & DHT | CareWise";
const description = "Tìm hiểu tận gốc nguyên nhân gây rụng tóc, hói đầu ở nam giới. Khám phá vai trò của hormone DHT và cách ngăn chặn quá trình teo nang tóc hiệu quả.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["nguyên nhân hói đầu", "rụng tóc nam giới", "hormone DHT", "hói di truyền", "chữa hói đầu"],
  alternates: { canonical: canonical("/kham-pha/nguyen-nhan-hoi-dau") },
  ...buildSocialMeta({
    title,
    description,
    url: canonical("/kham-pha/nguyen-nhan-hoi-dau"),
    type: "article",
  }),
};

export default function NguyenNhanHoiDauPage() {
  const articleLd = articleJsonLd({
    headline: "Sự thật về Nguyên nhân hói đầu ở nam giới",
    description: "Tìm hiểu tận gốc nguyên nhân gây rụng tóc, hói đầu ở nam giới. Khám phá vai trò của hormone DHT và cách ngăn chặn quá trình teo nang tóc hiệu quả.",
    url: canonical("/kham-pha/nguyen-nhan-hoi-dau"),
    datePublished: "2026-08-15T00:00:00+07:00",
    dateModified: "2026-08-15T00:00:00+07:00",
    keywords: ["nguyên nhân hói đầu", "rụng tóc nam giới", "hormone DHT", "hói di truyền", "chữa hói đầu"],
  });

  const breadcrumbLd = breadcrumbJsonLd([
    { name: "Trang chủ", url: SITE_URL },
    { name: "Khám phá", url: canonical("/kham-pha") },
    { name: "Nguyên nhân hói đầu", url: canonical("/kham-pha/nguyen-nhan-hoi-dau") },
  ]);

  const faqLd = faqJsonLd([
    { question: "Nguyên nhân chính gây hói đầu ở nam giới là gì?", answer: "Khoảng 90% các ca hói đầu ở nam giới có liên quan trực tiếp đến DHT (Dihydrotestosterone) - một loại hormone sinh dục nam được tổng hợp từ Testosterone thông qua enzyme 5-alpha reductase." },
    { question: "Tại sao cùng một lượng DHT nhưng có người bị hói, có người không?", answer: "Do yếu tố di truyền (Androgenetic Alopecia). Nếu trong gia đình có người mắc chứng rụng tóc, thụ thể nang tóc của bạn có xu hướng nhạy cảm bất thường với DHT." },
    { question: "Stress có gây rụng tóc không?", answer: "Có. Hormone Cortisol tiết ra khi stress làm co mạch máu, giảm lưu lượng máu nuôi dưỡng nang tóc, đẩy tóc nhanh chóng vào giai đoạn rụng (Telogen Effluvium)." },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <article style={{ lineHeight: 1.8, fontSize: "16px" }}>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>Sự thật về Nguyên nhân hói đầu ở nam giới</h1>
        <p style={{ color: "#64748b", marginBottom: "2rem" }}>Được viết bởi Đội ngũ Chuyên gia CareWise • Cập nhật: 15/08/2026</p>
      
        <p>Hơn 50% nam giới sẽ phải đối mặt với tình trạng rụng tóc, hói đầu khi bước qua tuổi 40. Tuy nhiên, tình trạng này đang ngày càng trẻ hóa. Để tìm ra cách chữa hói đầu hiệu quả, bước đầu tiên và quan trọng nhất là phải hiểu rõ nguyên nhân cốt lõi khiến nang tóc của bạn &quot;đình công&quot;.</p>
      
        <h2>1. Sát thủ thầm lặng: Hormone DHT (Dihydrotestosterone)</h2>
        <p>Khoảng 90% các ca <strong>hói đầu ở nam giới</strong> có liên quan trực tiếp đến DHT - một loại hormone sinh dục nam được tổng hợp từ Testosterone thông qua enzyme 5-alpha reductase. Mặc dù đóng vai trò quan trọng trong sự phát triển nam tính ở tuổi dậy thì, DHT lại là &quot;kẻ thù số 1&quot; của nang tóc khi trưởng thành.</p>
        <p>Khi DHT liên kết với các thụ thể ở nang tóc, nó sẽ khiến nang tóc bị thu nhỏ dần (miniaturization), chu kỳ sinh trưởng của tóc (giai đoạn Anagen) bị rút ngắn. Hệ quả là sợi tóc mọc ra ngày càng mỏng, yếu, nhạt màu và cuối cùng là rụng vĩnh viễn.</p>
      
        <h2>2. Yếu tố di truyền (Androgenetic Alopecia)</h2>
        <p>Tại sao cùng một lượng DHT nhưng người này bị hói, người kia lại không? Câu trả lời nằm ở ADN của bạn. Nếu trong gia đình (bố, ông nội, ông ngoại) có người mắc chứng rụng tóc, thụ thể nang tóc của bạn có xu hướng nhạy cảm bất thường với DHT.</p>
        <p>Tình trạng rụng tóc do di truyền thường bắt đầu với hiện tượng lùi đường chân tóc ở hai bên thái dương, tạo thành <strong>hói chữ M</strong>, sau đó lan dần lên đỉnh đầu (hói chữ U hoặc chữ O).</p>
      
        <h2>3. Các nguyên nhân cộng hưởng khác</h2>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
          <li><strong>Căng thẳng mãn tính (Stress):</strong> Hormone Cortisol tiết ra khi stress làm co mạch máu, giảm lưu lượng máu nuôi dưỡng nang tóc, đẩy tóc nhanh chóng vào giai đoạn rụng (Telogen Effluvium).</li>
          <li><strong>Thiếu hụt dinh dưỡng:</strong> Nang tóc cần lượng lớn protein (keratin), sắt, kẽm và biotin để sản xuất sợi tóc khỏe mạnh.</li>
          <li><strong>Viêm da đầu và gàu nấm:</strong> Da đầu tiết quá nhiều dầu thừa (bã nhờn) bít tắc lỗ chân lông tạo môi trường cho nấm Malassezia phát triển, làm suy yếu chân tóc.</li>
        </ul>
      
        <h2>Giải pháp từ CareWise</h2>
        <p>Tại CareWise, chúng tôi cung cấp phác đồ điều trị hói đầu toàn diện, tập trung vào việc ức chế DHT tại chỗ (bằng Saw Palmetto, Finasteride topical) kết hợp với các hoạt chất kích thích mọc tóc mạnh mẽ (Minoxidil, Redensyl). <a href="/pages/hair-form-assessment" style={{ color: "#143461", fontWeight: 600 }}>Thực hiện bài kiểm tra tóc ngay</a> để nhận phác đồ dành riêng cho bạn.</p>
      </article>
    </>
  );
}
