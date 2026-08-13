import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | CareWise",
  description: "Các điều khoản và điều kiện khi sử dụng dịch vụ chẩn đoán hói đầu và mua sắm sản phẩm mọc tóc tại CareWise.",
};

export default function TermsOfServicePage() {
  return (
    <article style={{ lineHeight: 1.8, fontSize: "16px" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>Điều khoản Dịch vụ</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Cập nhật lần cuối: 15/08/2026</p>
      
      <h2>1. Chấp thuận điều khoản</h2>
      <p>Khi truy cập và sử dụng nền tảng CareWise để mua sắm các sản phẩm chống <strong>rụng tóc, kích mọc tóc, hay điều trị hói đầu nam giới</strong>, bạn đồng ý tuân thủ các điều khoản này.</p>
      
      <h2>2. Miễn trừ trách nhiệm y tế (Medical Disclaimer)</h2>
      <p>Mặc dù hệ thống Bài kiểm tra rụng tóc (Hair Assessment) của CareWise được xây dựng dựa trên khoa học, kết quả đánh giá <em>mức độ hói đầu</em> hay <em>hói chữ M</em> chỉ mang tính chất tham khảo định hướng chăm sóc cá nhân hóa. Nó <strong>không thay thế</strong> cho việc chẩn đoán y tế trực tiếp từ bác sĩ da liễu.</p>
      
      <h2>3. Hiệu quả sản phẩm</h2>
      <p>Việc điều trị rụng tóc và kích thích mọc tóc (đặc biệt là hói đầu do di truyền - Androgenetic Alopecia) cần sự kiên trì tối thiểu từ 3 đến 6 tháng. Hiệu quả mọc lại tóc con phụ thuộc vào thời gian nang tóc đã thu nhỏ và mức độ tuân thủ phác đồ (ví dụ: bôi serum đúng liều, uống đủ chất) của từng cá nhân.</p>

      <h2>4. Quyền sở hữu trí tuệ</h2>
      <p>Toàn bộ nội dung, bài viết chuyên sâu về <em>nguyên nhân rụng tóc, cơ chế hoạt động của DHT</em>, và hình ảnh trên website thuộc bản quyền của CareWise.</p>
    </article>
  );
}
