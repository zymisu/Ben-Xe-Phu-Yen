"use client";

/** Khung cổng nghiệp vụ sau đăng nhập: thanh bên theo vai trò. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { landingFor } from "@/lib/nav";
import { ORG } from "@/lib/org";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type Role } from "@/types";
import { Icon, Logo } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { Button, cx } from "./ui";

interface Item {
  label: string;
  href: string;
  icon: string;
  roles: Role[];
}

const ALL: Role[] = [
  "carrier",
  "reception",
  "indoor",
  "outdoor",
  "security",
  "admin",
];

const NAV: Item[] = [
  {
    label: "Hồ sơ nhà xe",
    href: "/nghiep-vu/ho-so-nha-xe",
    icon: "checklist",
    roles: ["reception"],
  },
  {
    label: "Tiếp nhận chuyến xe",
    href: "/nghiep-vu/tiep-nhan-chuyen",
    icon: "bus",
    roles: ["reception"],
  },
  {
    label: "Đón khách",
    href: "/nghiep-vu/don-khach",
    icon: "bus",
    roles: ["indoor"],
  },
  {
    label: "Vị trí đón khách",
    href: "/nghiep-vu/vi-tri-don-khach",
    icon: "pin",
    roles: ["outdoor"],
  },
  {
    label: "Xe vào bến",
    href: "/nghiep-vu/xe-vao-ben",
    icon: "bus",
    roles: ["outdoor"],
  },
  {
    label: "Kiểm tra xuất bến",
    href: "/nghiep-vu/kiem-tra-xuat-ben",
    icon: "checklist",
    roles: ["security"],
  },
  {
    label: "Xe ra bến",
    href: "/nghiep-vu/xe-ra-ben",
    icon: "bus",
    roles: ["outdoor"],
  },
  {
    label: "Biên bản vi phạm",
    href: "/nghiep-vu/bien-ban",
    icon: "file",
    roles: ["security"],
  },
  {
    label: "Báo cáo nhà xe",
    href: "/nghiep-vu/bao-cao-nha-xe",
    icon: "file",
    roles: ["indoor"],
  },
  {
    label: "Hồ sơ đơn vị",
    href: "/nghiep-vu/ho-so-don-vi",
    icon: "file",
    roles: ["carrier"],
  },
  {
    label: "Chuyến xe",
    href: "/nghiep-vu/chuyen-xe",
    icon: "bus",
    roles: ["carrier"],
  },
  {
    label: "Vào/ra bãi",
    href: "/nghiep-vu/vao-ra-bai",
    icon: "clock",
    roles: ["carrier"],
  },
  {
    label: "Báo cáo",
    href: "/nghiep-vu/bao-cao",
    icon: "file",
    roles: ["carrier"],
  },
  {
    label: "Quản lý tài khoản",
    href: "/nghiep-vu/tai-khoan",
    icon: "users",
    roles: ["admin"],
  },
  {
    label: "Báo cáo, thống kê",
    href: "/nghiep-vu/bao-cao-thong-ke",
    icon: "chart",
    roles: ["admin"],
  },
  {
    label: "Thông báo",
    href: "/nghiep-vu/thong-bao",
    icon: "mail",
    roles: ALL,
  },
  {
    label: "Thông tin cá nhân",
    href: "/nghiep-vu/thong-tin-ca-nhan",
    icon: "user",
    roles: ALL,
  },
];

export function PortalShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, data, toast } = useStore();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const items = user ? NAV.filter((n) => n.roles.includes(user.role)) : [];

  const unread = useMemo(
    () =>
      user
        ? data.notifications.filter((n) => n.accountId === user.id && !n.read)
        : [],
    [data.notifications, user],
  );

  // Thông báo mới gửi tới tài khoản đang đăng nhập thì hiện ngay, mỗi thông báo một lần
  const seen = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!ready || !user) return;
    if (seen.current === null) {
      seen.current = new Set(unread.map((n) => n.id));
      return;
    }
    for (const n of unread) {
      if (seen.current.has(n.id)) continue;
      seen.current.add(n.id);
      toast("info", n.title);
    }
  }, [ready, user, unread, toast]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/dang-nhap");
      return;
    }
    // Vào thẳng đường dẫn của vai trò khác thì đưa về đúng trang của mình
    const allowed = NAV.find((n) => n.href === path);
    if (allowed && !allowed.roles.includes(user.role)) {
      router.replace(landingFor(user.role));
    }
  }, [ready, user, path, router]);

  if (!ready || !user) return null;

  const nav = (
    <nav className="space-y-1">
      {items.map((n) => {
        const active = path === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cx(
              "cham-duoc flex items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors",
              active
                ? "bg-brand-soft text-brand-soft-ink"
                : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon name={n.icon} className="size-4 shrink-0" />
            {n.label}
            {n.href === "/nghiep-vu/thong-bao" && unread.length > 0 && (
              <span className="tnum ml-auto rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-brand-ink">
                {unread.length}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const identity = (
    <div className="border-t border-line pt-4">
      <p className="truncate text-sm font-semibold text-ink">
        {user.fullName || user.phone}
      </p>
      <p className="mt-0.5 text-xs text-muted">{ROLE_LABEL[user.role]}</p>
      <Button variant="sub" onClick={logout} className="mt-3 w-full" small>
        <Icon name="logIn" className="size-4 rotate-180" />
        Đăng xuất
      </Button>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        {ORG.name}
        <br />
        {ORG.address}
        <br />
        MST {ORG.taxCode} · {ORG.authority}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-surface-2">
      {/* thanh bên trên máy tính */}
      <aside className="khong-in sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card px-4 py-5 lg:flex">
        <Link
          href={landingFor(user.role)}
          className="flex items-center gap-2.5"
        >
          <Logo className="size-9 shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-sm font-bold text-ink">
              {ORG.shortName}
            </span>
            <span className="block text-[11px] tracking-wide text-muted uppercase">
              Cổng nghiệp vụ
            </span>
          </span>
        </Link>
        <div className="mt-6 flex-1">{nav}</div>
        {identity}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* thanh trên điện thoại */}
        <header className="khong-in sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-card/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setOpen(!open)}
            aria-label="Mở menu"
            aria-expanded={open}
            className="cham-duoc flex items-center justify-center rounded-xl border border-line text-muted transition-colors active:bg-surface-2"
          >
            <Icon name={open ? "close" : "menu"} className="size-5" />
          </button>
          <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-ink">
            {ORG.shortName}
          </span>
          <ThemeToggle />
        </header>

        {open && (
          <div className="hien-len border-b border-line bg-card px-4 py-4 lg:hidden">
            {nav}
            <div className="mt-4">{identity}</div>
          </div>
        )}

        <main
          id="noi-dung"
          className="mb-thanh-duoi flex-1 px-4 py-5 sm:px-6 sm:py-7"
        >
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>

        <div className="khong-in hidden justify-end px-6 pb-5 lg:flex">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
