# Kịch bản demo - phủ đủ 11 use case

Kịch bản đi theo nghiệp vụ thực tế của bến: nhà xe đăng ký → bến duyệt → nhà xe đăng ký chuyến → điều độ sắp xếp đón khách → xe vào bến → nhà xe tự ghi nhận trong bãi → kiểm tra và cấp lệnh → xe ra bến → quản trị theo dõi và báo cáo.

## Cách trình bày: từng bước, sai trước đúng sau

Mỗi cảnh chia thành **các bước nhỏ**. Ở mỗi bước làm đúng thứ tự:
1. **Thử sai** lần lượt từng trường hợp (mỗi lần hệ thống báo một lỗi, người xem thấy hệ thống kiểm tra thật).
2. **Nhập đúng** ở lần cuối cùng để **qua bước**.

Chỉ sang bước kế tiếp sau khi bước hiện tại đã pass. Giao diện không có chú thích demo nên mọi hướng dẫn nằm ở file này.

## 0. Chuẩn bị

1. Chạy `npm run dev`, mở `http://localhost:3000`.
2. Nạp dữ liệu mẫu mới theo giờ hiện tại: F12 → Console → `localStorage.clear(); location.reload()`.
3. Mở **hai cửa sổ trình duyệt** cạnh nhau: cửa sổ A là máy nhân viên hoặc nhà xe, cửa sổ B luôn mở `http://localhost:3000/tram-cong` (trạm cổng). Dữ liệu đồng bộ giữa hai cửa sổ.
4. Mật khẩu của **mọi tài khoản mẫu là `123456`**. Đăng nhập bằng số điện thoại.
5. Mã xác thực và OTP hiện như tin nhắn nổi ở góc màn hình.

### Tài khoản dùng trong kịch bản

| Vai trò | Họ tên | Số điện thoại |
|---|---|---|
| Quản trị viên | Nguyễn Thị Hải Sâm | `0257 3824 111` |
| Nhân viên tiếp nhận đăng ký | Nguyễn Thị Lan Anh | `0905 778 899` |
| Nhân viên điều độ trong nhà | Hoàng Gia Bảo | `0905 441 100` |
| Nhân viên điều độ trong nhà | Lâm Thị Bích Ngọc | `0905 441 101` |
| Nhân viên điều độ trong nhà | Đoàn Văn Phước | `0905 441 102` |
| Nhân viên điều độ ngoài trời | Trương Quốc Dũng | `0905 441 200` |
| Nhân viên an ninh trật tự | Vũ Hoàng Long | `0905 441 300` |
| Nhà xe Cúc Tùng (đang hoạt động, 12 xe) | Trần Quốc Cường | `0905 112 233` |
| Nhà xe Thái Dương (đang cập nhật hồ sơ) | Võ Thanh Hải | `0938 455 101` |
| Nhà xe Xuân Đài (từng bị từ chối cập nhật) | Lại Văn Hiếu | `0918 662 097` |
| Nhà xe Gành Đá Đĩa (đang tiếp nhận) | Tô Thị Mỹ Linh | `0935 771 204` |
| Nhà xe Biển Xanh (đang hoạt động) | Lương Quốc Việt | `0987 700 400` |
| Nhà xe mới sẽ tự đăng ký ở cảnh 1 | (tự nhập) | `0912 000 111` |

---

## Cảnh 1 - UC1 Đăng ký, UC2 Đăng nhập (khách chưa có tài khoản)

Trang chủ → nút **Đăng ký**.

**Bước 1.1 - Số điện thoại**
- Sai: nhập `123` → "Số điện thoại không hợp lệ."
- Sai: nhập `0905 112 233` (đã có) → "Số điện thoại này đã được đăng ký."
- **Đúng:** `0912 000 111` → **Nhận mã xác thực**, mã hiện như tin nhắn.

**Bước 1.2 - Mã xác thực**
- Sai: nhập `000000` → "Mã xác thực không đúng." Bấm **Gửi lại mã** (hiện mã mới).
- **Đúng:** nhập mã trong tin nhắn → **Xác nhận**.

**Bước 1.3 - Mật khẩu**
- Sai: `123` hai lần → "Mật khẩu phải có ít nhất 6 ký tự."
- Sai: `123456` và `654321` → "Hai lần nhập mật khẩu không khớp nhau."
- **Đúng:** `123456` hai lần → **Tiếp tục**.

