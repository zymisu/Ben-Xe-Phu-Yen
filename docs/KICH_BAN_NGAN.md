# Kịch bản demo rút gọn - kèm vị trí chụp ảnh màn hình

Bản rút gọn của [KICH_BAN_DEMO.md](KICH_BAN_DEMO.md): mỗi bước chỉ thử **một** trường hợp sai tiêu biểu rồi nhập đúng. Chỗ cần chụp ảnh cho báo cáo ghi dạng **(Chụp ảnh Giao diện <tên use case con> - <nội dung màn hình>)**.

## Chuẩn bị

1. `npm run dev`, mở `http://localhost:3000`. Xóa dữ liệu cũ: F12 → Console → `localStorage.clear(); location.reload()`.
2. Mở thêm một cửa sổ `http://localhost:3000/tram-cong` (trạm cổng), đặt cạnh cửa sổ chính.
3. Mật khẩu mọi tài khoản mẫu: `123456`. Đăng nhập bằng số điện thoại.

| Vai trò | Số điện thoại |
|---|---|
| Quản trị viên | `0257 3824 111` |
| Nhân viên tiếp nhận đăng ký | `0905 778 899` |
| Nhân viên điều độ trong nhà | `0905 441 100` |
| Nhân viên điều độ ngoài trời | `0905 441 200` |
| Nhân viên an ninh trật tự | `0905 441 300` |
| Nhà xe Cúc Tùng | `0905 112 233` |
| Nhà xe Thái Dương | `0938 455 101` |
| Nhà xe mới (đăng ký ở cảnh 1) | `0912 000 111` |

---

## Cảnh 1 - UC1 Đăng ký, UC2 Đăng nhập

(Chụp ảnh Giao diện Đăng ký tài khoản - Trang chủ có nút Đăng ký, Đăng nhập)

**1.1 Số điện thoại:** Trang chủ → **Đăng ký**.
- Sai: `0905 112 233` (đã có) → "Số điện thoại này đã được đăng ký."
- Đúng: `0912 000 111` → **Nhận mã xác thực**.
- (Chụp ảnh Giao diện Đăng ký tài khoản - Nhập số điện thoại, báo lỗi số đã đăng ký)

**1.2 Mã xác thực:** nhập `000000` → "Mã xác thực không đúng." → nhập mã trong tin nhắn hiện ở góc màn hình.
- (Chụp ảnh Giao diện Đăng ký tài khoản - Nhập mã xác thực)

**1.3 Mật khẩu:** hai lần không khớp → báo lỗi; nhập `123456` hai lần.
- (Chụp ảnh Giao diện Đăng ký tài khoản - Tạo mật khẩu)

**1.4 Hồ sơ đơn vị:** điền Công ty TNHH Vận tải Đại Ngàn, MST `4400123456`, địa chỉ, người đại diện, giấy tờ pháp lý, tuyến Phú Yên → Đà Nẵng, tài xế Lê Văn Hùng `0905 600 700`, xe `78B-123.45` (34 chỗ, giấy tờ còn hạn).
- Sai: MST `123` → "Mã số thuế gồm 10 chữ số...".
- Đúng: sửa MST → **Gửi hồ sơ đăng ký**.
- (Chụp ảnh Giao diện Đăng ký tài khoản - Khai hồ sơ đơn vị vận tải)

**1.5 Đăng nhập:** trang đăng nhập đã điền sẵn số và mật khẩu (hệ thống không tự đăng nhập).
- Sai: mật khẩu `saimatkhau` → "Sai mật khẩu."
- Đúng: `123456` → vào **Hồ sơ đơn vị**, trạng thái **Đang tiếp nhận**.
- (Chụp ảnh Giao diện Đăng nhập - Nhập số điện thoại và mật khẩu) (Chụp ảnh Giao diện Đăng nhập - Đăng nhập thành công, hồ sơ ở trạng thái Đang tiếp nhận)

**1.6 Quên mật khẩu:** đăng xuất → **Quên mật khẩu?** → số `0912 000 111` → OTP sai `111111` → "Mã OTP không hợp lệ." → nhập OTP đúng → mật khẩu mới `123456`.
- (Chụp ảnh Giao diện Đăng nhập (Quên mật khẩu) - Nhập mã OTP) (Chụp ảnh Giao diện Đăng nhập (Quên mật khẩu) - Đặt mật khẩu mới)

---

## Cảnh 2 - UC3 Quản lý đơn vị vận tải

Đăng nhập `0905 778 899` → **Hồ sơ nhà xe**.
- (Chụp ảnh Giao diện Quản lý đơn vị vận tải - Danh sách hồ sơ nhà xe)

