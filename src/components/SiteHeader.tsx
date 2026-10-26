"use client";

/**
 * Đầu trang công khai: tên đơn vị, điều hướng và nút đăng nhập, đăng ký.
 */
import Link from "next/link";
import { useState } from "react";
import { landingFor } from "@/lib/nav";
import { ORG } from "@/lib/org";
import { useStore } from "@/lib/store";
import { Icon, Logo } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { Button, cx } from "./ui";

/** Trang chủ là trang duy nhất nên điều hướng trỏ tới các mục trong trang */
const NAV = [
  { label: "Lịch xe", href: "#lich-xe" },
  { label: "Tuyến vận tải", href: "#tuyen" },
  { label: "Dịch vụ", href: "#dich-vu" },
  { label: "Thông báo", href: "#thong-bao" },
  { label: "Liên hệ", href: "#lien-he" },
];

export function SiteHeader() {
  const { user, ready, logout } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <header className="khong-in sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2.5">
          <Logo className="size-9 shrink-0 sm:size-10" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-bold text-ink sm:text-base">
              {ORG.shortName}
            </span>
            <span className="hidden text-[11px] tracking-wide text-muted uppercase sm:block">
              {ORG.authority}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-3">
          <ThemeToggle />

          {ready && user ? (
            <div className="flex items-center gap-2 max-sm:hidden">
              <Link href={landingFor(user.role)}>
                <Button variant="sub">Cổng nghiệp vụ</Button>
              </Link>
              <Button variant="nhe" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 max-sm:hidden">
              <Link href="/dang-ky">
                <Button variant="sub">Đăng ký</Button>
              </Link>
              <Link href="/dang-nhap">
                <Button variant="chinh">Đăng nhập</Button>
              </Link>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            aria-label="Mở menu"
            aria-expanded={open}
            className="cham-duoc flex items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="hien-len border-t border-line bg-card px-4 pb-4 lg:hidden">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cx(
                "cham-duoc flex items-center rounded-xl px-3 text-sm font-medium text-ink",
                "transition-colors active:bg-surface-2",
              )}
            >
              {n.label}
            </a>
          ))}
          {ready && user ? (
            <div className="mt-2 space-y-2">
              <Link
                href={landingFor(user.role)}
                onClick={() => setOpen(false)}
                className="block"
              >
                <Button variant="chinh" className="w-full">
                  Cổng nghiệp vụ
                </Button>
              </Link>
              <Button
                variant="sub"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full"
              >
                Đăng xuất
              </Button>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/dang-ky"
                onClick={() => setOpen(false)}
                className="block"
              >
                <Button variant="sub" className="w-full">
                  Đăng ký
                </Button>
              </Link>
              <Link
                href="/dang-nhap"
                onClick={() => setOpen(false)}
                className="block"
              >
                <Button variant="chinh" className="w-full">
                  Đăng nhập
                </Button>
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
