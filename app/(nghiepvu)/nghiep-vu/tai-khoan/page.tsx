/**
 * Trang quản lý tài khoản nhân viên (quản trị viên).
 */
import type { Metadata } from "next";
import { Accounts } from "@/features/uc10-accounts/Accounts";

export const metadata: Metadata = { title: "Quản lý tài khoản" };

export default function Page() {
  return <Accounts />;
}
