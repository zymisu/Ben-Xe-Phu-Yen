/**
 * Tiện ích cho dữ liệu mẫu: bộ sinh số ngẫu nhiên có hạt giống (để dữ liệu ổn
 * định giữa các lần nạp) và các hàm thời gian neo vào thời điểm nạp.
 */
import { toISODate } from "../format";

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export type Rnd = () => number;

/** mulberry32: bộ sinh số giả ngẫu nhiên nhỏ gọn, cùng hạt giống cho cùng chuỗi */
export function mulberry32(seed: number): Rnd {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(r: Rnd, list: readonly T[]): T =>
  list[Math.floor(r() * list.length)];

/** Số nguyên ngẫu nhiên trong khoảng [lo, hi] */
export const between = (r: Rnd, lo: number, hi: number): number =>
  lo + Math.floor(r() * (hi - lo + 1));

export const chance = (r: Rnd, p: number): boolean => r() < p;

/** Ngày (YYYY-MM-DD) cách hôm nay `offset` ngày; âm là quá khứ */
export function dayOf(now: number, offset: number): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return toISODate(d);
}

/** Thời điểm (mili giây) của giờ HH:MM trong ngày `date` */
export const at = (date: string, hm: string): number =>
  new Date(`${date}T${hm}:00`).getTime();

/** Làm tròn về bội số 5 phút gần nhất */
export const round5 = (ms: number): number =>
  Math.round(ms / (5 * MIN)) * 5 * MIN;

const pad = (n: number) => String(n).padStart(2, "0");

export const hm = (ms: number): string => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Ngày theo giờ máy của một thời điểm */
export const dateOf = (ms: number): string => toISODate(new Date(ms));

export const stamp = (ms: number): string => `${dateOf(ms)}T${hm(ms)}`;
