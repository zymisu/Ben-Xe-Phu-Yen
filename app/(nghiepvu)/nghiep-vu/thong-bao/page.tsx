/**
 * Trang thông báo của người dùng đang đăng nhập.
 */
import type { Metadata } from "next";
import { Notifications } from "@/features/notifications/Notifications";

export const metadata: Metadata = { title: "Thông báo" };

export default function Page() {
  return <Notifications />;
}
