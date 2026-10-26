"use client";

/**
 * UC9.2 - Biểu mẫu đổi mật khẩu.
 */
import { Icon } from "@/components/Icon";
import { Button, CardTitle, Field, Note, O, The } from "@/components/ui";
import { useChangePassword } from "./logic";

export function ChangePassword() {
  const f = useChangePassword();
  const type = f.show ? "text" : "password";

  return (
    <The className="mt-4 max-w-lg">
      <CardTitle desc="Nhập mật khẩu hiện tại để đặt mật khẩu mới.">
        Đổi mật khẩu
      </CardTitle>
      <form onSubmit={f.submit} noValidate className="space-y-4">
        <Field label="Mật khẩu hiện tại" required>
          <O
            type={type}
            autoComplete="current-password"
            value={f.form.current}
            onChange={(e) => f.setField("current", e.target.value)}
          />
        </Field>
        <Field label="Mật khẩu mới" required hint="Tối thiểu 6 ký tự.">
          <O
            type={type}
            autoComplete="new-password"
            value={f.form.next}
            onChange={(e) => f.setField("next", e.target.value)}
          />
        </Field>
        <Field label="Nhập lại mật khẩu mới" required>
          <O
            type={type}
            autoComplete="new-password"
            value={f.form.confirm}
            onChange={(e) => f.setField("confirm", e.target.value)}
          />
        </Field>

        <div>
          <button
            type="button"
            onClick={() => f.setShow(!f.show)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
          >
            <Icon name={f.show ? "eyeOff" : "eye"} className="size-4" />
            {f.show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          </button>
        </div>

        {f.error && <Note tone="danger">{f.error}</Note>}

        <Button variant="chinh" type="submit" className="w-full sm:w-auto">
          Đổi mật khẩu
        </Button>
      </form>
    </The>
  );
}