**Bước 1.4 - Hồ sơ đơn vị**

| Mục | Giá trị đúng |
|---|---|
| Tên đơn vị | Công ty TNHH Vận tải Đại Ngàn |
| Mã số thuế | `4400123456` |
| Địa chỉ | 25 Lê Hồng Phong, phường 4, TP. Tuy Hòa, tỉnh Phú Yên |
| Người đại diện / Chức vụ | Nguyễn Văn Đại / Giám đốc |
| GCN đăng ký doanh nghiệp | số `4400123456`, ngày cấp quá khứ |
| GPKD vận tải | số `125/GPKDVT-SGTVT`, ngày cấp quá khứ, nơi cấp mặc định |
| Tuyến đề nghị | nơi đi Phú Yên, nơi đến Đà Nẵng |
| Tài xế | Lê Văn Hùng - `0905 600 700` |
| Xe | `78B-123.45`, 34 chỗ, đăng ký `ĐK-12345`, kiểm định `KD-12345` hạn 31/12/2027, bảo hiểm `BH-12345` hạn 31/12/2027 |

- Sai: bấm **Gửi hồ sơ đăng ký** khi để trống → trình duyệt nhắc điền ô bắt buộc.
- Sai: MST `123` → "Mã số thuế gồm 10 chữ số, đơn vị trực thuộc thêm 3 chữ số."
- Sai: biển số `ABC` → "Xe 1: biển số sai định dạng, ví dụ 78B-012.34."
- Sai: hạn kiểm định là ngày đã qua → "Xe 1: Giấy chứng nhận kiểm định đã hết hạn."
- **Đúng:** sửa lại đủ giá trị trong bảng → **Gửi hồ sơ đăng ký**. Hệ thống **không tự đăng nhập**, chuyển sang trang đăng nhập đã điền sẵn số điện thoại và mật khẩu.

**Bước 1.5 - Đăng nhập (UC2)**
- Sai: số `0900 000 000` → "Số điện thoại chưa được đăng ký."
- Sai: số `0912 000 111` + mật khẩu `saimatkhau` → "Sai mật khẩu."
- **Đúng:** `0912 000 111` / `123456` → vào **Hồ sơ đơn vị**, trạng thái **Đang tiếp nhận**.

**Bước 1.6 - Quên mật khẩu** (đăng xuất → trang đăng nhập → **Quên mật khẩu?**)
- Sai: nhập `abc` → "Email hoặc số điện thoại không hợp lệ."
- Đúng bước 1: `0912 000 111` → **Gửi mã OTP**.
- Sai: OTP `111111` → "Mã OTP không hợp lệ."
- Đúng bước 2: OTP đúng → **Xác nhận**.
- Sai: mật khẩu mới `123`, hoặc hai lần không khớp → báo lỗi.
- **Đúng:** `123456` hai lần → **Cập nhật mật khẩu**, quay về trang đăng nhập.

---

## Cảnh 2 - UC3 Quản lý đơn vị vận tải

**Nhân viên tiếp nhận `0905 778 899`** → **Hồ sơ nhà xe**. Bộ lọc: Tất cả, Đang tiếp nhận, Đang hoạt động, Đang cập nhật, Đã từ chối.

**Bước 2.1 - Duyệt hồ sơ mới (Đại Ngàn)**: tab **Đang tiếp nhận** → **Đối chiếu**.
- Sai: bấm **Duyệt hồ sơ** khi chưa tích → "Chưa đối chiếu đủ giấy tờ pháp lý của hồ sơ."
- Sai: chỉ tích một giấy tờ rồi duyệt → cùng lỗi.
- **Đúng:** tích đủ hai giấy tờ → **Duyệt hồ sơ**. Cột **Nhân viên phê duyệt** ghi Lan Anh.

**Bước 2.2 - Từ chối hồ sơ (Gành Đá Đĩa)**: **Đối chiếu** → **Từ chối duyệt**.
- Sai: **Xác nhận từ chối** khi chưa nhập lý do → "Nhập lý do từ chối để nhà xe biết cần bổ sung gì."
- **Đúng:** lý do "Thiếu bản sao Giấy phép kinh doanh vận tải" → **Xác nhận từ chối**. Hồ sơ sang **Đã từ chối**.

