"use client";

/**
 * Thông báo nổi ở góc màn hình.
 */
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";
import { cx } from "./ui";

const MAU = {
  ok: "border-ok/30 bg-ok-soft text-ok",
  danger: "border-danger/30 bg-danger-soft text-danger",
  warn: "border-warn/30 bg-warn-soft text-warn",
  info: "border-info/30 bg-info-soft text-info",
} as const;

const BIEU_TUONG = {
  ok: "check",
  danger: "alert",
  warn: "alert",
  info: "info",
} as const;

export function Toaster() {
  const { toasts, closeToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div
      className="khong-in pointer-events-none fixed inset-x-0 top-0 z-[45] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:top-auto sm:right-4 sm:bottom-4 sm:items-end"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            "truot-vao pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-[var(--shadow-lg)] backdrop-blur",
            MAU[t.kind],
          )}
        >
          <Icon name={BIEU_TUONG[t.kind]} className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1 text-sm leading-snug">{t.text}</p>
          <button
            onClick={() => closeToast(t.id)}
            aria-label="Đóng thông báo"
            className="-mr-1 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          >
            <Icon name="close" className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
