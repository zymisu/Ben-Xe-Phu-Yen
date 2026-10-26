/**
 * Trang tiếp nhận, phê duyệt hồ sơ nhà xe.
 */
import type { Metadata } from "next";
import { Dossiers } from "@/features/uc03-carriers/Dossiers";

export const metadata: Metadata = { title: "Hồ sơ nhà xe" };

export default function Page() {
  return <Dossiers />;
}
