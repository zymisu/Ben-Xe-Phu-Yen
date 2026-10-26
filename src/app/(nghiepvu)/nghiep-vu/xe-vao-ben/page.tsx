/**
 * Trang duyệt xe vào bến (nhân viên điều độ ngoài trời).
 */
import type { Metadata } from "next";
import { GateRequests } from "@/features/uc06-gate/GateRequests";

export const metadata: Metadata = { title: "Xe vào bến" };

export default function Page() {
  return <GateRequests />;
}
