/**
 * Trang đăng ký tài khoản nhà xe.
 */
import type { Metadata } from "next";
import { Register } from "@/features/uc01-register/Register";

export const metadata: Metadata = { title: "Đăng ký tài khoản" };

export default function Page() {
  return <Register />;
}
