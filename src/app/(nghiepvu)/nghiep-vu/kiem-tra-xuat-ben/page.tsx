/**
 * Trang kiểm tra xe xuất bến (nhân viên an ninh trật tự).
 */
import type { Metadata } from "next";
import { Inspections } from "@/features/uc08-departure/Inspections";

export const metadata: Metadata = { title: "Kiểm tra xuất bến" };

export default function Page() {
  return <Inspections />;
}
