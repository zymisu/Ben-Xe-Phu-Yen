# Bến xe Liên tỉnh Phú Yên

Hệ thống quản lý tiếp nhận đăng ký và điều phối lịch trình xe xuất bến cho **Bến xe Liên tỉnh Phú Yên**, đơn vị hành chính sự nghiệp trực thuộc Sở Giao thông vận tải tỉnh Phú Yên.

Dữ liệu hiển thị là dữ liệu mẫu, không phải số liệu thật của bến xe.

## Công nghệ

Next.js (App Router), React, TypeScript, Tailwind CSS, Chart.js (biểu đồ), ExcelJS (xuất Excel). Dữ liệu lưu trong `localStorage` của trình duyệt, không có máy chủ và cơ sở dữ liệu.

## Chạy tại máy

```bash
npm install
npm run dev      # http://localhost:3000
```

Các lệnh khác: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Các trang và use case

| Trang | Use case |
|---|---|
| `/` | Trang chủ công khai: tra cứu lịch xe xuất bến, tuyến, dịch vụ, thông báo điều hành, giới thiệu, liên hệ |
| `/dang-ky` | UC1 - Nhà xe đăng ký tài khoản bằng số điện thoại, kèm hồ sơ đơn vị |
| `/dang-nhap`, `/quen-mat-khau` | UC2 - Đăng nhập, lấy lại mật khẩu bằng OTP |
| `/nghiep-vu/ho-so-nha-xe` | UC3 - Nhân viên tiếp nhận đối chiếu giấy tờ, phê duyệt hồ sơ nhà xe |
| `/nghiep-vu/ho-so-don-vi` | UC3 - Nhà xe theo dõi hồ sơ, gửi yêu cầu cập nhật |
| `/nghiep-vu/chuyen-xe` | UC4 - Nhà xe đăng ký, cập nhật, xóa chuyến xe |
| `/nghiep-vu/tiep-nhan-chuyen` | UC4 - Nhân viên tiếp nhận duyệt hoặc từ chối chuyến |
| `/nghiep-vu/don-khach` | UC5 - Nhân viên điều độ trong nhà chọn giờ, vị trí đón khách |
| `/nghiep-vu/vi-tri-don-khach` | UC5 - Nhân viên điều độ ngoài trời cập nhật vị trí (tạm ngưng, lệch giờ, thêm, xóa ô) |
| `/tram-cong` | UC6, UC8.2 - Trạm cổng: tài xế quẹt thẻ NFC vào hoặc ra bến |
| `/nghiep-vu/xe-vao-ben` | UC6 - Nhân viên điều độ ngoài trời duyệt xe vào bến |
| `/nghiep-vu/bien-ban` | UC6 - Nhân viên an ninh trật tự lập biên bản vi phạm |
| `/nghiep-vu/vao-ra-bai` | UC7.1 - Nhà xe ghi nhận xe vào/ra bãi |
| `/nghiep-vu/bao-cao` | UC7.2 - Nhà xe lập báo cáo gửi nhân viên điều độ trong nhà |
| `/nghiep-vu/bao-cao-nha-xe` | UC7.2 - Nhân viên điều độ trong nhà đọc báo cáo của nhà xe |
| `/nghiep-vu/kiem-tra-xuat-ben` | UC8.1 - Nhân viên an ninh trật tự kiểm tra xe, cấp lệnh xuất bến |
| `/nghiep-vu/xe-ra-ben` | UC8.2 - Nhân viên điều độ ngoài trời duyệt xe ra bến |
| `/nghiep-vu/thong-tin-ca-nhan` | UC9 - Chỉnh sửa thông tin liên hệ, đổi mật khẩu |
| `/nghiep-vu/tai-khoan` | UC10 - Quản trị viên tạo, cập nhật, xóa tài khoản nhân viên |
| `/nghiep-vu/bao-cao-thong-ke` | UC11 - Quản trị viên lập báo cáo, thống kê (bảng và biểu đồ), gửi qua Thông báo, xuất PDF, Excel, CSV |
| `/nghiep-vu/thong-bao` | Thông báo gửi tới tài khoản đang đăng nhập |

Sau khi đăng nhập, người dùng vào cổng nghiệp vụ `/nghiep-vu` có thanh bên theo vai trò.

## Kịch bản demo

- [docs/KICH_BAN_DEMO.md](docs/KICH_BAN_DEMO.md): kịch bản đầy đủ, mỗi bước thử các trường hợp sai rồi mới nhập đúng.
- [docs/KICH_BAN_NGAN.md](docs/KICH_BAN_NGAN.md): kịch bản rút gọn, có ghi chú vị trí chụp ảnh màn hình.

## Dữ liệu mẫu

Dữ liệu mẫu (`src/lib/seed/`) được sinh khi mở trang lần đầu, tính theo thời điểm đó: có chuyến đã xuất bến, chuyến chờ kiểm tra, chuyến sắp tới và các yêu cầu đang chờ xử lý. Xóa `localStorage` để nạp lại theo giờ mới.

Mật khẩu của mọi tài khoản mẫu là `123456`; đăng nhập bằng số điện thoại.

