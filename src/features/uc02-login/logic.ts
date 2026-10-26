"use client";

/**
 * UC2 - Đăng nhập bằng số điện thoại và mật khẩu; báo riêng hai lỗi số chưa đăng ký và sai mật khẩu.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { landingFor } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { fail, ok, type Account, type Data, type Result } from "@/types";

/** Số điện thoại người dùng gõ có thể kèm khoảng trắng hoặc đầu số +84 */
export function normalizePhone(phone: string): string {
  const s = phone.replace(/\s/g, "");
  return s.startsWith("+84") ? `0${s.slice(3)}` : s;
}

/** Báo riêng hai lỗi: số chưa đăng ký và sai mật khẩu */
export function authenticate(
  data: Data,
  phone: string,
  password: string,
): Result<Account> {
  const key = normalizePhone(phone);
  const account = data.accounts.find((a) => normalizePhone(a.phone) === key);
  if (!account) return fail("Số điện thoại chưa được đăng ký.");
  if (account.password !== password) return fail("Sai mật khẩu.");
  return ok("Đăng nhập thành công.", account);
}

// hook

export function useLogin() {
  const { data, setSession, toast, prefill, setPrefill } = useStore();
  const router = useRouter();

  const [phone, setPhone] = useState(prefill?.phone ?? "");
  const [password, setPassword] = useState(prefill?.password ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = authenticate(data, phone, password);
    if (!res.ok || !res.data) {
      setError(res.message);
      return;
    }
    setPrefill(null);
    setSession(res.data.id);
    toast("ok", `Xin chào ${res.data.fullName || res.data.phone}.`);
    router.push(landingFor(res.data.role));
  }

  return {
    phone,
    setPhone,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    error,
    submit,
  };
}
