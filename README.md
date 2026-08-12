# CareWise (Tóc Tai)

Nền tảng thương mại điện tử chăm sóc tóc & sức khỏe nam giới — cửa hàng cho khách hàng và bảng quản trị (admin) đầy đủ cho vận hành.

## Công nghệ sử dụng

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT session (cookie httpOnly) qua `jose`, mật khẩu băm bằng `bcryptjs`
- **UI:** Tailwind CSS v4, shadcn/ui (Radix), Lucide icons
- **Thanh toán:** SePay (VietQR / webhook)

## Cấu trúc thư mục

```
src/
  app/              # Route Next.js (storefront + /admin)
  components/       # React components (admin/, catalog/, store/, sites/...)
  lib/              # Logic server (auth, db, validators, inventory, coupons...)
  models/           # Mongoose schema
  contexts/         # React context (giỏ hàng...)
public/             # Ảnh, video, file tĩnh
scripts/            # Script seed dữ liệu mẫu
deploy/             # Cấu hình tham khảo khi deploy VPS (Nginx)
ecosystem.config.cjs # Cấu hình PM2 cho production
```

## Chạy local

```bash
npm install
cp .env.example .env.local   # rồi điền MONGODB_URI, AUTH_SECRET, v.v.
npm run dev
```

## Biến môi trường (`.env.local`)

Xem `.env.example` để biết đầy đủ danh sách. Bắt buộc:
- `MONGODB_URI`, `MONGODB_DB`
- `AUTH_SECRET` — chuỗi ngẫu nhiên tối thiểu 32 ký tự
- `ADMIN_EMAILS` — email admin (phân tách bởi dấu phẩy)

Tùy chọn (thanh toán SePay): `SEPAY_BANK`, `SEPAY_ACCOUNT`, `SEPAY_ACCOUNT_HOLDER`, `SEPAY_WEBHOOK_SECRET` hoặc `SEPAY_WEBHOOK_API_KEY`.

## Script seed dữ liệu mẫu

```bash
npm run seed:admin     # tạo tài khoản admin
npm run seed:catalog   # seed danh mục + sản phẩm mẫu
npm run seed:banners   # seed banner trang chủ
npm run seed:orders    # seed đơn hàng mẫu
```

## Kiểm tra trước khi deploy

```bash
npm run check   # lint + typecheck + build
```

## Deploy lên VPS (PM2 + Nginx)

1. **Chuẩn bị VPS:** cài Node.js 24 (xem `.nvmrc`), MongoDB (hoặc dùng MongoDB Atlas), Nginx, và PM2 (`npm i -g pm2`).
2. **Đưa code lên VPS** (git clone hoặc rsync), sau đó:
   ```bash
   npm ci
   cp .env.example .env.local   # điền giá trị thật cho production
   npm run build
   ```
3. **Chạy bằng PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup   # để PM2 tự khởi động lại cùng VPS sau khi reboot
   ```
4. **Cấu hình Nginx reverse proxy:** copy `deploy/nginx.conf.example` sang `/etc/nginx/sites-available/carewise`, sửa `yourdomain.com` thành domain thật, rồi:
   ```bash
   sudo ln -s /etc/nginx/sites-available/carewise /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
5. **Cấp SSL miễn phí (Let's Encrypt):**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
6. **Cập nhật code sau này:**
   ```bash
   git pull
   npm ci
   npm run build
   pm2 restart carewise
   ```
