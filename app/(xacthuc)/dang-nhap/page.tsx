/**
 * Trang đăng nhập.
 */
import type { Metadata } from "next";
import { Login } from "@/features/uc02-login/Login";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function Page() {
  return <Login />;
}
