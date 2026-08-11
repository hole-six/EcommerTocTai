# Tóc Tai commerce backend base

## Có sẵn

- `GET /api/commerce/health`: health check cho service.
- Đăng ký, đăng nhập và logout bằng cookie JWT: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`.
- CRUD danh mục cho admin: `/api/categories`; mỗi danh mục có `detailFields` để định nghĩa các trường chi tiết riêng.
- CRUD banner cho admin: `/api/banners`; hỗ trợ vị trí, ảnh desktop/mobile, CTA, thứ tự và trạng thái hiển thị.
- CRUD sản phẩm cho admin: `/api/commerce/products`; product `specifications` lưu được thuộc tính biến thiên theo danh mục.
- Tạo đơn guest hoặc đăng nhập: `POST /api/orders`. Guest phải nhập họ tên, số điện thoại Việt Nam và địa chỉ; người dùng đăng nhập có thể gửi `saveAddress: true` để lưu địa chỉ.
- Chỉ admin được cập nhật trạng thái đơn. Review chỉ tạo được bởi người dùng đăng nhập có sản phẩm thuộc đơn `completed`.
- `GET /api/commerce/dashboard`: KPI, tồn kho thấp và đơn mới cho admin.
- `src/lib/commerce/types.ts`: entity contracts dùng chung giữa UI/API.
- `src/lib/commerce/repository.ts`: repository memory để thay thế tập trung khi kết nối database.

## Tận dụng từ `san-bong-main`

Tái sử dụng cơ chế JWT, bcrypt, middleware `authenticate` và `isAdmin`; không tái sử dụng model/route sức khỏe. Database commerce cần tối thiểu: `users`, `products`, `productVariants`, `inventoryMovements`, `carts`, `orders`, `orderItems`, `addresses`, `payments`, `coupons`.

## Biến môi trường cần cấu hình

```bash
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/toc_tai
MONGODB_DB=toc_tai
AUTH_SECRET=<chuoi-ngau-nhien-it-nhat-32-ky-tu>
ADMIN_EMAILS=admin@example.com
```

## Bước kết nối dữ liệu thật

1. Tạo database MongoDB riêng cho Tóc Tai, không dùng URI project sức khỏe.
2. Thay repository memory bằng MongoDB/Prisma.
3. Bảo vệ mọi API admin bằng JWT + role `admin`.
4. Thêm webhook thanh toán idempotent trước khi checkout hoạt động.
