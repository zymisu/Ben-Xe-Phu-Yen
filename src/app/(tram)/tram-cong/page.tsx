/**
 * Trang trạm cổng: mô phỏng đầu đọc thẻ và camera tại cổng bến.
 */
import type { Metadata } from "next";
import { Kiosk } from "@/features/uc06-gate/kiosk/Kiosk";

export const metadata: Metadata = { title: "Trạm cổng" };

export default function Page() {
  return (
    <main id="noi-dung">
      <Kiosk />
    </main>
  );
}