**Bước 2.3 - Duyệt cập nhật có so sánh (Thái Dương)**: tab **Đang cập nhật** → **Đối chiếu**.
- Xem hai cột **Hồ sơ hiện tại / Yêu cầu cập nhật**, mục thay đổi được tô nổi.
- Sai: bấm **Duyệt cập nhật** khi chưa tích giấy tờ → "Chưa đối chiếu đủ giấy tờ pháp lý của hồ sơ."
- Sai: **Từ chối duyệt** rồi xác nhận khi chưa nhập lý do → báo thiếu lý do.
- **Đúng:** tích đủ hai giấy tờ → **Duyệt cập nhật**. Hồ sơ về **Đang hoạt động**.

**Bước 2.4 - Phía nhà xe thấy kết quả** (mỗi tài khoản đăng nhập một lần)
- `0912 000 111` (Đại Ngàn): "Hồ sơ đã được phê duyệt" hiện **một lần**, tải lại thì mất.
- `0935 771 204` (Gành Đá Đĩa): khung đỏ "Hồ sơ bị từ chối" kèm lý do, nút **Chỉnh sửa và nộp lại**.
- `0918 662 097` (Xuân Đài): vẫn **Đang hoạt động**, có khung đỏ "Yêu cầu cập nhật bị từ chối".

**Bước 2.5 - Nhà xe xin cập nhật hồ sơ (Cúc Tùng `0905 112 233`)**: **Yêu cầu cập nhật hồ sơ**.
- Sai: thử **Xóa** một xe đang có chuyến → nút bị khóa kèm nhãn "Đang dùng cho N chuyến".
- Sai: xóa trắng tên tài xế rồi **Gửi tới bến xe** → báo lỗi tài xế chưa nhập họ tên.
- **Đúng:** đổi Chức vụ thành "Tổng giám đốc" → **Gửi tới bến xe** → hồ sơ **Đang cập nhật**.

---

## Cảnh 3 - UC4 Quản lý chuyến xe

**Bước 3.1 - Đăng ký chuyến (Đại Ngàn `0912 000 111`)**: **Chuyến xe** → **Đăng ký chuyến xe**.
- Sai: **Gửi yêu cầu** khi trống → "Thông tin không hợp lệ: chưa chọn điểm đi và điểm đến."
- Sai: chọn điểm đi Tuy Hòa và điểm đến → lỗi chưa chọn xe; chọn xe → lỗi chưa chọn tài xế.
- Sai: chọn ngày hôm qua → báo thời gian xuất bến phải sau thời điểm hiện tại.
- **Đúng:** điểm đi Tuy Hòa, điểm đến Đà Nẵng, ngày hôm nay + 12, giờ 07:00, xe `78B-123.45`, tài xế Lê Văn Hùng → chuyến **Chờ tiếp nhận**.

**Bước 3.2 - Xóa chuyến chờ tiếp nhận**: **Xem chi tiết** → **Xóa chuyến**.
- Sai: bấm **Không xóa** (chuyến vẫn còn).
- **Đúng:** **Xác nhận xóa**. Rồi tạo lại một chuyến như 3.1 để dùng ở bước 3.5.

**Bước 3.3 - Giấy tờ xe (Cúc Tùng `0905 112 233`)**: **Đăng ký chuyến xe**.
- Sai: xe `78B-569.45` (kiểm định hết hạn 15/11/2026), ngày hôm nay + 30 → "Giấy chứng nhận kiểm định của xe ... hết hạn ngày 15/11/2026, trước ngày xuất bến."
- **Đúng:** đổi sang xe `78B-579.07`, tài xế bất kỳ → gửi, chuyến **Chờ tiếp nhận**.

**Bước 3.4 - Quy tắc 7 ngày (Cúc Tùng)**: tab **Đã duyệt** (chuyến sắp tới nhất lên đầu).
- Sai: **Xem chi tiết** chuyến đầu danh sách → **Yêu cầu cập nhật** → "Chỉ được yêu cầu cập nhật trước ngày khởi hành tối thiểu 7 ngày."
- Sai: tab **Đã quá hạn** → mở một chuyến: chỉ xem, không có nút Xóa hay Cập nhật.
- **Đúng:** quay lại tab Đã duyệt, bấm **Sau** tới khi thấy chuyến ngày từ hôm nay + 9 → **Xem chi tiết** → **Yêu cầu cập nhật** → đổi giờ → gửi, chuyến **Đang cập nhật**.

