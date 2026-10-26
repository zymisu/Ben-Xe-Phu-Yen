"use client";

/**
 * UC1 - Màn hình đăng ký tài khoản nhà xe: số điện thoại, mã xác thực, mật khẩu, hồ sơ đơn vị.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, cx, Field, Note, O } from "@/components/ui";
import { ProfileForm } from "@/features/uc03-carriers/ProfileForm";
import { useRegister } from "./logic";

const STEPS = ["Số điện thoại", "Mã xác thực", "Mật khẩu", "Hồ sơ đơn vị"];

export function Register() {
  const f = useRegister();

  return (
    <div className="hien-len">
      <h1 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
        Đăng ký tài khoản
      </h1>
      <p className="mt-2 text-sm text-muted">
        Dành cho đại diện đơn vị vận tải khai thác tuyến tại bến.
      </p>

      <ol className="mt-6 flex items-center gap-1.5">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-1.5">
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
                "hidden text-xs font-semibold lg:inline",
                f.step >= i + 1 ? "text-ink" : "text-muted",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      {f.error && f.step !== 4 && (
        <div className="mt-5">
          <Note tone="danger">{f.error}</Note>
        </div>
      )}

      {/* số điện thoại */}
      {f.step === 1 && (
        <form onSubmit={f.submitPhone} className="hien-len mt-6 space-y-4">
          <Field label="Số điện thoại" required>
            <O
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={f.phone}
              onChange={(e) => f.setPhone(e.target.value)}
              placeholder="0905 123 456"
              autoFocus
              required
            />
          </Field>
          <Button
            variant="chinh"
            type="submit"
            className="w-full"
            disabled={f.sending}
          >
            Nhận mã xác thực
          </Button>
        </form>
      )}

      {/* mã xác thực */}
      {f.step === 2 && (
        <form onSubmit={f.submitCode} className="hien-len mt-6 space-y-4">
          <p className="text-sm text-muted">
            Mã xác thực đã gửi tới số{" "}
            <strong className="tnum text-ink">{f.phone}</strong>.
          </p>
          <Field label="Mã xác thực" required>
            <O
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={f.code}
              onChange={(e) => f.setCode(e.target.value.replace(/\D/g, ""))}
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
              onClick={f.backToPhone}
              className="text-sm text-muted hover:text-ink"
            >
              Đổi số điện thoại
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

      {/* mật khẩu */}
      {f.step === 3 && (
        <form onSubmit={f.submitPassword} className="hien-len mt-6 space-y-4">
          <Field label="Mật khẩu" required hint="Tối thiểu 6 ký tự.">
            <O
              type="password"
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => f.setPassword(e.target.value)}
              autoFocus
              required
            />
          </Field>
          <Field label="Nhập lại mật khẩu" required>
            <O
              type="password"
              autoComplete="new-password"
              value={f.confirm}
              onChange={(e) => f.setConfirm(e.target.value)}
              required
            />
          </Field>
          <Button variant="chinh" type="submit" className="w-full">
            Tiếp tục
          </Button>
        </form>
      )}

      {/* hồ sơ đơn vị */}
      {f.step === 4 && (
        <form onSubmit={f.submitProfile} className="hien-len mt-6 space-y-5">
          <ProfileForm profile={f.profile} setField={f.setField} autoFocus />
          {f.error && <Note tone="danger">{f.error}</Note>}
          <Button variant="chinh" type="submit" className="w-full">
            Gửi hồ sơ đăng ký
          </Button>
        </form>
      )}

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link
          href="/dang-nhap"
          className="font-semibold text-brand hover:opacity-75"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
