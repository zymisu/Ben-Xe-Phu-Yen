/** Quy tắc đón khách: cửa sổ 15 phút, kiểm tra mật độ bến, điều chỉnh vị trí. Không có React. */
import { isExpired } from "../uc04-trips/trip";
import { hmOf, todayISO } from "@/lib/format";
import {
  fail,
  ok,
  type Bay,
  type BayAdjustment,
  type BoardingState,
  type Result,
  type Trip,
} from "@/types";

export const BOARD_MINUTES = 15;
/** Tỉ lệ vị trí bận hoặc tạm ngưng tối đa cho phép trong một khung giờ */
export const MAX_DENSITY = 0.9;

const MIN = 60_000;

/** Thời điểm (mili giây) của giờ HH:MM trong ngày `date` */
export const msOf = (date: string, hm: string): number =>
  new Date(`${date}T${hm}:00`).getTime();

const adjMs = (s: string) => new Date(`${s}:00`).getTime();

/** Điều chỉnh còn hiệu lực: chưa kết thúc sớm và chưa quá thời điểm hết hiệu lực */
export function isInEffect(a: BayAdjustment, now: number): boolean {
  if (a.endedAt) return false;
  return !a.until || adjMs(a.until) > now;
}

export interface Slot {
  tripId: string;
  bayId: string;
  start: number;
  end: number;
}

/** Số phút vị trí bị lệch trễ tại thời điểm `start` */
function delayAt(bayId: string, start: number, adj: BayAdjustment[]): number {
  let minutes = 0;
  for (const a of adj) {
    if (a.kind !== "delay" || a.bayId !== bayId || a.endedAt) continue;
    if (adjMs(a.from) > start) continue;
    if (a.until && start > adjMs(a.until)) continue;
    minutes += a.minutes ?? 0;
  }
  return minutes;
}

/** Cửa sổ đón khách thực tế của một chuyến, đã tính lệch giờ của vị trí */
export function slotOf(t: Trip, adj: BayAdjustment[]): Slot | null {
  if (!t.boarding || t.status === "rejected") return null;
  const base = msOf(t.date, t.boarding.startAt);
  const start = base + delayAt(t.boarding.bayId, base, adj) * MIN;
  return {
    tripId: t.id,
    bayId: t.boarding.bayId,
    start,
    end: start + BOARD_MINUTES * MIN,
  };
}

const overlap = (aS: number, aE: number, bS: number, bE: number) =>
  aS < bE && bS < aE;

/** Điều chỉnh "tạm ngưng" của vị trí chồng lên khoảng thời gian cho trước */
function blockingAdjustment(
  bayId: string,
  start: number,
  end: number,
  adj: BayAdjustment[],
): BayAdjustment | null {
  return (
    adj.find(
      (a) =>
        a.kind === "unavailable" &&
        a.bayId === bayId &&
        !a.endedAt &&
        overlap(start, end, adjMs(a.from), a.until ? adjMs(a.until) : Infinity),
    ) ?? null
  );
}

/** Các chuyến đã xếp nhưng đang xung đột: trùng giờ cùng vị trí hoặc vị trí tạm ngưng */
export function conflictIds(
  trips: Trip[],
  adj: BayAdjustment[],
  now: number,
): Set<string> {
  const slots = trips
    .map((t) => slotOf(t, adj))
    .filter((s): s is Slot => !!s && s.end > now);
  const out = new Set<string>();
  for (let i = 0; i < slots.length; i++) {
    const a = slots[i];
    if (blockingAdjustment(a.bayId, a.start, a.end, adj)) out.add(a.tripId);
    for (let j = i + 1; j < slots.length; j++) {
      const b = slots[j];
      if (a.bayId === b.bayId && overlap(a.start, a.end, b.start, b.end)) {
        out.add(a.tripId);
        out.add(b.tripId);
      }
    }
  }
  return out;
}

/** Trạng thái của chuyến trong bảng đón khách */
export function boardingState(t: Trip, conflicts: Set<string>): BoardingState {
  if (!t.boarding) return "pending";
  if (t.boarding.status === "adjusting") return "adjusting";
  return conflicts.has(t.id) ? "conflict" : "assigned";
}

/**
 * Chuyến xuất hiện trong bảng đón khách: đã duyệt, và còn xếp được (chưa quá
 * giờ) hoặc đã có giờ đón trong hôm nay trở đi - xe vào bến muộn hơn giờ trên
 * vé vẫn phải được sắp giờ khác.
 */
export function needsBoarding(t: Trip, now: number): boolean {
  if (t.status !== "active" || t.departure) return false;
  return t.boarding ? t.date >= todayISO() : !isExpired(t, now);
}

/** Nhà xe còn xin điều chỉnh được: chuyến đã duyệt, có giờ đón, chưa xin điều chỉnh, chưa qua ngày */
export function canRequestAdjust(t: Trip): boolean {
  return (
    t.status === "active" &&
    t.boarding?.status === "assigned" &&
    t.date >= todayISO()
  );
}

