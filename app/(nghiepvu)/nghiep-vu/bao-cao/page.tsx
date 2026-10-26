/**
 * Trang lập báo cáo gửi bến xe (nhà xe).
 */
import type { Metadata } from "next";
import { Reports } from "@/features/uc07-yard/reports/Reports";

export const metadata: Metadata = { title: "Báo cáo" };

export default function Page() {
  return <Reports />;
}
