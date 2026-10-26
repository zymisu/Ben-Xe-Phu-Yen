/**
 * Trang báo cáo, thống kê (quản trị viên).
 */
import type { Metadata } from "next";
import { Statistics } from "@/features/uc11-statistics/Statistics";

export const metadata: Metadata = { title: "Báo cáo, thống kê" };

export default function Page() {
  return <Statistics />;
}
