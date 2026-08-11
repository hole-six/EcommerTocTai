"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Boxes,
  ChartNoAxesCombined,
  ChevronDown,
  CircleHelp,
  CreditCard,
  Home,
  Menu,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import styles from "./admin.module.css";
import fontStyles from "./font.module.css";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

const metrics = [
  { label: "Doanh thu thuần", value: money.format(24860000), trend: "+18.4%", note: "so với tháng trước", icon: CreditCard, tone: "green" },
  { label: "Đơn hàng", value: "1,284", trend: "+12.6%", note: "so với tháng trước", icon: ShoppingBag, tone: "orange" },
  { label: "Khách hàng mới", value: "384", trend: "+8.2%", note: "so với tháng trước", icon: Users, tone: "violet" },
  { label: "Tỷ lệ chuyển đổi", value: "4.82%", trend: "+0.6%", note: "so với tháng trước", icon: ChartNoAxesCombined, tone: "blue" },
];

const orders = [
  ["#TT-20918", "Nguyễn Khánh Linh", "Serum Mọc Tóc 5%", "349.000đ", "Đã thanh toán", "paid"],
  ["#TT-20917", "Trần Minh Hoàng", "Bộ Phục Hồi Tóc Hư Tổn", "579.000đ", "Đang đóng gói", "processing"],
  ["#TT-20916", "Lê Thu Anh", "Dầu Gội Sạch Da Đầu", "239.000đ", "Đang giao", "shipping"],
  ["#TT-20915", "Đỗ Bảo Ngọc", "Viên Uống Nuôi Tóc", "429.000đ", "Chờ thanh toán", "pending"],
] as const;

const nav = [
  [Home, "Tổng quan"], [ShoppingBag, "Đơn hàng"], [Package, "Sản phẩm"], [Users, "Khách hàng"], [ChartNoAxesCombined, "Báo cáo"], [Boxes, "Kho hàng"],
] as const;

