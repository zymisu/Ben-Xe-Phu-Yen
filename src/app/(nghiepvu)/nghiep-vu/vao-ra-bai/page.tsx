/**
 * Trang sổ xe vào/ra bãi của nhà xe.
 */
import type { Metadata } from "next";
import { Yard } from "@/features/uc07-yard/Yard";

export const metadata: Metadata = { title: "Vào/ra bãi" };

export default function Page() {
  return <Yard />;
}
