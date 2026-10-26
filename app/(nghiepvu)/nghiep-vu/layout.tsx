/**
 * Khung cổng nghiệp vụ: thanh bên và kiểm tra quyền truy cập theo vai trò.
 */
import { PortalShell } from "@/components/PortalShell";

export default function NghiepVuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
