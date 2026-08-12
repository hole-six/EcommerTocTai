"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import panel from "@/components/admin/admin-panel.module.css";
import { statusLabel, type OrderStatus } from "@/lib/orderLabels";

type Report = {
  revenue: number;
  orders: number;
  customerCount: number;
  guestCustomerCount: number;
  byStatus: { status: OrderStatus; count: number }[];
  byDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statusTone: Record<OrderStatus, string> = { pending: "violet", confirmed: "blue", processing: "orange", shipping: "blue", completed: "green", cancelled: "red", returned: "gray" };

export default function AdminReportsPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports").then((response) => response.json()).then((body) => setReport(body.data ?? null)).finally(() => setLoading(false));
  }, []);

  const maxDayRevenue = Math.max(1, ...(report?.byDay.map((day) => day.revenue) ?? [1]));
  const avgOrderValue = report && report.orders > 0 ? report.revenue / report.orders : 0;

  return (
    <AdminShell breadcrumb="Báo cáo">
      <div className={panel.header}>
        <div>
          <p>COMMERCE / BÁO CÁO</p>
          <h1>Báo cáo kinh doanh</h1>
        </div>
      </div>

      {loading && <p className={panel.empty}>Đang tải báo cáo…</p>}

      {report && (
        <>
          <div className={panel.metrics}>
            <article><span>DOANH THU (KHÔNG TÍNH ĐƠN HUỶ)</span><strong>{money.format(report.revenue)}</strong></article>
            <article><span>TỔNG ĐƠN HÀNG</span><strong>{report.orders}</strong></article>
            <article><span>GIÁ TRỊ ĐƠN TRUNG BÌNH</span><strong>{money.format(Math.round(avgOrderValue))}</strong></article>
            <article><span>KHÁCH ĐĂNG KÝ / VÃNG LAI</span><strong>{report.customerCount} / {report.guestCustomerCount}</strong></article>
          </div>

          <div className={panel.grid2}>
            <div className={panel.panel}>
              <div className={panel.panelPad}>
                <h2>Doanh thu 30 ngày gần nhất</h2>
                {report.byDay.length === 0 && <p className={panel.empty}>Chưa có dữ liệu.</p>}
                <div style={{ display: "grid", gap: 6 }}>
                  {report.byDay.map((day) => (
                    <div key={day.date} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px", alignItems: "center", gap: 6, fontSize: 10 }}>
                      <span style={{ color: "#84918c" }}>{day.date.slice(5)}</span>
                      <div style={{ background: "#eef1ee", borderRadius: 4, overflow: "hidden", height: 14 }}>
                        <div style={{ width: `${(day.revenue / maxDayRevenue) * 100}%`, background: "#2e7d6d", height: "100%" }} />
                      </div>
                      <span style={{ textAlign: "right", color: "#314840", fontWeight: 700, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{money.format(day.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={panel.panel}>
              <div className={panel.panelPad}>
                <h2>Đơn hàng theo trạng thái</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {report.byStatus.map((row) => (
                    <div key={row.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`${panel.status} ${panel[statusTone[row.status]]}`}>{statusLabel[row.status]}</span>
                      <b>{row.count}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={panel.panel}>
            <div className={panel.panelPad}>
              <h2>Sản phẩm bán chạy</h2>
              <div className={panel.tableWrap}>
                <table>
                  <thead><tr><th>Sản phẩm</th><th>Số lượng đã bán</th><th>Doanh thu</th></tr></thead>
                  <tbody>
                    {report.topProducts.map((product) => (
                      <tr key={product.name}><td><b>{product.name}</b></td><td>{product.quantity}</td><td><b>{money.format(product.revenue)}</b></td></tr>
                    ))}
                  </tbody>
                </table>
                {report.topProducts.length === 0 && <p className={panel.empty}>Chưa có dữ liệu bán hàng.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
