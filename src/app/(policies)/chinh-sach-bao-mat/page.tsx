import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật thông tin | CareWise",
  description: "CareWise cam kết bảo mật tuyệt đối thông tin của khách hàng (đặc biệt là tình trạng rụng tóc, hói đầu). Xem chi tiết chính sách bảo mật của chúng tôi.",
};

export default function PrivacyPolicyPage() {
  return (
    <article style={{ lineHeight: 1.8, fontSize: "16px" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>Chính sách bảo mật thông tin</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Cập nhật lần cuối: 15/08/2026</p>
      
      <h2>1. Cam kết bảo mật y khoa</h2>
      <p>Tại CareWise, chúng tôi thấu hiểu rằng tình trạng <strong>rụng tóc, hói đầu hay các vấn đề về da đầu</strong> là những thông tin sức khỏe nhạy cảm. Vì vậy, mọi hình ảnh (đường chân tóc, vùng hói chữ M, đỉnh đầu thưa) và dữ liệu bài kiểm tra tóc của bạn đều được mã hóa 256-bit và bảo mật tuyệt đối.</p>
      
      <h2>2. Mục đích thu thập dữ liệu</h2>
      <p>Chúng tôi chỉ sử dụng thông tin của bạn để:</p>
      <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
        <li>Phân tích nguyên nhân hói đầu thông qua AI và đội ngũ chuyên gia.</li>
        <li>Cá nhân hóa phác đồ điều trị (Minoxidil, Biotin, Redensyl...) phù hợp nhất với cơ địa của bạn.</li>
        <li>Giao hàng nhanh chóng và kín đáo (che tên sản phẩm nếu khách hàng yêu cầu).</li>
      </ul>
      
      <h2>3. Không chia sẻ cho bên thứ ba</h2>
      <p>Tuyệt đối không có bất kỳ thông tin nào về việc bạn đang tìm kiếm <em>"cách mọc tóc nhanh"</em> hay <em>"thuốc trị hói đầu"</em> bị bán cho bên thứ ba vì mục đích quảng cáo chéo.</p>

      <h2>4. Quyền của khách hàng</h2>
      <p>Bạn có quyền yêu cầu CareWise xóa toàn bộ dữ liệu lịch sử tư vấn, hình ảnh da đầu và thông tin cá nhân bất cứ lúc nào thông qua tính năng trong Cài đặt tài khoản.</p>
    </article>
  );
}
