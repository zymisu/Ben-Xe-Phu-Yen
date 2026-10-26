/**
 * Khung gốc của ứng dụng: phông chữ, nhà cung cấp dữ liệu, thông báo nổi.
 */
import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/Toaster";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { ORG } from "@/lib/org";

/** Phông chữ dùng chung toàn hệ thống */
const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${ORG.name} - Hệ thống tiếp nhận đăng ký và điều phối xe xuất bến`,
    template: `%s · ${ORG.shortName}`,
  },
  description:
    "Hệ thống quản lý tiếp nhận đăng ký và điều phối lịch trình xe xuất bến của Bến xe Liên tỉnh Phú Yên - đơn vị trực thuộc Sở Giao thông vận tải tỉnh Phú Yên.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#00843d" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1310" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${beVietnam.variable} antialiased`}>
        <a
          href="#noi-ok"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-xl focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-brand-ink"
        >
          Bỏ qua, tới nội dung chính
        </a>
        <StoreProvider>
          {children}
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  );
}
