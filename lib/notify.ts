/**
 * Tạo thông báo gửi tới tài khoản.
 */
import { localDateTime } from "./format";
import type { ReportTable } from "@/features/uc11-statistics/reports";
import type { Data } from "@/types";

/** Gửi một thông báo tới tài khoản; tài khoản đang đăng nhập sẽ thấy ngay */
export function notify(
  data: Data,
  accountId: string,
  title: string,
  text: string,
  report?: ReportTable,
): Data {
  const now = Date.now();
  return {
    ...data,
    notifications: [
      ...data.notifications,
      {
        id: `tb-${accountId}-${now}-${data.notifications.length}`,
        accountId,
        title,
        text,
        createdAt: localDateTime(now),
        read: false,
        ...(report ? { report } : {}),
      },
    ],
  };
}
