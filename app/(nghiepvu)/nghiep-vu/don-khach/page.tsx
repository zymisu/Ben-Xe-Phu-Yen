/**
 * Trang sắp xếp xe đón khách (nhân viên điều độ trong nhà).
 */
import type { Metadata } from "next";
import { Boarding } from "@/features/uc05-boarding/Boarding";

export const metadata: Metadata = { title: "Đón khách" };

export default function Page() {
  return <Boarding />;
}
