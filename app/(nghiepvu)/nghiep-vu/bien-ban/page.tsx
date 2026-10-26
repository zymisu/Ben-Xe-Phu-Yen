/**
 * Trang biên bản vi phạm tại bãi (nhân viên an ninh trật tự).
 */
import type { Metadata } from "next";
import { Violations } from "@/features/uc06-gate/violations/Violations";

export const metadata: Metadata = { title: "Biên bản vi phạm" };

export default function Page() {
  return <Violations />;
}
