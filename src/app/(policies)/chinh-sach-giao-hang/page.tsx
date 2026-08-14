import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách giao hàng kín đáo | CareWise",
  description: "Chính sách giao hàng siêu tốc, đóng gói kín đáo bảo mật thông tin đối với các sản phẩm trị hói đầu nam giới và rụng tóc.",
};

export default function ShippingPolicyPage() {
  return (
    <article style={{ lineHeight: 1.8, fontSize: "16px" }}>
      <h1 style={{ fontSize: "2.2rem", marginBottom: "1rem", letterSpacing: "-0.03em" }}>Chính sách Giao hàng Kín đáo</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>Cập nhật lần cuối: 15/08/2026</p>
      
      <h2>1. Cam kết đóng gói bảo mật (Discreet Packaging)</h2>
      <p>Nhiều khách hàng nam giới e ngại khi nhận các bưu phẩm có ghi rõ chữ <em>&quot;thuốc trị hói đầu&quot;, &quot;xịt mọc tóc&quot; hay &quot;chống rụng tóc&quot;</em>. Thấu hiểu điều đó, toàn bộ bưu kiện của CareWise đều được đóng hộp carton trơn, che tên sản phẩm hoàn toàn trên bill giao hàng. Chỉ bạn mới biết bên trong có gì.</p>
      
      <h2>2. Thời gian giao hàng</h2>
      <p>Việc điều trị nang tóc cần sự liên tục, không ngắt quãng. Do đó, chúng tôi luôn ưu tiên giao hàng nhanh nhất:</p>
      <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem" }}>
        <li><strong>Nội thành TP.HCM & Hà Nội:</strong> Nhận hàng ngay trong 2-4 tiếng (Giao hỏa tốc) hoặc ngày hôm sau.</li>
        <li><strong>Các tỉnh thành khác:</strong> Nhận hàng từ 2 đến 4 ngày làm việc.</li>
      </ul>
      
      <h2>3. Chi phí vận chuyển</h2>
      <p>Miễn phí giao hàng toàn quốc (Freeship) cho mọi phác đồ chăm sóc tóc chuyên sâu, bộ sản phẩm trị hói toàn diện hoặc các đơn hàng có tổng giá trị từ 499.000đ trở lên.</p>
    </article>
  );
}
