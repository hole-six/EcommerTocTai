"use client";

import { ArrowUpRight, CreditCard, PackagePlus, ShoppingBag, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { statusLabel, type OrderStatus } from "@/lib/orderLabels";
import panel from "@/components/admin/admin-panel.module.css";
import styles from "./admin.module.css";

type Report = {
  revenue: number;
  orders: number;
  customerCount: number;
  guestCustomerCount: number;
  byStatus: { status: OrderStatus; count: number }[];
  byDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};
type Order = { _id: string; orderNumber: string; customer: { fullName: string }; items: { name: string }[]; total: number; status: OrderStatus };
type Product = { inventory: number; status: string };

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statusTone: Record<OrderStatus, string> = { pending: "violet", confirmed: "blue", processing: "orange", shipping: "blue", completed: "green", cancelled: "red", returned: "gray" };
const statusBarColor: Record<OrderStatus, string> = { pending: "#5925dc", confirmed: "#175cd3", processing: "#b54708", shipping: "#175cd3", completed: "#027a48", cancelled: "#b42318", returned: "#475467" };

export default function AdminPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [today] = useState(() => new Date());

  useEffect(() => {
    fetch("/api/admin/reports").then((response) => response.json()).then((body) => setReport(body.data ?? null));
    fetch("/api/orders").then((response) => response.json()).then((body) => setOrders((body.data ?? []).slice(0, 6)));
    fetch("/api/commerce/products?status=all").then((response) => response.json()).then((body) => setLowStockCount((body.data ?? []).filter((product: Product) => product.status === "active" && product.inventory < 10).length));
  }, []);

  const avgOrderValue = report?.orders ? report.revenue / report.orders : 0;
  const pending = report?.byStatus.find((row) => row.status === "pending")?.count ?? 0;
  const maxDayRevenue = Math.max(1, ...(report?.byDay.map((day) => day.revenue) ?? [1]));
  const maxStatusCount = Math.max(1, ...(report?.byStatus.map((row) => row.count) ?? [1]));
  const totalStatusCount = (report?.byStatus ?? []).reduce((sum, row) => sum + row.count, 0);
  const labelEvery = report && report.byDay.length > 0 ? Math.max(1, Math.ceil(report.byDay.length / 6)) : 1;

  const metrics = [
    { label: "Doanh thu", value: money.format(report?.revenue ?? 0), icon: CreditCard, tone: "green" },
    { label: "Tổng đơn hàng", value: String(report?.orders ?? 0), icon: ShoppingBag, tone: "orange" },
    { label: "Khách đăng ký / vãng lai", value: `${report?.customerCount ?? 0} / ${report?.guestCustomerCount ?? 0}`, icon: Users, tone: "violet" },
    { label: "Giá trị đơn trung bình", value: money.format(Math.round(avgOrderValue)), icon: TrendingUp, tone: "blue" },
  ] as const;

  return (
    <AdminShell breadcrumb="Tổng quan">
      <section className={styles.headline}>
        <div>
          <p>{today.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}</p>
          <h1>Chào mừng trở lại <span>✦</span></h1>
          <h2>Đây là những gì đang diễn ra với cửa hàng của bạn hôm nay.</h2>
        </div>
        <Link href="/admin/products/new" className={panel.primaryButton}><PackagePlus size={15} /> Tạo sản phẩm mới</Link>
      </section>

      <section className={panel.metrics}>
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <article key={label}>
            <div className={styles.metricTop}>
              <span>{label.toUpperCase()}</span>
              <div className={`${styles.metricIcon} ${styles[`metric${tone}`]}`}><Icon size={16} /></div>
            </div>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className={styles.analytics}>
        <article className={styles.revenue}>
          <div className={styles.panelHeader}>
            <div><p>PHÂN TÍCH DOANH THU</p><h3>30 ngày gần nhất</h3></div>
            <Link href="/admin/reports" className={styles.viewAll}>Xem báo cáo <ArrowUpRight size={14} /></Link>
          </div>
          <div className={styles.chartSummary}>
            <strong>{money.format(report?.revenue ?? 0)}</strong>
            <span>tổng doanh thu (không tính đơn huỷ)</span>
          </div>
          {report && report.byDay.length > 0 ? (
            <div className={styles.chart}>
              {report.byDay.map((day, index) => (
                <div key={day.date} className={styles.chartBar} title={`${day.date}: ${money.format(day.revenue)}`}>
                  <i style={{ height: `${Math.max(3, (day.revenue / maxDayRevenue) * 100)}%` }} />
                  {index % labelEvery === 0 && <span>{day.date.slice(5)}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--admin-faint)", fontSize: 12, marginTop: 40, textAlign: "center" }}>Chưa có dữ liệu doanh thu.</p>
          )}
        </article>

        <article className={styles.channel}>
          <div className={styles.panelHeader}><div><p>ĐƠN HÀNG</p><h3>Theo trạng thái</h3></div></div>
          <div className={styles.statusRows}>
            {(report?.byStatus ?? []).map((row) => (
              <div key={row.status} className={styles.statusRow}>
                <div className={styles.statusRowTop}>
                  <span className={`${panel.status} ${panel[statusTone[row.status]]}`}>{statusLabel[row.status]}</span>
                  <b>{row.count}</b>
                </div>
                <div className={styles.statusTrack}><i style={{ width: `${(row.count / maxStatusCount) * 100}%`, background: statusBarColor[row.status] }} /></div>
              </div>
            ))}
            {report && totalStatusCount === 0 && <p style={{ color: "var(--admin-faint)", fontSize: 12 }}>Chưa có đơn hàng nào.</p>}
          </div>
        </article>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.orders}>
          <div className={styles.panelHeader}>
            <div><p>ĐƠN HÀNG MỚI NHẤT</p><h3>Cần theo dõi</h3></div>
            <Link href="/admin/orders" className={styles.viewAll}>Xem tất cả <ArrowUpRight size={14} /></Link>
          </div>
          <div className={panel.tableWrap} style={{ marginTop: 14 }}>
            <table>
              <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td><b>{order.orderNumber}</b></td>
                    <td>{order.customer?.fullName}</td>
                    <td>{order.items[0]?.name}{order.items.length > 1 && ` +${order.items.length - 1}`}</td>
                    <td><b>{money.format(order.total)}</b></td>
                    <td><span className={`${panel.status} ${panel[statusTone[order.status]]}`}>{statusLabel[order.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && <p className={panel.empty}>Chưa có đơn hàng nào.</p>}
          </div>
        </article>

        <article className={styles.taskPanel}>
          <div className={styles.panelHeader}><div><p>CẦN XỬ LÝ</p><h3>Việc cần làm</h3></div><span className={styles.taskCount}>{(lowStockCount ? 1 : 0) + (pending ? 1 : 0)}</span></div>
          {lowStockCount > 0 && <Link href="/admin/inventory" className={styles.task}><i className={styles.alert}>!</i><div><b>{lowStockCount} sản phẩm sắp hết hàng</b><span>Kiểm tra và bổ sung tồn kho.</span></div><ArrowUpRight size={16} /></Link>}
          {pending > 0 && <Link href="/admin/orders" className={styles.task}><i className={styles.info}>↗</i><div><b>{pending} đơn hàng chờ xác nhận</b><span>Xác nhận hoặc huỷ đơn sớm nhất.</span></div><ArrowUpRight size={16} /></Link>}
          {lowStockCount === 0 && pending === 0 && <p style={{ padding: "16px 0", color: "var(--admin-faint)", fontSize: 12 }}>Không có việc cần xử lý gấp.</p>}

          <div className={styles.panelHeader} style={{ marginTop: 26 }}><div><p>BÁN CHẠY</p><h3>Top sản phẩm</h3></div></div>
          <div className={styles.topProducts}>
            {(report?.topProducts ?? []).slice(0, 5).map((product, index) => (
              <div key={product.name} className={styles.topProduct}>
                <span className={styles.topRank}>{index + 1}</span>
                <div style={{ minWidth: 0 }}><b>{product.name}</b><small>{product.quantity} đã bán</small></div>
                <span className={styles.topProductValue}>{money.format(product.revenue)}</span>
              </div>
            ))}
            {report && report.topProducts.length === 0 && <p style={{ color: "var(--admin-faint)", fontSize: 12 }}>Chưa có dữ liệu bán hàng.</p>}
          </div>
        </article>
      </section>
    </AdminShell>
  );
}
