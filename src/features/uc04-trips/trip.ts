/**
 * Nội dung chuyến xe dùng chung cho đăng ký, cập nhật, tiếp nhận.
 * Thuần dữ liệu và quy tắc, không có React.
 */
import { daysUntil, formatDate } from "@/lib/format";
import {
  fail,
  ok,
  type DossierInfo,
  type Result,
  type Route,
  type Trip,
  type TripInfo,
  type TripState,
} from "@/types";

/** Quy tắc nghiệp vụ: chỉ được yêu cầu cập nhật trước ngày khởi hành tối thiểu 7 ngày */
export const UPDATE_MIN_DAYS = 7;

const INVALID = "Thông tin không hợp lệ: ";
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Biểu mẫu chuyến: nhà xe chọn tuyến, xe và tài xế từ hồ sơ, rồi nhập ngày giờ */
export type TripForm = Pick<
  TripInfo,
  "routeId" | "vehicleId" | "driverId" | "date" | "departAt"
>;

export const EMPTY_TRIP_FORM: TripForm = {
  routeId: "",
  vehicleId: "",
  driverId: "",
  date: "",
  departAt: "",
};

export function pickTripInfo(t: TripInfo): TripInfo {
  return {
    routeId: t.routeId,
    vehicleId: t.vehicleId,
    driverId: t.driverId,
    plate: t.plate,
    seats: t.seats,
    driverName: t.driverName,
    driverPhone: t.driverPhone,
    date: t.date,
    departAt: t.departAt,
  };
}

export function toTripForm(t: TripInfo): TripForm {
  return {
    routeId: t.routeId,
    vehicleId: t.vehicleId,
    driverId: t.driverId,
    date: t.date,
    departAt: t.departAt,
  };
}

/** Chụp biển số, số chỗ, tài xế từ hồ sơ để lịch sử chuyến không đổi theo hồ sơ */
export function toTripInfo(f: TripForm, d: DossierInfo): TripInfo {
  const v = d.vehicles.find((x) => x.id === f.vehicleId);
  const dr = d.drivers.find((x) => x.id === f.driverId);
  if (!v || !dr) throw new Error("Xe hoặc tài xế không thuộc hồ sơ nhà xe");
  return {
    routeId: f.routeId,
    vehicleId: v.id,
    driverId: dr.id,
    plate: v.plate,
    seats: v.seats,
    driverName: dr.name,
    driverPhone: dr.phone,
    date: f.date,
    departAt: f.departAt,
  };
}

/**
 * Thiếu trường bắt buộc hoặc sai định dạng thì không hợp lệ.
 * Xe và tài xế phải thuộc hồ sơ nhà xe, giấy tờ xe phải còn hạn tới ngày xuất bến.
 */
export function checkTrip(f: TripForm, d: DossierInfo): Result {
  if (!f.routeId) return fail(`${INVALID}chưa chọn điểm đi và điểm đến.`);
  if (!f.vehicleId) return fail(`${INVALID}chưa chọn xe.`);
  const v = d.vehicles.find((x) => x.id === f.vehicleId);
  if (!v) return fail(`${INVALID}xe không có trong hồ sơ nhà xe.`);
  if (!f.driverId) return fail(`${INVALID}chưa chọn tài xế.`);
  if (!d.drivers.some((x) => x.id === f.driverId))
    return fail(`${INVALID}tài xế không có trong hồ sơ nhà xe.`);
  if (!f.date) return fail(`${INVALID}chưa chọn ngày xuất bến.`);
  if (!f.departAt) return fail(`${INVALID}chưa chọn giờ xuất bến.`);
  if (!TIME.test(f.departAt))
    return fail(`${INVALID}giờ xuất bến sai định dạng.`);
  const when = new Date(`${f.date}T${f.departAt}:00`).getTime();
  if (Number.isNaN(when) || when <= Date.now())
    return fail(
      `${INVALID}thời gian xuất bến dự kiến phải sau thời điểm hiện tại.`,
    );
  if (v.inspectionExpiry < f.date)
    return fail(
      `${INVALID}Giấy chứng nhận kiểm định của xe ${v.plate} hết hạn ngày ${formatDate(v.inspectionExpiry)}, trước ngày xuất bến.`,
    );
  if (v.insuranceExpiry < f.date)
    return fail(
      `${INVALID}bảo hiểm trách nhiệm dân sự của xe ${v.plate} hết hạn ngày ${formatDate(v.insuranceExpiry)}, trước ngày xuất bến.`,
    );
  return ok("");
}

