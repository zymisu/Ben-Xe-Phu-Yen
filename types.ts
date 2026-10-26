/**
 * Mô hình dữ liệu của hệ thống.
 */
import type { ReportTable } from "@/features/uc11-statistics/reports";
export type Role =
  "carrier" | "reception" | "indoor" | "outdoor" | "security" | "admin";

export const ROLE_LABEL: Record<Role, string> = {
  carrier: "Nhà xe",
  reception: "Nhân viên tiếp nhận đăng ký",
  indoor: "Nhân viên điều độ trong nhà",
  outdoor: "Nhân viên điều độ ngoài trời",
  security: "Nhân viên an ninh trật tự",
  admin: "Quản trị viên",
};

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral";

export interface Account {
  id: string;
  /** Số điện thoại cũng là tên đăng nhập khi tài khoản tạo từ trang đăng ký */
  username: string;
  password: string;
  phone: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  /** Mã hồ sơ (nhà xe, HS-0001) hoặc mã nhân viên (NV-0001), cấp khi phê duyệt, không đổi được */
  code: string;
  /** Địa chỉ liên hệ, người dùng tự chỉnh sửa được */
  address: string;
}

// hồ sơ đơn vị vận tải

/**
 * Bốn trạng thái của hồ sơ đơn vị vận tải:
 *  - receiving  đang tiếp nhận: lập lần đầu, chờ nhân viên duyệt
 *  - active     đang hoạt động: đã từng được duyệt và hiện không có yêu cầu
 *               cập nhật nào đang chờ
 *  - updating   đang cập nhật: đã từng được duyệt, đang chờ duyệt thay đổi
 *  - rejected   đã từ chối: bị từ chối duyệt tiếp nhận (chưa từng được duyệt)
 */
export type DossierStatus = "receiving" | "active" | "updating" | "rejected";

export const DOSSIER_STATUS_LABEL: Record<DossierStatus, string> = {
  receiving: "Đang tiếp nhận",
  active: "Đang hoạt động",
  updating: "Đang cập nhật",
  rejected: "Đã từ chối",
};

export const DOSSIER_STATUS_TONE: Record<DossierStatus, Tone> = {
  receiving: "warn",
  active: "ok",
  updating: "info",
  rejected: "danger",
};

/** Loại hình kinh doanh vận tải đăng ký khai thác tại bến */
export const SERVICE_TYPES = [
  "Tuyến cố định",
  "Xe hợp đồng",
  "Vận tải hàng hoá",
] as const;

/** Tài xế thuộc nhà xe */
export interface Driver {
  id: string;
  name: string;
  phone: string;
}

/** Xe thuộc nhà xe, kèm các giấy tờ phải còn hiệu lực khi xuất bến */
export interface Vehicle {
  id: string;
  plate: string;
  seats: number;
  /** Giấy đăng ký xe */
  registrationNo: string;
  /** Giấy chứng nhận kiểm định an toàn kỹ thuật */
  inspectionNo: string;
  inspectionExpiry: string;
  /** Bảo hiểm trách nhiệm dân sự của chủ xe */
  insuranceNo: string;
  insuranceExpiry: string;
}

/** Nội dung hồ sơ do đơn vị vận tải khai, dùng cho cả đăng ký và cập nhật */
export interface DossierInfo {
  // thông tin đơn vị
  companyName: string;
  taxCode: string;
  address: string;
  representative: string;
  position: string;
  email: string;

  // giấy tờ pháp lý dùng để đối chiếu
  /** Giấy chứng nhận đăng ký doanh nghiệp */
  bizNo: string;
  bizDate: string;
  /** Giấy phép kinh doanh vận tải bằng xe ô tô */
  transportNo: string;
  transportDate: string;
  transportIssuer: string;

  // nội dung đề nghị
  serviceType: string;
  routeFrom: string;
  routeTo: string;

  // nguồn lực để đăng ký chuyến: nhà xe chọn tài xế và xe từ hai danh sách này
  drivers: Driver[];
  vehicles: Vehicle[];
}

