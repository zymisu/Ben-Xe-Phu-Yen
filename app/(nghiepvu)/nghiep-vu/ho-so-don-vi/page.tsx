/**
 * Trang hồ sơ đơn vị của nhà xe.
 */
import type { Metadata } from "next";
import { MyDossier } from "@/features/uc03-carriers/my-dossier/MyDossier";

export const metadata: Metadata = { title: "Hồ sơ đơn vị" };

export default function Page() {
  return <MyDossier />;
}
