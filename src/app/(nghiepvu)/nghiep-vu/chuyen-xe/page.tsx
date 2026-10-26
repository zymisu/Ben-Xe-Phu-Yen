/**
 * Trang quản lý chuyến xe của nhà xe.
 */
import type { Metadata } from "next";
import { Trips } from "@/features/uc04-trips/Trips";

export const metadata: Metadata = { title: "Chuyến xe" };

export default function Page() {
  return <Trips />;
}
