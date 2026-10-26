/** Quy tắc kiểm tra xe xuất bến: phiếu kiểm tra, điều kiện hợp lệ, cấp lệnh. Không có React. */
import { formatDate } from "@/lib/format";
import { fail, ok } from "@/types";
import type {
  Data,
  Dossier,
  Inspection,
  InspectionItem,
  Result,
  Trip,
} from "@/types";

/** Chuyến chỉ vào danh sách kiểm tra khi giờ xuất bến còn trong khoảng này */
export const WINDOW_MINUTES = 30;

/** Khối lượng hàng, hành lý tối đa cho mỗi chỗ ngồi của xe (giá trị quy ước) */
export const CARGO_KG_PER_SEAT = 20;

const MIN = 60_000;

export interface ManualItem {
  key: string;
  group: string;
  label: string;
}

/** Các hạng mục nhân viên trực tiếp kiểm tra và đánh giá */
export const MANUAL_ITEMS: ManualItem[] = [
  { key: "tyres", group: "An toàn xe", label: "Lốp xe (độ mòn, áp suất)" },
  { key: "brakes", group: "An toàn xe", label: "Hệ thống phanh" },
  {
    key: "lights",
    group: "An toàn xe",
    label: "Đèn chiếu sáng và đèn tín hiệu",
  },
  { key: "horn", group: "An toàn xe", label: "Còi và gạt mưa" },
  {
    key: "tracker",
    group: "An toàn xe",
    label: "Thiết bị giám sát hành trình hoạt động",
  },
  { key: "camera", group: "An toàn xe", label: "Camera trên xe hoạt động" },
  {
    key: "exits",
    group: "An toàn xe",
    label: "Cửa thoát hiểm và búa phá kính",
  },
  { key: "extinguisher", group: "An toàn xe", label: "Bình chữa cháy còn hạn" },
  { key: "leak", group: "An toàn xe", label: "Không rò rỉ nhiên liệu, dầu" },
  {
    key: "driver",
    group: "Người lái",
    label: "Tài xế đúng người trong chuyến",
  },
  {
    key: "license",
    group: "Người lái",
    label: "Giấy phép lái xe còn hạn, đúng hạng",
  },
  { key: "alcohol", group: "Người lái", label: "Nồng độ cồn bằng 0" },
  {
    key: "rest",
    group: "Người lái",
    label: "Thời gian lái xe liên tục đủ nghỉ",
  },
  {
    key: "manifest",
    group: "Hành khách",
    label: "Danh sách hành khách khớp vé",
  },
  { key: "belts", group: "Hành khách", label: "Dây an toàn đầy đủ" },
  { key: "standing", group: "Hành khách", label: "Không chở người đứng" },
  {
    key: "banned",
    group: "Hàng hóa, hành lý",
    label: "Không chở hàng cấm, hàng nguy hiểm",
  },
  {
    key: "secured",
    group: "Hàng hóa, hành lý",
    label: "Hàng hóa chằng buộc chắc chắn",
  },
  {
    key: "luggage",
    group: "Hàng hóa, hành lý",
    label: "Hành lý đặt đúng khoang",
  },
];

export const GROUPS = [
  "Giấy tờ",
  "An toàn xe",
  "Người lái",
  "Hành khách",
  "Hàng hóa, hành lý",
];

export const cargoLimit = (seats: number): number => seats * CARGO_KG_PER_SEAT;

/** Hạng mục giấy tờ hệ thống tự đánh giá từ hồ sơ nhà xe */
export function autoItems(
  trip: Trip,
  dossier: Dossier,
  today: string,
): InspectionItem[] {
  const v = dossier.vehicles.find((x) => x.id === trip.vehicleId);
  const item = (
    key: string,
    label: string,
    expiry?: string,
  ): InspectionItem => {
    const good = !!expiry && expiry >= today;
    return {
      key,
      group: "Giấy tờ",
      label,
      ok: good,
      auto: true,
      reason: good
        ? undefined
        : expiry
          ? `Đã hết hạn ${formatDate(expiry)}`
          : "Không tìm thấy xe trong hồ sơ",
    };
  };
  return [
    item("inspection", "Kiểm định còn hạn", v?.inspectionExpiry),
    item("insurance", "Bảo hiểm còn hạn", v?.insuranceExpiry),
  ];
}

// danh sách chuyến

export type InspectionState = "pending" | "failed" | "passed";

export const STATE_LABEL: Record<InspectionState, string> = {
  pending: "Chờ kiểm tra",
  failed: "Không đạt",
  passed: "Đã cấp lệnh",
};

export const lastInspection = (t: Trip): Inspection | null =>
  t.inspections?.[t.inspections.length - 1] ?? null;