export interface Dossier extends DossierInfo {
  id: string;
  /** Tài khoản đã tạo hồ sơ này */
  accountId: string;
  phone: string;
  status: DossierStatus;
  submittedAt: string;
  /** Đã từng được duyệt: quyết định nộp lại là tiếp nhận mới hay cập nhật */
  everApproved: boolean;
  /**
   * Nội dung đơn vị đề nghị thay đổi. Các trường của hồ sơ giữ nguyên bản đã
   * duyệt cho tới khi nhân viên chấp thuận yêu cầu cập nhật.
   */
  request?: DossierInfo;
  requestedAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectReason?: string;
  /** Đơn vị đã xem thông báo kết quả duyệt (chỉ hiện một lần) */
  resultSeen?: boolean;
  /** Yêu cầu cập nhật gần nhất bị từ chối; hồ sơ cũ vẫn đang hoạt động */
  updateRejection?: { reason: string; date: string };
}

// vận hành bến

export interface Route {
  id: string;
  code: string;
  from: string;
  to: string;
  km: number;
  minutes: number;
  /** Giá vé niêm yết do đơn vị vận tải kê khai */
  fare: number;
}

/** Trạng thái chuyến xe dùng cùng bốn trạng thái với hồ sơ */
export type TripStatus = DossierStatus;

/**
 * Trạng thái hiển thị của chuyến: bốn trạng thái duyệt, cộng "đã quá hạn" -
 * không lưu mà tính từ giờ xuất bến so với thời điểm hiện tại.
 */
export type TripState = TripStatus | "expired";

export const TRIP_STATUS_LABEL: Record<TripState, string> = {
  receiving: "Chờ tiếp nhận",
  active: "Đã duyệt",
  updating: "Đang cập nhật",
  rejected: "Đã từ chối",
  expired: "Đã quá hạn",
};

export const TRIP_STATUS_TONE: Record<TripState, Tone> = {
  ...DOSSIER_STATUS_TONE,
  expired: "neutral",
};

/** Nội dung nhà xe khai khi đăng ký hoặc cập nhật một chuyến */
export interface TripInfo {
  routeId: string;
  /** Xe và tài xế chọn từ hồ sơ nhà xe */
  vehicleId: string;
  driverId: string;
  /** Bản chụp biển số, số chỗ, tài xế lúc đăng ký để lịch sử không đổi theo hồ sơ */
  plate: string;
  seats: number;
  driverName: string;
  driverPhone: string;
  /** Ngày xuất bến dự kiến, dạng YYYY-MM-DD */
  date: string;
  /** Giờ xuất bến dự kiến, dạng HH:MM */
  departAt: string;
}

export interface Trip extends TripInfo {
  id: string;
  /** Hồ sơ đơn vị vận tải đăng ký chuyến */
  dossierId: string;
  status: TripStatus;
  /** Đã từng được duyệt: nộp lại là cập nhật, không phải đăng ký mới */
  everApproved: boolean;
  createdAt: string;
  /** Nội dung đề nghị thay đổi; các trường chính giữ bản đã duyệt */
  request?: TripInfo;
  requestedAt?: string;
  reviewedAt?: string;
  reviewerName?: string;
  rejectReason?: string;
  /** Yêu cầu cập nhật gần nhất bị từ chối; chuyến cũ vẫn có hiệu lực */
  updateRejection?: { reason: string; date: string };
  /** Vị trí và giờ đón khách do nhân viên điều độ trong nhà sắp xếp */
  boarding?: Boarding;
  /** Xe đã vào bến: ghi khi nhân viên điều độ ngoài trời phê duyệt cho vào */
  arrival?: { at: string; gate: string; entryId: string };
  /** Xe đã xuất bến: ghi khi xe ra cổng và được nhân viên điều độ ngoài trời phê duyệt */
  departure?: { at: string; gate: string; entryId: string };
  /** Các lần nhân viên ANTT kiểm tra xe trước khi xuất bến, lần mới nhất ở cuối */
  inspections?: Inspection[];
  /** Lệnh xuất bến, cấp khi một lần kiểm tra đạt */
  departureOrder?: { code: string; issuedAt: string; issuedBy: string };
}

// kiểm tra xuất bến

