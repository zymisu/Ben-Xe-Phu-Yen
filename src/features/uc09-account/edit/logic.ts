"use client";

/** UC9.1 - Chỉnh sửa thư điện tử và địa chỉ liên hệ. */
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fail, ok, type Account, type Data, type Result } from "@/types";

const EMAIL = /^\S+@\S+\.\S+$/;
export const ADDRESS_MAX = 200;

export interface EditForm {
  email: string;
  address: string;
}

const INVALID = "Dữ liệu không hợp lệ: ";

export const toForm = (a: Account): EditForm => ({
  email: a.email,
  address: a.address,
});

/** Định dạng thư điện tử, độ dài địa chỉ, và phải có thay đổi */
export function checkEdit(current: Account, f: EditForm): Result {
  const email = f.email.trim();
  const address = f.address.trim();
  if (email && !EMAIL.test(email))
    return fail(`${INVALID}thư điện tử sai định dạng.`);
  if (address.length > ADDRESS_MAX)
    return fail(`${INVALID}địa chỉ tối đa ${ADDRESS_MAX} ký tự.`);
  if (email === current.email && address === current.address)
    return fail(`${INVALID}không có thay đổi nào để lưu.`);
  return ok("");
}

/** Lưu; chỉ ghi đúng hai trường được phép sửa */
export function saveEdit(data: Data, accountId: string, f: EditForm): Data {
  return {
    ...data,
    accounts: data.accounts.map((a) =>
      a.id === accountId
        ? { ...a, email: f.email.trim(), address: f.address.trim() }
        : a,
    ),
  };
}

export function useEditProfile() {
  const { user, data, update, toast } = useStore();
  const dossier = data.dossiers.find((d) => d.accountId === user?.id) ?? null;

  const [form, setForm] = useState<EditForm | null>(null);
  const [error, setError] = useState("");

  /** Mở biểu mẫu với giá trị hiện tại */
  function begin() {
    if (!user) return;
    setForm(toForm(user));
    setError("");
  }

  function cancel() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !form) return;
    const res = checkEdit(user, form);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => saveEdit(d, user.id, form));
    toast("ok", "Cập nhật thông tin cá nhân thành công.");
    cancel();
  }

  return { user, dossier, form, error, begin, cancel, setField, submit };
}
