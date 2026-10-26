/**
 * Trang tiếp nhận, duyệt chuyến xe (nhân viên tiếp nhận đăng ký).
 */
import type { Metadata } from "next";
import { TripRequests } from "@/features/uc04-trips/receiving/TripRequests";

export const metadata: Metadata = { title: "Tiếp nhận chuyến xe" };

export default function Page() {
  return <TripRequests />;
}