| Số điện thoại | Vai trò | Họ tên |
|---|---|---|
| `0257 3824 111` | Quản trị viên | Nguyễn Thị Hải Sâm |
| `0905 778 899` | Nhân viên tiếp nhận đăng ký | Nguyễn Thị Lan Anh |
| `0905 334 556` | Nhân viên tiếp nhận đăng ký | Lê Minh Trí |
| `0905 441 400` | Nhân viên tiếp nhận đăng ký (chưa xử lý hạng mục nào, xóa được) | Phạm Thị Mai |
| `0905 441 100` / `101` / `102` | Nhân viên điều độ trong nhà | Hoàng Gia Bảo, Lâm Thị Bích Ngọc, Đoàn Văn Phước |
| `0905 441 200` / `201` / `202` | Nhân viên điều độ ngoài trời | Trương Quốc Dũng, Mai Văn Tâm, Cao Thanh Phong |
| `0905 441 300` / `301` / `302` | Nhân viên an ninh trật tự | Vũ Hoàng Long, Tạ Minh Khôi, Châu Quốc Huy |

Mười nhà xe (số điện thoại là của người đại diện):

| Số điện thoại | Nhà xe | Hồ sơ |
|---|---|---|
| `0905 112 233` | Công ty TNHH Vận tải Cúc Tùng | Đang hoạt động (12 xe) |
| `0938 455 101` | Công ty CP Xe khách Thái Dương | Đang cập nhật (xin thêm 1 xe) |
| `0903 551 220` | HTX Vận tải Bình Minh Xanh | Đang hoạt động |
| `0987 700 400` | Công ty TNHH Vận tải Biển Xanh | Đang hoạt động |
| `0908 245 316` | Công ty TNHH Vận tải Sông Cầu | Đang hoạt động |
| `0912 330 458` | Công ty CP Xe khách Tháp Nhạn | Đang hoạt động |
| `0918 662 097` | Công ty TNHH Du lịch và Vận tải Xuân Đài | Đang hoạt động, một yêu cầu cập nhật bị từ chối |
| `0914 220 077` | HTX Vận tải Hồng Sơn Phú Yên | Đang tiếp nhận |
| `0935 771 204` | HTX Vận tải Gành Đá Đĩa | Đang tiếp nhận |
| `0987 600 412` | Công ty TNHH An Phú Quý | Đã từ chối |

## Cấu trúc mã nguồn

```
src/
  types.ts                  mô hình dữ liệu dùng chung
  app/                      định tuyến Next.js
  components/               giao diện dùng chung (ui, Icon, Pager, FilterBar, ...)
  lib/
    store.tsx               kho dữ liệu, phiên đăng nhập, lưu localStorage
    seed/                   dữ liệu mẫu
    review.ts               vòng đời nộp - duyệt của hồ sơ và chuyến xe
    format.ts, rules.ts     định dạng ngày giờ, kiểm tra số điện thoại, biển số
  features/
    home/                   trang chủ
    uc01-register/ ... uc11-statistics/   mỗi use case một thư mục
    notifications/
```

Mỗi thư mục use case có `logic.ts` (quy tắc và hook), các file `.tsx` dựng giao diện, và `rules.ts` nếu quy tắc dùng chung cho nhiều màn hình. Quy tắc là hàm thuần, không dùng React; hook nối quy tắc với kho dữ liệu. Mọi thao tác ghi dữ liệu đi qua `update()` của kho.

Tên thư mục và định danh trong mã dùng tiếng Anh; chuỗi hiển thị và đường dẫn trong `src/app` dùng tiếng Việt.

## Quy tắc nghiệp vụ chính

| Quy tắc | Nằm ở |
|---|---|
| Cổng 1 là cổng vào, Cổng 2 là cổng ra. Xe ra bến phải có lệnh xuất bến và tài xế quẹt thẻ phải là tài xế ghi trong chuyến | `uc06-gate/rules.ts` |
| Mã thẻ NFC của tài xế là `NFC-` cộng mã tài xế | `uc06-gate/rules.ts` |
| Mỗi xe có cửa sổ đón khách 15 phút. Quá tải khi ô tạm ngưng, ô đã có xe khác, hoặc hơn 90% ô đang bận | `uc05-boarding/rules.ts` |
| Chuyến đã duyệt chỉ được xin cập nhật trước ngày khởi hành tối thiểu 7 ngày | `uc04-trips/trip.ts` |
| "Đã quá hạn" không lưu, tính từ giờ xuất bến so với giờ hiện tại | `uc04-trips/trip.ts` |
| Hồ sơ và chuyến dùng chung bốn trạng thái: đang tiếp nhận, đang hoạt động, đang cập nhật, đã từ chối | `lib/review.ts` |
| Chuyến vào danh sách kiểm tra xuất bến khi xe đã vào bến và giờ xuất bến còn trong 30 phút. Hàng và hành lý tối đa 20 kg mỗi ghế | `uc08-departure/rules.ts` |
| Tài khoản nhân viên còn hạng mục đã xử lý thì không xóa được; họ tên nhân viên phải duy nhất | `uc10-accounts/rules.ts` |
| Đổi cấu trúc dữ liệu thì tăng số phiên bản khóa `localStorage` | `lib/store.tsx` |

## Triển khai

Triển khai lên Vercel không cần cấu hình hay biến môi trường.

---

**Bến xe Liên tỉnh Phú Yên** · 227 Nguyễn Tất Thành, phường 8, TP. Tuy Hòa, tỉnh Phú Yên · MST 4400219227 · Cơ quan chủ quản: Sở Giao thông vận tải tỉnh Phú Yên