/** Chuyến đã duyệt chỉ được xin cập nhật khi còn đủ số ngày trước giờ khởi hành */
export function checkUpdateWindow(t: Trip): Result {
  const left = daysUntil(t.date);
  if (left < UPDATE_MIN_DAYS) {
    return fail(
      `Chỉ được yêu cầu cập nhật trước ngày khởi hành tối thiểu ${UPDATE_MIN_DAYS} ngày. Chuyến này khởi hành ngày ${formatDate(t.date)}.`,
    );
  }
  return ok("");
}

/** Giờ xuất bến dự kiến đã qua so với thời điểm `now` */
export function isExpired(t: TripInfo, now: number): boolean {
  return new Date(`${t.date}T${t.departAt}:00`).getTime() < now;
}

/** Trạng thái hiển thị: quá hạn được ưu tiên hơn trạng thái duyệt */
export function tripState(t: Trip, now: number): TripState {
  return isExpired(t, now) ? "expired" : t.status;
}

/** Số chuyến chưa khởi hành đang dùng từng xe, từng tài xế của một nhà xe */
export interface ResourceUsage {
  vehicles: Record<string, number>;
  drivers: Record<string, number>;
}

/**
 * Chuyến bị từ chối hoặc đã quá hạn không còn giữ xe, tài xế. Chuyến đang cập
 * nhật giữ cả xe và tài xế của bản cũ lẫn bản đề nghị.
 */
export function resourceUsage(
  trips: Trip[],
  dossierId: string,
  now: number,
): ResourceUsage {
  const usage: ResourceUsage = { vehicles: {}, drivers: {} };
  for (const t of trips) {
    if (t.dossierId !== dossierId || t.status === "rejected") continue;
    if (isExpired(t, now)) continue;
    const vehicles = new Set([t.vehicleId, t.request?.vehicleId]);
    const drivers = new Set([t.driverId, t.request?.driverId]);
    for (const id of vehicles)
      if (id) usage.vehicles[id] = (usage.vehicles[id] ?? 0) + 1;
    for (const id of drivers)
      if (id) usage.drivers[id] = (usage.drivers[id] ?? 0) + 1;
  }
  return usage;
}

/** Chỉ chuyến còn chờ nhân viên quyết định mới duyệt hoặc từ chối được */
export function isAwaitingState(s: TripState): boolean {
  return s === "receiving" || s === "updating";
}

// hiển thị

export type TripKey = keyof TripInfo;

export const TRIP_GROUPS: {
  title: string;
  rows: { key: TripKey; label: string }[];
}[] = [
  {
    title: "Hành trình",
    rows: [
      { key: "routeId", label: "Tuyến đường" },
      { key: "date", label: "Ngày xuất bến dự kiến" },
      { key: "departAt", label: "Giờ xuất bến dự kiến" },
    ],
  },
  {
    title: "Phương tiện",
    rows: [
      { key: "plate", label: "Biển số xe" },
      { key: "seats", label: "Số chỗ ngồi" },
    ],
  },
  {
    title: "Tài xế",
    rows: [
      { key: "driverName", label: "Họ tên tài xế" },
      { key: "driverPhone", label: "Số điện thoại" },
    ],
  },
];

export function routeName(routes: Route[], id: string): string {
  const r = routes.find((x) => x.id === id);
  return r ? `${r.from} - ${r.to}` : "-";
}

export function showTripValue(
  routes: Route[],
  info: TripInfo,
  key: TripKey,
): string {
  if (key === "routeId") return routeName(routes, info.routeId);
  if (key === "date") return formatDate(info.date);
  if (key === "seats") return `${info.seats} chỗ`;
  return String(info[key] ?? "");
}