**2.1 Duyệt hồ sơ Đại Ngàn:** tab **Đang tiếp nhận** → **Đối chiếu**.
- Sai: **Duyệt hồ sơ** khi chưa tích → "Chưa đối chiếu đủ giấy tờ pháp lý của hồ sơ."
- Đúng: tích đủ hai giấy tờ → **Duyệt hồ sơ**.
- (Chụp ảnh Giao diện Quản lý đơn vị vận tải - Đối chiếu và phê duyệt hồ sơ)

**2.2 Từ chối hồ sơ Gành Đá Đĩa:** **Từ chối duyệt** → để trống lý do → báo lỗi → nhập lý do → **Xác nhận từ chối**.
- (Chụp ảnh Giao diện Quản lý đơn vị vận tải - Từ chối duyệt hồ sơ kèm lý do)

**2.3 So sánh cập nhật (Thái Dương):** tab **Đang cập nhật** → **Đối chiếu** → tích đủ giấy tờ → **Duyệt cập nhật**.
- (Chụp ảnh Giao diện Quản lý đơn vị vận tải - So sánh hồ sơ hiện tại và yêu cầu cập nhật)

**2.4 Nhà xe xem kết quả:** đăng nhập `0912 000 111` thấy "Hồ sơ đã được phê duyệt".
- (Chụp ảnh Giao diện Quản lý đơn vị vận tải - Nhà xe nhận thông báo hồ sơ được phê duyệt)

---

## Cảnh 3 - UC4 Quản lý chuyến xe

**3.1 Đăng ký chuyến (Đại Ngàn `0912 000 111`):** **Chuyến xe** → **Đăng ký chuyến xe**.
- Sai: bấm **Gửi yêu cầu** khi trống → "chưa chọn điểm đi và điểm đến."
- Đúng: điểm đi Tuy Hòa, điểm đến Đà Nẵng, ngày hôm nay + 12, giờ 07:00, xe `78B-123.45`, tài xế Lê Văn Hùng.
- (Chụp ảnh Giao diện Đăng ký chuyến xe - Nhập điểm đi, điểm đến, xe, tài xế, giờ xuất bến) (Chụp ảnh Giao diện Đăng ký chuyến xe - Chuyến ở trạng thái Chờ tiếp nhận)

**3.2 Quy tắc 7 ngày (Cúc Tùng `0905 112 233`):** tab **Đã duyệt** → chuyến đầu danh sách → **Yêu cầu cập nhật** → "Chỉ được yêu cầu cập nhật trước ngày khởi hành tối thiểu 7 ngày."
- Đúng: bấm **Sau** tới chuyến ngày từ hôm nay + 9 → **Yêu cầu cập nhật** → đổi giờ → gửi.
- (Chụp ảnh Giao diện Đăng ký chuyến xe (Cập nhật) - Yêu cầu cập nhật chuyến đã duyệt)

**3.3 Tiếp nhận (`0905 778 899`):** **Tiếp nhận chuyến xe** → tra `Đại Ngàn` → **Duyệt** → **Duyệt chuyến xe**.
- (Chụp ảnh Giao diện Tiếp nhận chuyến xe - Danh sách chuyến chờ tiếp nhận) (Chụp ảnh Giao diện Tiếp nhận chuyến xe - Duyệt chuyến xe)

---

## Cảnh 4 - UC5 Sắp xếp xe đón khách

**4.1 Tạm ngưng ô (điều độ ngoài trời `0905 441 200`):** **Vị trí đón khách** → **Cập nhật vị trí**.
- Sai: **Lưu cập nhật** khi chưa chọn ô → "Chưa chọn vị trí nào."
- Đúng: chọn nhiều ô đang có chuyến sắp đón khách, loại **Tạm ngưng**, đến +3 giờ, có lý do → **Lưu cập nhật**.
- (Chụp ảnh Giao diện Cập nhật vị trí đón khách - Chọn nhiều ô, loại Tạm ngưng)

**4.2 Xếp lại (điều độ trong nhà `0905 441 100`):** **Đón khách** → tab **Cần xếp lại** → **Xử lý**.
- Sai: chọn lại ô đang tạm ngưng → "Cảnh báo quá tải..."
- Đúng: chọn ô **Trống** → **Lưu giờ đón khách**.
- (Chụp ảnh Giao diện Sắp xếp xe đón khách - Cảnh báo quá tải, Use Case dừng) (Chụp ảnh Giao diện Sắp xếp xe đón khách - Chọn giờ và vị trí đón khách)

**4.3 Nhà xe xin điều chỉnh giờ (`0905 112 233`):** mở chuyến hôm nay có ô → **Yêu cầu điều chỉnh giờ đón** → giờ muộn hơn 30 phút → **Gửi yêu cầu**.
- (Chụp ảnh Giao diện Yêu cầu điều chỉnh giờ đón khách - Nhà xe chọn giờ mong muốn)

---

## Cảnh 5 - UC6 Kiểm soát xe vào bến