/**
 * Trạng thái kiểm tra của chuyến trong danh sách, hoặc null nếu chưa thuộc diện
 * kiểm tra: chuyến phải đã được duyệt, xe đã vào bến, chưa xuất bến, và giờ
 * xuất bến còn trong 30 phút tới (chuyến đã trễ giờ chưa kiểm tra vẫn hiện).
 */
export function inspectionState(t: Trip, now: number): InspectionState | null {
  if (t.status !== "active" || !t.arrival || t.departure) return null;
  if (t.departureOrder) return "passed";
  if (lastInspection(t)?.result === "fail") return "failed";
  const at = new Date(`${t.date}T${t.departAt}:00`).getTime();
  return at - now <= WINDOW_MINUTES * MIN ? "pending" : null;
}

/** Số phút còn lại tới giờ xuất bến (âm nếu đã trễ) */
export function minutesLeft(t: Trip, now: number): number {
  return Math.round(
    (new Date(`${t.date}T${t.departAt}:00`).getTime() - now) / MIN,
  );
}

// biểu mẫu

export interface ItemInput {
  ok?: boolean;
  reason: string;
}

export interface InspectionForm {
  items: Record<string, ItemInput>;
  passengers: string;
  cargoKg: string;
}

export const emptyForm = (): InspectionForm => ({
  items: Object.fromEntries(
    MANUAL_ITEMS.map((m) => [m.key, { reason: "" } as ItemInput]),
  ),
  passengers: "",
  cargoKg: "",
});

const INVALID = "Dữ liệu không hợp lệ: ";

/**
 * Kiểm tra tính hợp lệ: đánh giá đủ mọi hạng mục, hạng mục không đạt
 * phải có lý do, số khách không vượt số ghế, hàng không vượt tải trọng.
 */
export function checkInspection(f: InspectionForm, trip: Trip): Result {
  for (const m of MANUAL_ITEMS) {
    const input = f.items[m.key];
    if (input?.ok === undefined)
      return fail(`${INVALID}chưa đánh giá "${m.label}".`);
    if (input.ok === false && !input.reason.trim())
      return fail(`${INVALID}chưa nhập lý do không đạt cho "${m.label}".`);
  }
  const pax = Number(f.passengers);
  if (f.passengers === "" || !Number.isInteger(pax) || pax < 0)
    return fail(`${INVALID}số hành khách phải là số nguyên không âm.`);
  if (pax > trip.seats)
    return fail(
      `${INVALID}số hành khách ${pax} vượt số ghế ${trip.seats} của xe.`,
    );
  const kg = Number(f.cargoKg);
  if (f.cargoKg === "" || !Number.isFinite(kg) || kg < 0)
    return fail(`${INVALID}khối lượng hàng phải là số không âm.`);
  if (kg > cargoLimit(trip.seats))
    return fail(
      `${INVALID}khối lượng hàng ${kg} kg vượt tải trọng cho phép ${cargoLimit(trip.seats)} kg.`,
    );
  return ok("");
}

/** Số lệnh xuất bến kế tiếp: LXB-0001, LXB-0002... */
export function nextOrderCode(trips: Trip[]): string {
  const max = trips.reduce(
    (m, t) =>
      Math.max(m, Number(t.departureOrder?.code.replace(/\D/g, "")) || 0),
    0,
  );
  return `LXB-${String(max + 1).padStart(4, "0")}`;
}

/**
 * Lưu kết quả kiểm tra; mọi hạng mục đạt thì cấp lệnh xuất bến.
 * Có hạng mục không đạt thì lưu kết quả Không đạt, không cấp lệnh.
 */
export function saveInspection(
  data: Data,
  tripId: string,
  f: InspectionForm,
  byName: string,
  at: string,
  today: string,
): { data: Data; passed: boolean } {
  const trip = data.trips.find((t) => t.id === tripId);
  const dossier = data.dossiers.find((d) => d.id === trip?.dossierId);
  if (!trip || !dossier) return { data, passed: false };

  const manual: InspectionItem[] = MANUAL_ITEMS.map((m) => ({
    key: m.key,
    group: m.group,
    label: m.label,
    ok: f.items[m.key].ok === true,
    reason:
      f.items[m.key].ok === true ? undefined : f.items[m.key].reason.trim(),
  }));
  const items = [...autoItems(trip, dossier, today), ...manual];
  const passed = items.every((i) => i.ok);
  const inspection: Inspection = {
    id: `kt-${Date.now()}`,
    at,
    byName,
    result: passed ? "pass" : "fail",
    items,
    passengers: Number(f.passengers),
    cargoKg: Number(f.cargoKg),
  };
  const order = passed
    ? {
        code: nextOrderCode(data.trips),
        issuedAt: at,
        issuedBy: byName,
      }
    : undefined;

  return {
    passed,
    data: {
      ...data,
      trips: data.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              inspections: [...(t.inspections ?? []), inspection],
              departureOrder: order ?? t.departureOrder,
            }
          : t,
      ),
    },
  };
}