export default function AdminPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={`${styles.admin} ${fontStyles.lexend}`}>
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
      <div className={styles.brandRow}><Link href="/" className={styles.brand}>TÓC<i>TAI</i><small>STUDIO</small></Link><button onClick={() => setMenuOpen(false)} aria-label="Đóng menu"><X /></button></div>
      <div className={styles.workspace}><span>Không gian làm việc</span><button>Tóc Tai Commerce <ChevronDown size={14} /></button></div>
      <nav>{nav.map(([Icon, label], index) => <button className={index === 0 ? styles.activeNav : ""} key={label}><Icon size={19} /><span>{label}</span>{label === "Đơn hàng" && <b>12</b>}</button>)}</nav>
      <div className={styles.sidebarBottom}><button><Settings size={19} /> <span>Cài đặt</span></button><button><CircleHelp size={19} /> <span>Trung tâm hỗ trợ</span></button><div className={styles.user}><div>MT</div><span><b>Minh Thư</b><small>Quản trị viên</small></span><ChevronDown size={15} /></div></div>
    </aside>
    <main className={styles.content}>
      <header className={styles.topbar}><button className={styles.menu} onClick={() => setMenuOpen(true)} aria-label="Mở menu"><Menu /></button><div className={styles.breadcrumb}><span>Commerce</span><b>/</b><strong>Tổng quan</strong></div><div className={styles.topActions}><button className={styles.search}><Search size={18} /><span>Tìm kiếm</span><kbd>⌘ K</kbd></button><button className={styles.iconButton} aria-label="Thông báo"><Bell size={19} /><i /></button><div className={styles.mobileUser}>MT</div></div></header>
      <section className={styles.headline}><div><p>11 THÁNG 8, 2026</p><h1>Chào buổi sáng, Minh Thư <span>✦</span></h1><h2>Đây là những gì đang diễn ra với cửa hàng của bạn.</h2></div><button className={styles.newProduct}><Sparkles size={16} /> Tạo sản phẩm mới</button></section>
      <section className={styles.metrics}>{metrics.map(({ label, value, trend, note, icon: Icon, tone }) => <article key={label}><div className={styles.metricLabel}><span>{label}</span><div className={styles[`metric${tone}`]}><Icon size={18} /></div></div><strong>{value}</strong><p><b>{trend}</b> {note}</p></article>)}</section>
      <section className={styles.analytics}><article className={styles.revenue}><div className={styles.panelHeader}><div><p>PHÂN TÍCH DOANH THU</p><h3>Hiệu quả bán hàng</h3></div><div className={styles.panelControls}><button>30 ngày <ChevronDown size={14} /></button><button className={styles.more}>•••</button></div></div><div className={styles.chartSummary}><strong>{money.format(24860000)}</strong><span><b>↗ 18.4%</b> so với kỳ trước</span></div><div className={styles.chart}><div className={styles.gridLines}><i /><i /><i /><i /></div><svg viewBox="0 0 720 215" preserveAspectRatio="none" aria-label="Biểu đồ doanh thu"><defs><linearGradient id="revenue" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4a9182" stopOpacity=".28" /><stop offset="100%" stopColor="#4a9182" stopOpacity="0" /></linearGradient></defs><path d="M0,182 C32,169 37,178 65,160 S97,131 126,148 S162,173 191,138 S230,106 255,130 S293,155 317,115 S351,88 384,104 S419,151 450,117 S490,91 514,106 S553,144 579,83 S616,82 646,64 S681,44 720,20 L720,215 L0,215Z" fill="url(#revenue)" /><path d="M0,182 C32,169 37,178 65,160 S97,131 126,148 S162,173 191,138 S230,106 255,130 S293,155 317,115 S351,88 384,104 S419,151 450,117 S490,91 514,106 S553,144 579,83 S616,82 646,64 S681,44 720,20" fill="none" stroke="#2e7d6d" strokeWidth="3" /></svg><div className={styles.months}>{["01 Thg 8", "05 Thg 8", "10 Thg 8", "15 Thg 8", "20 Thg 8", "25 Thg 8", "30 Thg 8"].map((month) => <span key={month}>{month}</span>)}</div></div></article>
        <article className={styles.channel}><div className={styles.panelHeader}><div><p>NGUỒN ĐƠN HÀNG</p><h3>Kênh bán hiệu quả</h3></div><button className={styles.more}>•••</button></div><div className={styles.donut}><div><b>1,284</b><span>đơn hàng</span></div></div><div className={styles.legend}><p><i className={styles.dotDirect} />Website trực tiếp <b>56.2%</b></p><p><i className={styles.dotSocial} />Mạng xã hội <b>27.8%</b></p><p><i className={styles.dotAds} />Quảng cáo <b>16.0%</b></p></div></article></section>
      <section className={styles.bottomGrid}><article className={styles.orders}><div className={styles.panelHeader}><div><p>ĐƠN HÀNG MỚI NHẤT</p><h3>Cần theo dõi</h3></div><button className={styles.viewAll}>Xem tất cả <ArrowUpRight size={14} /></button></div><div className={styles.tableWrap}><table><thead><tr><th>MÃ ĐƠN</th><th>KHÁCH HÀNG</th><th>SẢN PHẨM</th><th>TỔNG</th><th>TRẠNG THÁI</th></tr></thead><tbody>{orders.map(([id, customer, product, total, status, state]) => <tr key={id}><td><b>{id}</b></td><td>{customer}</td><td>{product}</td><td><b>{total}</b></td><td><span className={styles[state]}>{status}</span></td></tr>)}</tbody></table></div></article>
        <article className={styles.inventory}><div className={styles.panelHeader}><div><p>THÔNG MINH HƠN MỖI NGÀY</p><h3>Việc cần làm</h3></div><span className={styles.taskCount}>3</span></div><div className={styles.task}><i className={styles.alert}>!</i><div><b>04 sản phẩm sắp hết hàng</b><span>Kiểm tra và tạo phiếu nhập kho.</span></div><ArrowUpRight size={16} /></div><div className={styles.task}><i className={styles.info}>↗</i><div><b>12 đơn hàng cần xử lý</b><span>Đóng gói trước 16:00 hôm nay.</span></div><ArrowUpRight size={16} /></div><div className={styles.task}><i className={styles.success}>✓</i><div><b>Chiến dịch "Mùa tóc khỏe"</b><span>Hiệu suất tăng 24% trong hôm nay.</span></div><ArrowUpRight size={16} /></div></article></section>
    </main>
  </div>;
}