**5.1 Quẹt thẻ (cửa sổ `/tram-cong`):** **Vào bến**, **Cổng 1**.
- Sai: **Thẻ chưa đăng ký** → "Thẻ không hợp lệ."
- Đúng: quẹt thẻ tài xế có chuyến → "Đang chờ nhân viên xác nhận".
- (Chụp ảnh Giao diện Xác nhận xe vào bến - Trạm cổng báo thẻ không hợp lệ) (Chụp ảnh Giao diện Xác nhận xe vào bến - Trạm cổng chờ nhân viên xác nhận)

**5.2 Phê duyệt (`0905 441 200`):** **Xe vào bến** → tab **Chờ xác nhận**.
- Sai: **Từ chối** → xác nhận khi chưa nhập lý do → "Nhập lý do."
- Đúng: yêu cầu đạt 5/5 → **Phê duyệt cho vào** → trạm cổng hiện "Cổng mở".
- (Chụp ảnh Giao diện Xác nhận xe vào bến - Nhân viên duyệt với kết quả đối chiếu) (Chụp ảnh Giao diện Xác nhận xe vào bến - Trạm cổng mở cổng)

**5.3 Lập biên bản (ANTT `0905 441 300`):** **Biên bản vi phạm** → **Lập biên bản vi phạm**.
- Sai: bấm **Lập biên bản** khi trống → "chưa chọn nhà xe."
- Đúng: chọn nhà xe Cúc Tùng, biển số, lỗi **Đi sai cổng**, vị trí **Cổng 2**, nhập mô tả → **Lập biên bản**.
- (Chụp ảnh Giao diện Lập biên bản vi phạm - Nhập thông tin vi phạm) (Chụp ảnh Giao diện Lập biên bản vi phạm - Danh sách biên bản vừa lập)

---

## Cảnh 6 - UC7 Điều phối xe tại bến (nhà xe `0905 112 233`)

**6.1 Ghi nhận xe vào/ra bãi:** **Vào/ra bãi** → **Ghi nhận xe vào/ra**.
- Sai: không chọn xe → "chưa chọn xe."
- Đúng: **Vào bãi**, chọn xe, tài xế, giờ hiện tại → **Ghi nhận**; rồi ghi nhận **Ra bãi** cho xe đó với tài xế khác.
- (Chụp ảnh Giao diện Ghi nhận xe vào/ra bãi - Chọn loại, xe, tài xế, giờ) (Chụp ảnh Giao diện Ghi nhận xe vào/ra bãi - Sổ xe vào/ra bãi)

**6.2 Lập báo cáo:** **Báo cáo** → **Lập báo cáo**.
- Sai: **Gửi báo cáo** khi chưa chọn người nhận → "chưa chọn người nhận."
- Đúng: chọn Hoàng Gia Bảo và Lâm Thị Bích Ngọc, tiêu đề "Cổng 1 đông xe buổi sáng", nội dung bất kỳ → **Gửi báo cáo**.
- (Chụp ảnh Giao diện Lập báo cáo nhà xe - Chọn người nhận, nhập nội dung)

**6.3 Người nhận đọc:** đăng nhập `0905 441 100` → **Thông báo** có số chưa đọc → **Báo cáo nhà xe** → **Đọc**.
- (Chụp ảnh Giao diện Lập báo cáo nhà xe - Người nhận đọc báo cáo (Chưa đọc, Đã đọc))

---

## Cảnh 7 - UC8 Quản lý xe rời bến

**7.1 Kiểm tra xe (ANTT `0905 441 300`):** **Kiểm tra xuất bến** → tab **Chờ kiểm tra** → **Kiểm tra**.
- Sai: **Yêu cầu phê duyệt** ngay → "chưa đánh giá ..."
- Đúng: 12 khách, 120 kg, mọi hạng mục **Đạt** → **Yêu cầu phê duyệt** → chuyến sang **Đã cấp lệnh** kèm số `LXB-xxxx`.
- (Chụp ảnh Giao diện Kiểm tra xe xuất bến - Điền phiếu kiểm tra) (Chụp ảnh Giao diện Kiểm tra xe xuất bến - Cấp lệnh xuất bến thành công)

**7.2 Không đạt:** chuyến khác, đánh **Không đạt** một hạng mục kèm lý do → lưu → chuyến sang tab **Không đạt**.
- (Chụp ảnh Giao diện Kiểm tra xe xuất bến - Kết quả Không đạt)

**7.3 Xe ra bến (cửa sổ `/tram-cong`):** **Ra bến**, quẹt thẻ tài xế của chuyến **đã có lệnh** → "Đang chờ nhân viên xác nhận".
- (Chụp ảnh Giao diện Điều phối xe xuất bến - Trạm cổng chờ xác nhận xe ra)