**Bước 3.5 - Nhân viên tiếp nhận xử lý (`0905 778 899`)**: **Tiếp nhận chuyến xe**, tab **Chờ tiếp nhận**.
- Sai: mở một chuyến → **Từ chối duyệt** → xác nhận khi chưa nhập lý do → báo thiếu lý do.
- Xem so sánh: tab **Đang cập nhật** → chuyến Cúc Tùng → hai cột cũ/mới.
- **Đúng:** gõ `Đại Ngàn` vào ô tra cứu → **Duyệt** → **Duyệt chuyến xe**. Rồi **Duyệt cập nhật** chuyến Cúc Tùng.

Trang chủ (không đăng nhập): **Lịch xe xuất bến** chỉ hiện chuyến đã duyệt và chưa quá giờ, có lọc và phân trang.

---

## Cảnh 4 - UC5 Sắp xếp xe đón khách

**Bước 4.1 - Cập nhật tình trạng ô (điều độ ngoài trời `0905 441 200`)**: **Vị trí đón khách** → **Cập nhật vị trí**.
- Sai: **Lưu cập nhật** khi chưa chọn ô → "Chưa chọn vị trí nào."
- Sai: chọn ô, loại **Lệch giờ**, số phút `0` → "Số phút lệch phải từ 1 đến 120."
- Sai: chọn ô, để trống lý do → "Nhập lý do cập nhật."
- **Đúng:** chọn **nhiều ô cùng lúc** đang có chuyến sắp đón khách, loại **Tạm ngưng**, đến lúc +3 giờ, lý do "Xe hư chưa di dời" → **Lưu cập nhật**. (Dữ liệu mẫu luôn có chuyến sắp tới trong 1 đến 3 giờ.)

**Bước 4.2 - Thêm, xóa ô**
- Sai: **Thêm ô** → đổi mã thành `Ô 01` → "Mã ô Ô 01 đã tồn tại."
- Sai: thử xóa ô đang có chuyến → nút bị khóa.
- **Đúng:** mã gợi ý `Ô 13` → **Thêm ô**; rồi **Xóa** `Ô 13` → **Xác nhận xóa**.

**Bước 4.3 - Xếp lại ô tạm ngưng (điều độ trong nhà `0905 441 100`)**: **Đón khách** → tab **Cần xếp lại** → **Xử lý**.
- Sai: chọn lại **chính ô đang Tạm ngưng** → **Lưu giờ đón khách** → "Cảnh báo quá tải: ... đang tạm ngưng."
- **Đúng:** chọn ô còn **Trống** → **Lưu giờ đón khách**.

**Bước 4.4 - Phân công chuyến mới**: tab **Chờ phân công** → **Phân công**.
- Sai: giờ đón 23:59 → "Giờ bắt đầu đón khách không được sau giờ khởi hành trên vé."
- **Đúng:** giờ gợi ý (15 phút trước giờ vé), ô Trống → **Sắp xếp đón khách**.

**Bước 4.5 - Nhà xe xin điều chỉnh giờ đón (Cúc Tùng `0905 112 233`)**: **Chuyến xe** → mở chuyến hôm nay có ô đón khách → **Yêu cầu điều chỉnh giờ đón**.
- Sai: đúng giờ đã gán → "Giờ mong muốn trùng với giờ đón khách đã được sắp xếp."
- Sai: giờ đã qua → "Giờ mong muốn phải từ thời điểm hiện tại trở đi."
- **Đúng:** muộn hơn 30 phút + ghi chú → **Gửi yêu cầu**. Giờ trên vé không đổi.

**Bước 4.6 - Điều độ xử lý yêu cầu**: tab **Yêu cầu điều chỉnh** → **Xử lý** → thấy **giờ đã gán** và **giờ mong muốn**.
- Sai: giờ trong quá khứ → báo giờ đón khách phải từ hiện tại trở đi.
- **Đúng:** giờ khác và ô trống → **Lưu giờ đón khách**.

---

## Cảnh 5 - UC6 Kiểm soát xe vào bến

**Bước 5.1 - Quẹt thẻ vào bến (cửa sổ B `/tram-cong`)**: công tắc **Vào bến**, **Cổng 1**.
- Sai: **Thẻ chưa đăng ký** → "Thẻ không hợp lệ". Bấm **Quẹt thẻ khác**.
- Sai: đổi **Cổng 2** rồi quẹt thẻ tài xế → yêu cầu có mục "Đúng cổng" không đạt.
- Sai: chọn xe khác ở ô camera rồi quẹt → "Biển số khớp chuyến" không đạt.
- **Đúng:** về **Cổng 1**, camera "Xe của tài xế quẹt thẻ", quẹt thẻ tài xế có chuyến → "Đang chờ nhân viên xác nhận".

