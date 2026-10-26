/**
 * Hàm định dạng ngày giờ và tra cứu văn bản dùng chung (theo giờ địa phương).
 */
export function money(n?: number): string {
  if (n === undefined || n === null) return "-";
  return n.toLocaleString("vi-VN") + " ₫";
}

export function formatDate(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Ngày hôm nay theo giờ máy, dạng YYYY-MM-DD */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Ngày theo giờ máy dạng YYYY-MM-DD (toISOString lệch một ngày ở múi giờ +7) */
export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Số ngày từ hôm nay tới ngày cho trước (âm nếu đã qua) */
export function daysUntil(iso: string): number {
  const a = new Date(`${todayISO()}T00:00:00`).getTime();
  const b = new Date(`${iso}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

export function formatTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${formatTime(iso)} · ${formatDate(iso)}`;
}

export function weekday(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const list = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return list[d.getDay()];
}

export function formatDuration(p: number): string {
  const h = Math.floor(p / 60);
  const m = p % 60;
  return m ? `${h} giờ ${m} phút` : `${h} giờ`;
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu */
export function stripTones(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

export function matches(chuoi: string, query: string): boolean {
  if (!query.trim()) return true;
  return stripTones(chuoi).includes(stripTones(query.trim()));
}

/** Giờ HH:MM theo giờ máy của một thời điểm */
export function hmOf(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Dạng YYYY-MM-DDTHH:MM theo giờ máy, dùng cho thời điểm hiệu lực của điều chỉnh */
export function localDateTime(ms: number): string {
  return `${toISODate(new Date(ms))}T${hmOf(ms)}`;
}
