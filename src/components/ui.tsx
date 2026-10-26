"use client";

/**
 * Các thành phần giao diện dùng chung: nhãn, nút, trường nhập, bảng, hộp thoại, thẻ số liệu.
 */
import {
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import type { Tone } from "@/types";
import { Icon } from "./Icon";

export function cx(...v: Array<string | false | null | undefined>): string {
  return v.filter(Boolean).join(" ");
}

// Nhãn/badge

const MAU_SAC_THAI: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok border-ok/25",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  info: "bg-info-soft text-info border-info/25",
  neutral: "bg-neutral-soft text-neutral border-neutral/25",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap",
        MAU_SAC_THAI[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// Thẻ

export function The({
  children,
  className,
  pad = true,
}: {
  children: ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-[18px] border border-line bg-card",
        pad && "p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  desc,
  phai,
}: {
  children: ReactNode;
  desc?: ReactNode;
  phai?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-base font-bold text-ink">
          {children}
        </h3>
        {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      </div>
      {phai}
    </div>
  );
}

// Nút

type ButtonVariant = "chinh" | "sub" | "nhe" | "nguy" | "ok";

const KIEU_NUT: Record<ButtonVariant, string> = {
  chinh: "bg-brand text-brand-ink hover:bg-brand-hover border-transparent",
  sub: "bg-card text-ink border-line-strong hover:bg-surface-2",
  nhe: "bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-ink",
  nguy: "bg-danger text-white border-transparent hover:opacity-90",
  ok: "bg-ok text-white border-transparent hover:opacity-90",
};

export function Button({
  variant = "sub",
  small = false,
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  small?: boolean;
}) {
  return (
    <button
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold whitespace-nowrap transition-all duration-200",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.96] active:shadow-none disabled:pointer-events-none disabled:opacity-45",
        // Vùng bấm đủ rộng cho ngón tay, thu lại ở màn hình lớn dùng chuột
        small
          ? "min-h-9 px-3 py-1.5 text-xs sm:min-h-0"
          : "min-h-11 px-4 py-2.5 text-sm sm:min-h-10",
        KIEU_NUT[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

// Trường nhập

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-xs font-medium text-danger">
          {error}
        </span>
      )}
    </label>
  );
}

const O_NHAP =
  "w-full min-h-11 sm:min-h-10 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 " +
  "text-ink placeholder:text-muted/70 transition-colors focus:border-brand focus:outline-none " +
  "focus:ring-4 focus:ring-brand/12 disabled:opacity-60";

export function O(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cx(O_NHAP, p.className)} />;
}

export function Select({
  children,
  ...p
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select {...p} className={cx(O_NHAP, "cursor-pointer", p.className)}>
      {children}
    </select>
  );
}

export function Textarea(p: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...p}
      rows={p.rows ?? 3}
      className={cx(O_NHAP, "resize-y", p.className)}
    />
  );
}