**Bước 5.2 - Phê duyệt (điều độ ngoài trời `0905 441 200`)**: **Xe vào bến** → tab **Chờ xác nhận**.
- Sai: yêu cầu có mục không đạt → **Cho vào ngoại lệ** → xác nhận khi chưa nhập lý do → "Nhập lý do."
- Sai: **Từ chối** → xác nhận khi chưa nhập lý do → "Nhập lý do." Nhập lý do thì từ chối được, trạm cổng báo cho tài xế.
- **Đúng:** yêu cầu 5/5 đạt → **Phê duyệt cho vào** → trạm cổng hiện "Cổng mở, mời xe vào bến".

**Bước 5.3 - Lập biên bản (ANTT `0905 441 300`)**: **Biên bản vi phạm** → **Lập biên bản vi phạm**.
- Sai: bỏ trống → "chưa chọn nhà xe."
- Sai: chọn nhà xe Cúc Tùng → "chưa chọn biển số xe."
- Sai: chưa chọn lỗi → "chưa chọn lỗi vi phạm." Chọn **Đi sai cổng**.
- Sai: thời điểm ở tương lai → "thời điểm vi phạm không được ở tương lai."
- Sai: chưa chọn vị trí → "chưa chọn vị trí vi phạm." Chọn **Cổng 2**.
- Sai: bỏ trống mô tả → "chưa nhập mô tả vi phạm."
- **Đúng:** nhập mô tả → **Lập biên bản** → có số `BB-00xx`. Thử bộ lọc theo lỗi.

---

## Cảnh 6 - UC7 Điều phối xe tại bến (nhà xe `0905 112 233`)

**Bước 6.1 - Ghi nhận xe vào/ra bãi**: **Vào/ra bãi** → **Ghi nhận xe vào/ra**.
- Sai: không chọn xe → "chưa chọn xe."; chọn xe, chưa chọn tài xế → "chưa chọn tài xế."
- Sai: **Vào bãi** với xe nhãn **· đang ở bãi** → "xe ... đang ở trong bãi (vào lúc ...)". Nếu chưa có, ghi nhận **Vào bãi** một xe trước rồi lặp lại.
- Sai: **Ra bãi**, giờ ra trước giờ vào → "giờ ra phải sau giờ vào."
- Sai: giờ ở tương lai → "thời gian không được ở tương lai."
- **Đúng:** **Ra bãi**, chọn **tài xế khác** tài xế lái vào, giờ hiện tại → **Ghi nhận**.

**Bước 6.2 - Báo cáo chọn người nhận**: **Báo cáo** → **Lập báo cáo**.
- Sai: **Gửi báo cáo** khi chưa chọn → "chưa chọn người nhận."
- Sai: có người nhận, thiếu tiêu đề → "chưa nhập tiêu đề."
- Sai: thiếu nội dung → "chưa nhập nội dung báo cáo."
- **Đúng:** chọn **Hoàng Gia Bảo** và **Lâm Thị Bích Ngọc** (không chọn Đoàn Văn Phước), tiêu đề "Cổng 1 đông xe buổi sáng" → **Gửi báo cáo**.

**Bước 6.3 - Người nhận đọc báo cáo**
- Sai: đăng nhập `0905 441 102` (không được chọn) → **Báo cáo nhà xe** không có báo cáo này.
- **Đúng:** đăng nhập `0905 441 100` → **Thông báo** có số chưa đọc → **Báo cáo nhà xe** → **Đọc** → **Đã đọc**.
- Quay lại nhà xe → **Báo cáo** → **Xem**: Gia Bảo **Đã đọc lúc ...**, Bích Ngọc **Chưa đọc**.

---

## Cảnh 7 - UC8 Quản lý xe rời bến

Dữ liệu mẫu luôn có chuyến sắp xuất bến trong khoảng 30 phút sau khi nạp (một chuyến đã có lệnh, vài chuyến chờ kiểm tra, một chuyến không đạt). Tên tài xế và biển số đọc trên danh sách.

