/**
 * Trang nhận báo cáo nhà xe (nhân viên điều độ trong nhà).
 */
import type { Metadata } from "next";
import { Inbox } from "@/features/uc07-yard/reports/inbox/Inbox";

export const metadata: Metadata = { title: "Báo cáo nhà xe" };

export default function Page() {
  return <Inbox />;
}
