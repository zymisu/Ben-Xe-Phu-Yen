/**
 * Danh mục điều hướng cổng nghiệp vụ và trang đầu tiên của từng vai trò.
 */
import type { Role } from "@/types";

/** Trang đích sau khi đăng nhập, theo vai trò của tài khoản */
export function landingFor(role: Role): string {
  switch (role) {
    case "carrier":
      return "/nghiep-vu/ho-so-don-vi";
    case "reception":
      return "/nghiep-vu/ho-so-nha-xe";
    case "admin":
      return "/nghiep-vu/tai-khoan";
    case "indoor":
      return "/nghiep-vu/don-khach";
    case "outdoor":
      return "/nghiep-vu/vi-tri-don-khach";
    case "security":
      return "/nghiep-vu/kiem-tra-xuat-ben";
    default:
      return "/";
  }
}