**Bước 7.1 - Kiểm tra xuất bến (ANTT `0905 441 300`)**: **Kiểm tra xuất bến** → tab **Chờ kiểm tra** → **Kiểm tra**.
- Sai: **Yêu cầu phê duyệt** ngay → "chưa đánh giá ..."
- Sai: **Không đạt** một hạng mục, bỏ trống lý do → "chưa nhập lý do không đạt cho ..."
- Sai: số khách lớn hơn số ghế → "vượt số ghế."
- Sai: số khách đúng, hàng `999999` kg → "vượt tải trọng."
- **Đúng:** 12 khách, 120 kg, mọi hạng mục **Đạt** → **Yêu cầu phê duyệt** → chuyến sang **Đã cấp lệnh** kèm số `LXB-xxxx`. (Mục **Giấy tờ** hệ thống tự đối chiếu.)

**Bước 7.2 - Nhánh không đạt rồi kiểm tra lại**
- Chuyến khác: **Không đạt** Lốp xe kèm lý do → không cấp lệnh, sang tab **Không đạt**.
- **Đúng:** tab **Không đạt** → **Kiểm tra lại** (hiện lý do lần trước) → đạt hết → cấp lệnh.

**Bước 7.3 - Xe ra bến (cửa sổ B)**: công tắc **Ra bến** (tự chuyển **Cổng 2**).
- Sai: quẹt thẻ tài xế của chuyến **chưa có lệnh** → mục "Có lệnh xuất bến" không đạt.
- Sai: đổi **Cổng 1** rồi quẹt → "Đúng cổng" không đạt.
- Sai: camera chọn biển số khác → "Biển số khớp chuyến" không đạt.
- **Đúng:** **Cổng 2**, camera mặc định, quẹt thẻ tài xế của chuyến **đã có lệnh** → "Đang chờ nhân viên xác nhận".

**Bước 7.4 - Phê duyệt cho ra (điều độ ngoài trời `0905 441 200`)**: **Xe ra bến** → tab **Chờ xác nhận**.
- Sai: yêu cầu thiếu lệnh → **Từ chối** hoặc **Cho ra ngoại lệ**, xác nhận khi chưa nhập lý do → "Nhập lý do."
- **Đúng:** yêu cầu 5/5 đạt → **Phê duyệt cho ra** → trạm cổng hiện "Cổng mở, chúc xe thượng lộ bình an" kèm số lệnh.
- Nhà xe thấy dòng **Xe đã xuất bến lúc ... qua Cổng 2** trong chi tiết chuyến.

---

## Cảnh 8 - UC9 Quản lý thông tin cá nhân (mọi vai trò)

Đăng nhập tài khoản bất kỳ (ví dụ `0905 778 899`) → **Thông tin cá nhân**. Phần thông tin tài khoản chỉ xem.

**Bước 8.1 - Chỉnh sửa thông tin liên hệ**: **Chỉnh sửa**.
- Sai: email `abc` → "thư điện tử sai định dạng."
- Sai: giữ nguyên rồi **Lưu thay đổi** → "không có thay đổi nào để lưu."
- **Đúng:** email và địa chỉ hợp lệ → **Lưu thay đổi**. Email không bắt buộc.

**Bước 8.2 - Đổi mật khẩu** (cuối trang, không cần OTP)
- Sai: hiện tại `saimatkhau` → "Mật khẩu hiện tại không đúng."
- Sai: hai lần mới khác nhau → "Hai lần nhập mật khẩu không khớp nhau."
- Sai: mới trùng cũ → "Mật khẩu mới phải khác mật khẩu hiện tại."
- Sai: mới `123` → "Mật khẩu phải có ít nhất 6 ký tự."
- **Đúng:** `123456` → `654321` hai lần → **Đổi mật khẩu**. Vẫn **giữ đăng nhập**. Đổi lại `123456` để dùng tiếp.

---

## Cảnh 9 - UC10 Quản lý tài khoản (quản trị viên `0257 3824 111`)

Bảng 10 dòng mỗi trang, dùng **ô tra cứu** (gõ họ tên).

**Bước 9.1 - Xóa tài khoản**
- Sai: tra `Lan Anh` → **Xóa** → "Không thể xóa tài khoản", liệt kê hạng mục liên kết.
- **Đúng:** tra `Phạm Thị Mai` (chưa liên kết gì) → **Xóa** → **Xác nhận xóa**.

