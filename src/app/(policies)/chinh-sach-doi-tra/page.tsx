import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách đổi trả & Hoàn tiền | CareWise",
  description: "Cam kết đổi trả sản phẩm trị rụng tóc, hói đầu hoặc hoàn tiền nếu gặp tác dụng phụ không mong muốn. Mua sắm an tâm cùng CareWise.",
};

export default function RefundPolicyPage() {
  return (
    <article style={{ lineHeight: 1.8, fontSize: "16px" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>Chính sách Đổi trả & Hoàn tiền</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Cập nhật lần cuối: 15/08/2026</p>
      
      <h2>1. Cam kết rủi ro bằng 0 (Zero-Risk Guarantee)</h2>
      <p>Đối với các sản phẩm <strong>tinh chất mọc tóc, serum trị hói đầu chữ M, và dầu gội chống rụng tóc</strong>, chúng tôi cam kết hoàn tiền 100% trong vòng 14 ngày nếu bạn gặp phải tình trạng kích ứng da đầu nặng hoặc tác dụng phụ không được mô tả trên bao bì.</p>
      
      <h2>2. Điều kiện áp dụng đổi trả</h2>
      <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
        <li>Sản phẩm bị lỗi từ phía nhà sản xuất (hỏng nắp móp méo chảy đổ dung dịch kích mọc).</li>
        <li>Sản phẩm giao không đúng với Phác đồ điều trị mà bạn đã đặt mua (ví dụ: nhầm lẫn giữa nồng độ Minoxidil 2% và 5%).</li>
        <li>Bạn chưa bóc tem seal đối với những sản phẩm muốn hoàn lại do đổi ý.</li>
      </ul>
      
      <h2>3. Quy trình xử lý</h2>
      <p>Khách hàng vui lòng chụp lại hình ảnh sản phẩm và vùng da đầu (nếu có kích ứng), sau đó gửi qua mục Hỗ trợ. Đội ngũ dược sĩ chuyên môn về <em>chăm sóc tóc và da đầu</em> của chúng tôi sẽ đánh giá và tiến hành hoàn tiền trong 24-48 giờ làm việc.</p>
    </article>
  );
}
