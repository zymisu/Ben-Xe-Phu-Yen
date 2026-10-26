"use client";

/** UC9.2 - Đổi mật khẩu bằng mật khẩu hiện tại. */
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fail, ok, type Account, type Data, type Result } from "@/types";
import { checkPassword } from "../../uc01-register/logic";

export interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

const empty: PasswordForm = { current: "", next: "", confirm: "" };

/** Báo riêng hai lỗi: mật khẩu hiện tại sai và mật khẩu mới không hợp lệ */
export function checkChange(account: Account, f: PasswordForm): Result {
  if (f.current !== account.password)
    return fail("Mật khẩu hiện tại không đúng.");
  const res = checkPassword(f.next, f.confirm);
  if (!res.ok) return res;
  if (f.next === f.current)
    return fail("Mật khẩu mới phải khác mật khẩu hiện tại.");
  return ok("");
}

/** Lưu mật khẩu mới */
export function savePassword(
  data: Data,
  accountId: string,
  next: string,
): Data {
  return {
    ...data,
    accounts: data.accounts.map((a) =>
      a.id === accountId ? { ...a, password: next } : a,
    ),
  };
}

export function useChangePassword() {
  const { user, update, toast } = useStore();

  const [form, setForm] = useState<PasswordForm>(empty);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  function setField<K extends keyof PasswordForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const res = checkChange(user, form);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => savePassword(d, user.id, form.next));
    toast("ok", "Đổi mật khẩu thành công.");
    setForm(empty);
  }

  return { form, error, show, setShow, setField, submit };
}