/* ================================================================= Bảng
   Dưới 1024px mỗi hàng đổ thành một thẻ xếp dọc; từ 1024px là dạng bảng.
   Mỗi <Td> truyền `label` để màn hình hẹp còn biết ô đó là cột gì.
   ------------------------------------------------------------------ */

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "lg:overflow-x-auto lg:rounded-[18px] lg:border lg:border-line lg:bg-card",
        className,
      )}
    >
      <table className="w-full text-sm max-lg:block">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cx(
        "border-b border-line bg-surface-2 px-3 py-3 text-left text-xs font-bold tracking-wide text-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
  label,
  clip = true,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  /** Nội dung dài bị cắt bằng "..." ở đuôi; tắt cho ô chứa nút bấm */
  clip?: boolean;
  /** Tên cột, chỉ hiện ở màn hình hẹp khi hàng đã đổ thành thẻ */
  label?: string;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cx(
        "px-3 py-3 align-middle lg:border-b lg:border-line",
        "max-lg:flex max-lg:items-baseline max-lg:justify-between max-lg:gap-4 max-lg:px-0 max-lg:py-1.5 max-lg:text-right",
        className,
      )}
    >
      {label && (
        <span className="shrink-0 text-xs font-semibold tracking-wide text-muted uppercase lg:hidden">
          {label}
        </span>
      )}
      <div
        className={cx(
          "max-lg:min-w-0",
          clip && "ellip lg:max-w-[17rem] max-lg:max-w-[70%]",
        )}
      >
        {children}
      </div>
    </td>
  );
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cx(
        "transition-colors lg:hover:bg-surface-2/60",
        "max-lg:mb-3 max-lg:block max-lg:rounded-[18px] max-lg:border max-lg:border-line max-lg:bg-card max-lg:p-4",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/** Hàng tiêu đề - ẩn hẳn khi bảng đã đổ thành thẻ */
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="max-lg:hidden">
      <tr>{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="max-lg:block">{children}</tbody>;
}

// Rỗng

export function Empty({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-line px-6 py-14 text-center sm:py-20">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon name="checklist" className="size-5" />
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-muted">{desc}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

/* ============================================================ Hộp thoại
   Dưới 640px trượt lên từ đáy màn hình; từ 640px là hộp giữa màn hình.
   ------------------------------------------------------------------ */

export function Dialog({
  open,
  close,
  title,
  desc,
  children,
  footer,
  notice,
  size = "md",
}: {
  open: boolean;
  close: () => void;
  title: string;
  desc?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Dải thông báo cố định giữa nội dung và chân hộp, luôn thấy khi cuộn */
  notice?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();

  // Giữ hàm đóng mới nhất trong ref để hiệu ứng chỉ chạy khi hộp mở hoặc đóng;
  // nếu không, mỗi lần gõ phím sẽ chạy lại và giật tiêu điểm khỏi ô đang nhập.
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;
  const w = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-[2px] sm:items-center sm:p-4">
      <button
        aria-label="Đóng"
        className="absolute inset-0 cursor-default"
        onClick={close}
        tabIndex={-1}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tid}
        tabIndex={-1}
        className={cx(
          "truot-len relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-card shadow-[var(--shadow-lg)]",
          "sm:max-h-[86dvh] sm:rounded-[20px]",
          w,
        )}
      >
        {/* tay nắm kéo, dấu hiệu quen thuộc của tấm trượt trên điện thoại */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line-strong" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-4 px-5 py-4">
          <div>
            <h2 id={tid} className="font-display text-lg font-bold text-ink">
              {title}
            </h2>
            {desc && <p className="mt-0.5 text-sm text-muted">{desc}</p>}
          </div>
          <button
            onClick={close}
            aria-label="Đóng hộp thoại"
            className="cham-duoc -mt-1 -mr-2 flex items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-5 py-5">
          {children}
        </div>

        {notice && (
          <div className="shrink-0 border-t border-line px-5 py-3">
            {notice}
          </div>
        )}

        {footer && (
          <div className="pb-an-toan flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-surface-2/50 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Đầu trang

export function PageHeader({
  branch,
  title,
  desc,
  phai,
}: {
  branch: string;
  title: string;
  desc?: string;
  phai?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
          <Icon name="grid" className="size-3.5" />
          {branch}
        </p>
        <h1 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
          {title}
        </h1>
        {desc && <p className="mt-2 max-w-2xl text-sm text-muted">{desc}</p>}
      </div>
      {phai && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">{phai}</div>
      )}
    </div>
  );
}

// Thẻ số liệu

export function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-line bg-card p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          {label}
        </p>
        {icon && (
          <span className={cx("rounded-lg border-0 p-1.5", MAU_SAC_THAI[tone])}>
            {icon}
          </span>
        )}
      </div>
      <p
        className={cx(
          "tnum mt-3 font-display font-extrabold text-ink",
          // Giá trị dạng chữ dài (tên, cụm từ) dùng cỡ nhỏ để không tràn thẻ
          typeof value === "string" && value.length > 8
            ? "text-lg leading-snug"
            : "text-[30px] leading-none sm:text-[34px]",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

// Hộp lưu ý

export function Note({
  tone = "info",
  title,
  children,
}: {
  tone?: Tone;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-[14px] border px-4 py-3 text-sm",
        MAU_SAC_THAI[tone],
      )}
    >
      {title && <p className="mb-1 font-bold">{title}</p>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}
