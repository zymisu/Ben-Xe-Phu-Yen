/**
 * Trang duyệt xe ra bến (nhân viên điều độ ngoài trời).
 */
import type { Metadata } from "next";
import { GateRequests } from "@/features/uc06-gate/GateRequests";

export const metadata: Metadata = { title: "Xe ra bến" };

export default function Page() {
  return <GateRequests kind="exit" />;
}
