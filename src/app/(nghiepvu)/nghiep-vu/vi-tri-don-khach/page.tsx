/**
 * Trang cập nhật vị trí đón khách (nhân viên điều độ ngoài trời).
 */
import type { Metadata } from "next";
import { Bays } from "@/features/uc05-boarding/bays/Bays";

export const metadata: Metadata = { title: "Vị trí đón khách" };

export default function Page() {
  return <Bays />;
}
