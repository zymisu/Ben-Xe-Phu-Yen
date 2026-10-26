"use client";

/**
 * UC2 - Màn hình lấy lại mật khẩu bằng mã OTP.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, cx, Field, Note, O } from "@/components/ui";
import { useForgotPassword } from "./logic";

const STEPS = ["Xác minh", "Mã OTP", "Mật khẩu mới"];

export function ForgotPassword() {
  const f = useForgotPassword();

  return (
    <div className="hien-len">
      <h1 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
        Lấy lại mật khẩu
      </h1>
      <p className="mt-2 text-sm text-muted">
        Nhập email hoặc số điện thoại đã đăng ký để nhận mã OTP.
      </p>

      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cx(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                f.step > i + 1
                  ? "bg-ok text-white"
                  : f.step === i + 1
                    ? "bg-brand text-brand-ink"
                    : "bg-surface-2 text-muted",
              )}
            >
              {f.step > i + 1 ? (
                <Icon name="check" className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <span
              className={cx(
                "hidden text-xs font-semibold sm:inline",
                f.step >= i + 1 ? "text-ink" : "text-muted",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      {f.error && (
        <div className="mt-5">
          <Note tone="danger">{f.error}</Note>
        </div>
      )}

      {f.step === 1 && (
        <form onSubmit={f.submitIdentity} className="hien-len mt-6 space-y-4">
          <Field label="Email hoặc số điện thoại" required>
            <O
              value={f.identity}
              onChange={(e) => f.setIdentity(e.target.value)}
              placeholder="0905 123 456"
              autoFocus
              required
            />
          </Field>
          <Button variant="chinh" type="submit" className="w-full">
            Gửi mã OTP
          </Button>
        </form>
      )}

      {f.step === 2 && (
        <form onSubmit={f.submitOtp} className="hien-len mt-6 space-y-4">
          <p className="text-sm text-muted">
            Mã OTP đã gửi tới <strong className="text-ink">{f.identity}</strong>
            .
          </p>
          <Field label="Mã OTP" required>
            <O
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={f.otp}
              onChange={(e) => f.setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="······"
              className="tnum text-center font-mono text-2xl tracking-[0.5em]"
              autoFocus
              required
            />
          </Field>
          <Button variant="chinh" type="submit" className="w-full">
            Xác nhận
          </Button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={f.backToIdentity}
              className="text-sm text-muted hover:text-ink"
            >
              Nhập lại thông tin
            </button>
            <button
              type="button"
              onClick={f.resend}
              className="text-sm font-semibold text-brand hover:opacity-75"
            >
              Gửi lại mã
            </button>
          </div>
        </form>
      )}

      {f.step === 3 && (
        <form onSubmit={f.submitPassword} className="hien-len mt-6 space-y-4">
          <Field label="Mật khẩu mới" required hint="Tối thiểu 6 ký tự.">
            <O
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => f.setPassword(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label="Nhập lại mật khẩu mới" required>
            <O
              type="password"
              autoComplete="new-password"
              value={f.confirm}
              onChange={(e) => f.setConfirm(e.target.value)}
              required
            />
          </Field>
          <Button variant="chinh" type="submit" className="w-full">
            Cập nhật mật khẩu
          </Button>
        </form>
      )}

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        <Link
          href="/dang-nhap"
          className="font-semibold text-brand hover:opacity-75"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
