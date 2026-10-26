"use client";

/**
 * Khung cho đăng nhập, đăng ký, lấy lại mật khẩu: một cột căn giữa.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon, Logo } from "@/components/Icon";
import { ORG } from "@/lib/org";

export default function XacThucLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Trang đăng ký có thêm phần khai hồ sơ đơn vị nên cần khung rộng hơn
  const wide = usePathname() === "/dang-ky";

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Logo className="size-9 shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-bold text-ink">
              {ORG.shortName}
            </span>
            <span className="hidden text-[11px] tracking-wide text-muted uppercase sm:block">
              Cổng nghiệp vụ nội bộ
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
          >
            <Icon name="logIn" className="size-4 rotate-180" />
            Về trang chủ
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main
        id="noi-dung"
        className="flex flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10"
      >
        <div className={wide ? "w-full max-w-2xl" : "w-full max-w-md"}>
          <div className="rounded-[20px] border border-line bg-card p-5 sm:p-7">
            {children}
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            {ORG.name} · MST {ORG.taxCode}
            <br />
            Cơ quan chủ quản: {ORG.authority}
          </p>
        </div>
      </main>
    </div>
  );
}