**Bước 9.2 - Tạo tài khoản**: **Tạo tài khoản**.
- Sai: để trống → "chưa nhập họ tên."
- Sai: `Nguyễn Văn Đạt`, số `0905 441 100` (đã có) → "số điện thoại đã được dùng cho tài khoản khác."
- Sai: số đúng, họ tên `Hoàng Gia Bảo` → "đã có tài khoản khác trùng họ tên."
- Sai: mật khẩu ban đầu `123` → báo mật khẩu tối thiểu 6 ký tự.
- **Đúng:** `Nguyễn Văn Đạt`, `0905 441 500`, vai trò **Nhân viên điều độ trong nhà**, mật khẩu `123456` → **Tạo tài khoản**.

**Bước 9.3 - Cập nhật tài khoản**: tra `Nguyễn Văn Đạt` → **Cập nhật** (không có ô mật khẩu).
- Sai: **Lưu cập nhật** khi không đổi gì → "không có thay đổi nào để lưu."
- **Đúng:** đổi vai trò sang **Nhân viên điều độ ngoài trời** và email → **Lưu cập nhật**.

**Bước 9.4 - Tài khoản bị tác động nhận thông báo**
- Đăng nhập `0905 441 500` / `123456` → vào trang của vai trò **mới** → **Thông báo** có 2 thông báo (được tạo, được cập nhật).
- Đổi họ tên Lê Minh Trí → hạng mục cũ đổi tên theo, tài khoản vẫn bị chặn xóa.

---

## Cảnh 10 - UC11 Báo cáo, thống kê (quản trị viên `0257 3824 111`)

**Bước 10.1 - Lập báo cáo và xem**: **Báo cáo, thống kê** → **Lập báo cáo, thống kê**.
- Sai: chưa chọn loại thì nút **Lập báo cáo** bị khóa.
- **Đúng:** chọn loại (ví dụ **Kiểm tra xuất bến**) → **Lập báo cáo** → trang hiện chỉ số tóm tắt, biểu đồ và bảng phân trang. Lặp lại với các loại còn lại: Hồ sơ nhà xe; Chuyến xe theo tuyến; Đón khách theo vị trí; Xe vào, ra bến theo ngày; Vi phạm tại bãi.

**Bước 10.2 - Gửi báo cáo cho nhân viên**: xem xong báo cáo → **Gửi báo cáo** → hộp thoại **Chọn người nhận báo cáo**.
- Sai: bấm **Gửi báo cáo** khi chưa chọn ai → "Dữ liệu không hợp lệ: chưa chọn người nhận báo cáo."
- **Đúng:** chọn **Nguyễn Thị Lan Anh** và **Hoàng Gia Bảo** → **Gửi báo cáo** → "Gửi báo cáo thành công."

**Bước 10.3 - Người nhận đọc báo cáo trong Thông báo**
- Sai: đăng nhập `0905 441 200` (không được chọn) → **Thông báo** không có báo cáo này.
- **Đúng:** đăng nhập `0905 778 899` → **Thông báo** → **Đọc** thông báo "Báo cáo: Kiểm tra xuất bến" → thấy chỉ số, biểu đồ và bảng đầy đủ.

**Bước 10.4 - Xuất báo cáo** (quản trị viên): **Xuất báo cáo**.
- Sai: "đến trang" `99` → **Tiếp tục** → "Số trang phải nằm trong khoảng từ 1 đến N."
- Đúng bước 1: sửa dải trang, chọn **A5** và **Ngang** → **Tiếp tục**.
- Chọn định dạng **PDF**, **Excel (.xlsx)** hoặc **CSV** → **Tiếp tục**.
- **Đúng:** màn xác nhận tóm tắt → **Xác nhận xuất báo cáo** → "Xuất báo cáo thành công". PDF và Excel gồm biểu đồ và bảng dữ liệu (PDF mở hộp thoại in, chọn **Lưu dưới dạng PDF**); CSV là văn bản thuần nên chỉ có bảng.

---

## Đã chạy thử

Các luồng chính đã được chạy tự động từng cảnh trên Chrome thật. Chưa kiểm tra được: lưu thật trong hộp thoại in PDF và toast hiện tức thời khi hai cửa sổ cùng mở.

## Gợi ý khi thời gian ngắn (khoảng 15 phút)

Mỗi cảnh làm một bước tiêu biểu: 1.1 → 1.5, 2.1, 2.3, 3.1, 3.4, 4.1, 4.3, 5.1, 5.2, 6.2, 7.1, 7.3, 7.4, 9.1, 9.2, 10.1, 10.2.