export interface InspectionItem {
  key: string;
  group: string;
  label: string;
  ok: boolean;
  /** Bắt buộc khi không đạt */
  reason?: string;
  /** Hạng mục hệ thống tự đánh giá từ hồ sơ, nhân viên không sửa */
  auto?: boolean;
}

/** Phiếu kiểm tra an toàn xe, người và hàng hóa trước giờ xuất bến */
export interface Inspection {
  id: string;
  /** Thời điểm kiểm tra, dạng YYYY-MM-DDTHH:MM */
  at: string;
  byName: string;
  result: "pass" | "fail";
  items: InspectionItem[];
  passengers: number;
  cargoKg: number;
}

export interface Notice {
  id: string;
  title: string;
  text: string;
  date: string;
}

// đón khách

/** Vị trí đón khách (ô đậu xe) trong khu vực lên khách */
export interface Bay {
  id: string;
  code: string;
}

/**
 * Thông tin đón khách của một chuyến. Giờ đón là giờ bắt đầu cửa sổ 15 phút,
 * cùng ngày với chuyến. Giờ trên vé (`departAt`) không đổi dù giờ đón bị lùi.
 */
export interface Boarding {
  bayId: string;
  /** Giờ bắt đầu đón khách, dạng HH:MM */
  startAt: string;
  /** assigned: đã phân công; adjusting: nhà xe xin điều chỉnh, chờ nhân viên */
  status: "assigned" | "adjusting";
  assignedBy: string;
  assignedAt: string;
  /** Giờ đón trước lần điều chỉnh gần nhất */
  previousStart?: string;
  /** Yêu cầu điều chỉnh của nhà xe, chỉ có khi đang điều chỉnh */
  request?: { desiredStart: string; note: string; requestedAt: string };
}

/** Trạng thái hiển thị của chuyến trong bảng đón khách */
export type BoardingState = "pending" | "assigned" | "adjusting" | "conflict";

export const BOARDING_STATE_LABEL: Record<BoardingState, string> = {
  pending: "Chờ phân công",
  assigned: "Đã phân công",
  adjusting: "Yêu cầu điều chỉnh",
  conflict: "Cần xếp lại",
};

export const BOARDING_STATE_TONE: Record<BoardingState, Tone> = {
  pending: "warn",
  assigned: "ok",
  adjusting: "info",
  conflict: "danger",
};

/**
 * Điều chỉnh thực tế của một vị trí do nhân viên điều độ ngoài trời cập nhật:
 *  - unavailable: tạm ngưng (xe hỏng, rào chắn...), không xếp xe vào được
 *  - delay: khung giờ của vị trí bị lệch trễ `minutes` phút
 */
export interface BayAdjustment {
  id: string;
  bayId: string;
  kind: "unavailable" | "delay";
  /** Thời điểm bắt đầu hiệu lực, dạng YYYY-MM-DDTHH:MM */
  from: string;
  /** Thời điểm hết hiệu lực; bỏ trống là chưa rõ */
  until?: string;
  minutes?: number;
  reason: string;
  byName: string;
  createdAt: string;
  endedAt?: string;
}

// xe vào bến

export type EntryStatus = "pending" | "approved" | "rejected";

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  pending: "Chờ xác nhận",
  approved: "Đã cho vào",
  rejected: "Đã từ chối",
};

export const ENTRY_STATUS_TONE: Record<EntryStatus, Tone> = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
};

