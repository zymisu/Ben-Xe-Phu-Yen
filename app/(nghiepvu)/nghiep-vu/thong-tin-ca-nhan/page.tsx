/**
 * Trang thông tin cá nhân: chỉnh sửa thông tin liên hệ và đổi mật khẩu.
 */
import type { Metadata } from "next";
import { EditProfile } from "@/features/uc09-account/edit/EditProfile";
import { ChangePassword } from "@/features/uc09-account/password/ChangePassword";

export const metadata: Metadata = { title: "Thông tin cá nhân" };

export default function Page() {
  return (
    <>
      <EditProfile />
      <ChangePassword />
    </>
  );
}
