/**
 * Khung các trang công khai: đầu trang, nội dung và chân trang của bến xe.
 */
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function CongLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="noi-dung" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