**7.4 Phê duyệt cho ra (`0905 441 200`):** **Xe ra bến** → **Chờ xác nhận** → **Phê duyệt cho ra** → trạm cổng hiện "Cổng mở, chúc xe thượng lộ bình an".
- (Chụp ảnh Giao diện Điều phối xe xuất bến - Nhân viên duyệt xe ra bến) (Chụp ảnh Giao diện Điều phối xe xuất bến - Trạm cổng mở cổng cho xe ra)

---

## Cảnh 8 - UC9 Thông tin cá nhân

Đăng nhập `0905 778 899` → **Thông tin cá nhân**.
- (Chụp ảnh Giao diện Quản lý thông tin cá nhân - Thông tin tài khoản)

**8.1 Chỉnh sửa:** **Chỉnh sửa** → email `abc` → "thư điện tử sai định dạng" → nhập email hợp lệ → **Lưu thay đổi**.
- (Chụp ảnh Giao diện Chỉnh sửa thông tin cá nhân - Nhập thư điện tử, địa chỉ)

**8.2 Đổi mật khẩu:** mật khẩu hiện tại `saimatkhau` → "Mật khẩu hiện tại không đúng." → hiện tại `123456`, mới `654321` hai lần → **Đổi mật khẩu** (vẫn giữ đăng nhập). Đổi lại `123456`.
- (Chụp ảnh Giao diện Đổi mật khẩu - Nhập mật khẩu hiện tại và mật khẩu mới)

---

## Cảnh 9 - UC10 Quản lý tài khoản (`0257 3824 111`)

**9.1 Tạo:** **Quản lý tài khoản** → **Tạo tài khoản** → số `0905 441 100` (đã dùng) → báo lỗi → `Nguyễn Văn Đạt`, `0905 441 500`, vai trò điều độ trong nhà, mật khẩu `123456` → **Tạo tài khoản**.
- (Chụp ảnh Giao diện Tạo tài khoản - Nhập thông tin tài khoản) (Chụp ảnh Giao diện Tạo tài khoản - Danh sách tài khoản có tài khoản mới)

**9.2 Cập nhật:** tra `Nguyễn Văn Đạt` → **Cập nhật** → đổi vai trò sang điều độ ngoài trời → **Lưu cập nhật**.
- (Chụp ảnh Giao diện Cập nhật tài khoản - Đổi vai trò)

**9.3 Xóa:** tra `Lan Anh` → **Xóa** → "Không thể xóa tài khoản" kèm danh sách liên kết; tra `Phạm Thị Mai` → **Xóa** → **Xác nhận xóa**.
- (Chụp ảnh Giao diện Xóa tài khoản - Từ chối xóa vì còn liên kết) (Chụp ảnh Giao diện Xóa tài khoản - Xác nhận xóa)

---

## Cảnh 10 - UC11 Báo cáo, thống kê (`0257 3824 111`)

**10.1 Lập báo cáo:** **Báo cáo, thống kê** → **Lập báo cáo, thống kê** → chọn **Chuyến xe theo tuyến** → **Lập báo cáo**. Làm thêm một loại khác (ví dụ **Vi phạm tại bãi**).
- (Chụp ảnh Giao diện Lập báo cáo, thống kê - Chọn loại báo cáo) (Chụp ảnh Giao diện Lập báo cáo, thống kê - Báo cáo có chỉ số, biểu đồ và bảng)

**10.2 Gửi báo cáo:** **Gửi báo cáo** → bấm gửi khi chưa chọn ai → "chưa chọn người nhận báo cáo" → chọn Nguyễn Thị Lan Anh và Hoàng Gia Bảo → **Gửi báo cáo**.
- (Chụp ảnh Giao diện Lập báo cáo, thống kê - Chọn người nhận báo cáo) (Chụp ảnh Giao diện Lập báo cáo, thống kê - Gửi báo cáo thành công)

**10.3 Người nhận đọc:** đăng nhập `0905 778 899` → **Thông báo** → **Đọc** báo cáo vừa nhận.
- (Chụp ảnh Giao diện Lập báo cáo, thống kê - Người nhận xem báo cáo trong Thông báo)

**10.4 Xuất báo cáo:** **Xuất báo cáo** → "đến trang" `99` → "Số trang phải nằm trong khoảng từ 1 đến N." → sửa lại, chọn **A5**, **Ngang** → **Tiếp tục** → **Excel** → **Tiếp tục** → **Xác nhận xuất báo cáo**.
- (Chụp ảnh Giao diện Xuất báo cáo - Xem trước, chọn trang và kích thước) (Chụp ảnh Giao diện Xuất báo cáo - Chọn định dạng) (Chụp ảnh Giao diện Xuất báo cáo - Xuất báo cáo thành công) (Chụp ảnh Giao diện Xuất báo cáo - Tệp Excel có biểu đồ và bảng)
