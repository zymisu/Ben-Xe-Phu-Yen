/**
 * Trang lấy lại mật khẩu.
 */
import type { Metadata } from "next";
import { ForgotPassword } from "@/features/uc02-login/forgot-password/ForgotPassword";

export const metadata: Metadata = { title: "Lấy lại mật khẩu" };

export default function Page() {
  return <ForgotPassword />;
}
