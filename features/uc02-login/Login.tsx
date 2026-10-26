"use client";

/**
 * UC2 - Màn hình đăng nhập bằng số điện thoại và mật khẩu.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Button, Field, Note, O } from "@/components/ui";
import { useLogin } from "./logic";

export function Login() {
  const f = useLogin();

  return (
    <div className="hien-len">
      <h1 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
        Đăng nhập
      </h1>
      <p className="mt-2 text-sm text-muted">Nhà xe và nhân viên bến xe.</p>

      <form onSubmit={f.submit} className="mt-6 space-y-4">
        <Field label="Số điện thoại" required>
          <O
            type="tel"
            inputMode="tel"
            value={f.phone}
            onChange={(e) => f.setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="0905 123 456"
            autoFocus
            required
          />
        </Field>

        <Field label="Mật khẩu" required>
          <div className="relative">
            <O
              type={f.showPassword ? "text" : "password"}
              value={f.password}
              onChange={(e) => f.setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-12"
              required
            />
            <button
              type="button"
              onClick={() => f.setShowPassword(!f.showPassword)}
              aria-label={f.showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="cham-duoc absolute top-1/2 right-1 flex -translate-y-1/2 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Icon
                name={f.showPassword ? "eyeOff" : "eye"}
                className="size-4"
              />
            </button>
          </div>
        </Field>

        {f.error && <Note tone="danger">{f.error}</Note>}

        <Button variant="chinh" type="submit" className="w-full">
          Đăng nhập
        </Button>

        <div className="flex justify-center">
          <Link
            href="/quen-mat-khau"
            className="text-sm font-semibold text-brand hover:opacity-75"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link
          href="/dang-ky"
          className="font-semibold text-brand hover:opacity-75"
        >
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