// mật độ bến

export type BayState = "free" | "busy" | "unavailable";

export interface BayStatus {
  bay: Bay;
  state: BayState;
  /** Mô tả ngắn: chuyến đang giữ vị trí hoặc lý do tạm ngưng */
  detail: string;
}

/** Tình trạng từng vị trí trong cửa sổ đón khách bắt đầu lúc `startAt` */
export function bayStatuses(
  bays: Bay[],
  trips: Trip[],
  adj: BayAdjustment[],
  date: string,
  startAt: string,
  excludeTripId?: string,
): BayStatus[] {
  const start = msOf(date, startAt);
  const end = start + BOARD_MINUTES * MIN;
  const slots = trips
    .filter((t) => t.id !== excludeTripId)
    .map((t) => slotOf(t, adj))
    .filter((s): s is Slot => !!s);

  return bays.map((bay) => {
    const block = blockingAdjustment(bay.id, start, end, adj);
    if (block) {
      return { bay, state: "unavailable", detail: block.reason };
    }
    const taken = slots.find(
      (s) => s.bayId === bay.id && overlap(start, end, s.start, s.end),
    );
    if (taken) {
      return {
        bay,
        state: "busy",
        detail: `${hmOf(taken.start)} - ${hmOf(taken.end)}`,
      };
    }
    return { bay, state: "free", detail: "" };
  });
}

/**
 * Quá tải khi: vị trí tạm ngưng trong cửa sổ đón, vị trí đã có xe khác
 * (cửa sổ của xe đã xếp dời theo điều chỉnh lệch giờ), hoặc tỉ lệ vị trí bận vượt ngưỡng.
 * Quá tải thì trả cảnh báo và không lưu.
 */
export function checkBoarding(args: {
  trip: Trip;
  trips: Trip[];
  bays: Bay[];
  adjustments: BayAdjustment[];
  bayId: string;
  startAt: string;
  now: number;
}): Result {
  const { trip, bays, adjustments, bayId, startAt, now } = args;
  const bay = bays.find((b) => b.id === bayId);
  if (!bay) return fail("Chưa chọn vị trí đón khách.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startAt))
    return fail("Chưa chọn giờ đón khách.");

  const start = msOf(trip.date, startAt);
  if (start < now)
    return fail("Giờ đón khách phải từ thời điểm hiện tại trở đi.");
  // Lần xếp đầu phải bắt đầu đón trước giờ trên vé; điều chỉnh thì được trễ hơn
  if (!trip.boarding && startAt > trip.departAt)
    return fail("Giờ bắt đầu đón khách không được sau giờ khởi hành trên vé.");

  const end = start + BOARD_MINUTES * MIN;
  const window = `${startAt} - ${hmOf(end)}`;
  const status = bayStatuses(
    bays,
    args.trips,
    adjustments,
    trip.date,
    startAt,
    trip.id,
  );
  const mine = status.find((s) => s.bay.id === bayId);

  if (mine?.state === "unavailable")
    return fail(
      `Cảnh báo quá tải: ${bay.code} đang tạm ngưng trong khung ${window} (${mine.detail}).`,
    );
  if (mine?.state === "busy")
    return fail(
      `Cảnh báo quá tải: ${bay.code} đã có xe đón khách trong khung ${window} (xe khác ${mine.detail}).`,
    );

  const used = status.filter((s) => s.state !== "free").length + 1;
  if (used / bays.length > MAX_DENSITY)
    return fail(
      `Cảnh báo quá tải: mật độ bến khung ${window} đạt ${Math.round((used / bays.length) * 100)}% (${used}/${bays.length} vị trí), vượt ngưỡng ${Math.round(MAX_DENSITY * 100)}%. Hãy chọn khung giờ khác.`,
    );
  return ok("");
}

// cập nhật vị trí

/** Kiểm tra biểu mẫu cập nhật vị trí của nhân viên điều độ ngoài trời */
export function checkAdjustment(f: {
  bayIds: string[];
  kind: BayAdjustment["kind"];
  from: string;
  until: string;
  minutes: string;
  reason: string;
}): Result {
  if (f.bayIds.length === 0) return fail("Chưa chọn vị trí nào.");
  if (!f.from) return fail("Chưa chọn thời điểm bắt đầu.");
  if (f.until && f.until <= f.from)
    return fail("Thời điểm kết thúc phải sau thời điểm bắt đầu.");
  if (f.kind === "delay") {
    const m = Number(f.minutes);
    if (!Number.isInteger(m) || m < 1 || m > 120)
      return fail("Số phút lệch phải từ 1 đến 120.");
  }
  if (!f.reason.trim()) return fail("Nhập lý do cập nhật.");
  return ok("");
}