/** Một mục hệ thống đối chiếu khi tài xế quẹt thẻ */
export interface EntryCheck {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

/** Hướng đi qua cổng: vào bến (UC6) hoặc ra bến (UC8.2) */
export type EntryKind = "entry" | "exit";

/** Yêu cầu duyệt xe vào hoặc ra bến, tạo khi tài xế quẹt thẻ NFC tại cổng */
export interface EntryRequest {
  id: string;
  kind: EntryKind;
  gate: string;
  cardUid: string;
  driverId: string;
  driverName: string;
  dossierId: string;
  /** Chuyến hôm nay hệ thống ghép với tài xế; trống nếu không có */
  tripId?: string;
  /** Biển số camera đọc được tại cổng */
  plate: string;
  /** Thời điểm quẹt thẻ, dạng YYYY-MM-DDTHH:MM */
  requestedAt: string;
  checks: EntryCheck[];
  status: EntryStatus;
  /** Cho vào dù có mục không đạt; bắt buộc có lý do */
  exception?: boolean;
  reason?: string;
  decidedBy?: string;
  decidedAt?: string;
}

// biên bản vi phạm

/** Danh mục lỗi vi phạm nội quy bến xe (danh mục mẫu) */
export const VIOLATION_TYPES = [
  "Dừng xe trả khách quá lâu",
  "Đi sai cổng",
  "Đỗ sai vị trí quy định",
  "Xe không đủ điều kiện vào bến",
  "Vi phạm khác",
] as const;

/** Biên bản vi phạm tại bãi do nhân viên an ninh trật tự lập */
export interface Violation {
  id: string;
  /** Số biên bản, ví dụ BB-0001 */
  code: string;
  type: string;
  dossierId: string;
  plate: string;
  /** Tên tài xế, bỏ trống nếu chưa xác định */
  driverName?: string;
  /** Thời điểm vi phạm, dạng YYYY-MM-DDTHH:MM */
  occurredAt: string;
  /** Cổng, ô đón khách hoặc khu vực nơi xảy ra vi phạm */
  location: string;
  description: string;
  createdBy: string;
  /** Thời điểm lập, dạng YYYY-MM-DDTHH:MM */
  createdAt: string;
}

// điều phối xe tại bến

/** Một lần ghi nhận xe vào hoặc ra bãi do nhà xe tự nhập; vào và ra có thể do hai tài xế khác nhau */
export interface YardLog {
  id: string;
  dossierId: string;
  kind: "in" | "out";
  vehicleId: string;
  driverId: string;
  /** Bản chụp biển số và tên tài xế lúc ghi nhận */
  plate: string;
  driverName: string;
  /** Thời điểm xe vào hoặc ra, dạng YYYY-MM-DDTHH:MM */
  at: string;
  createdAt: string;
}

export const YARD_KIND_LABEL: Record<YardLog["kind"], string> = {
  in: "Vào bãi",
  out: "Ra bãi",
};

/** Báo cáo tự do của nhà xe gửi nhân viên điều độ trong nhà đọc */
export interface Report {
  id: string;
  dossierId: string;
  title: string;
  body: string;
  /** Xe liên quan, không bắt buộc */
  plate?: string;
  /** Thời điểm gửi, dạng YYYY-MM-DDTHH:MM */
  createdAt: string;
  /** Nhân viên điều độ trong nhà được nhà xe chọn làm người nhận */
  recipientIds: string[];
  /** Người nhận đã đọc, kèm họ tên và thời điểm đọc đầu tiên */
  reads: { accountId: string; name: string; at: string }[];
}

export type ReportStatus = "unread" | "read";

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  unread: "Chưa đọc",
  read: "Đã đọc",
};

/** Với nhà xe: đã có ít nhất một người nhận đọc thì là đã đọc */
export const reportStatus = (r: Report): ReportStatus =>
  r.reads.length > 0 ? "read" : "unread";

// thông báo

/** Thông báo gửi tới một tài khoản, hiện ngay khi tài khoản đó đang đăng nhập */
export interface Notification {
  id: string;
  accountId: string;
  title: string;
  text: string;
  /** Thời điểm gửi, dạng YYYY-MM-DDTHH:MM */
  createdAt: string;
  read: boolean;
  /** Báo cáo, thống kê đính kèm (thông báo gửi báo cáo của quản trị viên) */
  report?: ReportTable;
}

export interface Data {
  accounts: Account[];
  dossiers: Dossier[];
  routes: Route[];
  trips: Trip[];
  notices: Notice[];
  bays: Bay[];
  bayAdjustments: BayAdjustment[];
  entries: EntryRequest[];
  violations: Violation[];
  yardLogs: YardLog[];
  reports: Report[];
  notifications: Notification[];
}

// kết quả

export type Result<T = void> = {
  ok: boolean;
  message: string;
  data?: T;
};

export const ok = <T>(message: string, data?: T): Result<T> => ({
  ok: true,
  message,
  data,
});

export const fail = <T>(message: string, data?: T): Result<T> => ({
  ok: false,
  message,
  data,
});
