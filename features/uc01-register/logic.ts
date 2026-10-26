"use client";

/**
 * UC1 - Đăng ký tài khoản nhà xe: kiểm tra số điện thoại, gửi mã xác thực, đặt mật khẩu và lưu hồ sơ đơn vị (chờ nhân viên tiếp nhận duyệt).
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PHONE } from "@/lib/rules";
import { todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  checkProfile,
  EMPTY_PROFILE,
  toInfo,
  type Profile,
} from "@/features/uc03-carriers/profile";
import {
  fail,
  ok,
  type Account,
  type Data,
  type Dossier,
  type Result,
} from "@/types";

/** So sánh số điện thoại bỏ qua khoảng trắng người dùng gõ thêm */
export function samePhone(a: string, b: string): boolean {
  return a.replace(/\s/g, "") === b.replace(/\s/g, "");
}

/** Mã hồ sơ kế tiếp: HS-0001, HS-0002... */
export function nextHsCode(data: Data): string {
  const max = data.accounts.reduce((m, a) => {
    const n = a.code.startsWith("HS-") ? Number(a.code.slice(3)) : 0;
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `HS-${String(max + 1).padStart(4, "0")}`;
}

/** Định dạng hợp lệ, và số chưa có trong hệ thống */
export function checkPhone(data: Data, phone: string): Result {
  if (!PHONE.test(phone.trim())) {
    return fail("Số điện thoại không hợp lệ.");
  }
  if (data.accounts.some((a) => samePhone(a.phone, phone))) {
    return fail("Số điện thoại này đã được đăng ký.");
  }
  return ok("");
}

/** Sinh mã xác thực sáu chữ số */
export function makeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Ràng buộc mật khẩu */
export function checkPassword(password: string, confirm: string): Result {
  if (password.length < 6) return fail("Mật khẩu phải có ít nhất 6 ký tự.");
  if (password !== confirm)
    return fail("Hai lần nhập mật khẩu không khớp nhau.");
  return ok("");
}

/**
 * Lưu tài khoản và hồ sơ.
 *
 * Số điện thoại dùng luôn làm tên đăng nhập. Hồ sơ vào trạng thái chờ tiếp
 * nhận; đơn vị chỉ khai thác được tại bến sau khi nhân viên bến xe phê duyệt.
 */
export function createAccount(
  data: Data,
  phone: string,
  password: string,
  profile: Profile,
): { data: Data; account: Account } {
  const stamp = Date.now();
  const today = todayISO();
  const account: Account = {
    id: `u-${stamp}`,
    username: phone.trim(),
    password,
    phone: phone.trim(),
    email: profile.email.trim(),
    fullName: profile.representative.trim(),
    role: "carrier",
    createdAt: today,
    code: nextHsCode(data),
    address: "",
  };
  const dossier: Dossier = {
    ...toInfo(profile),
    id: `hs-${stamp}`,
    accountId: account.id,
    phone: account.phone,
    status: "receiving",
    submittedAt: today,
    everApproved: false,
  };
  return {
    data: {
      ...data,
      accounts: [...data.accounts, account],
      dossiers: [...data.dossiers, dossier],
    },
    account,
  };
}

// hook

export type Step = 1 | 2 | 3 | 4;

export function useRegister() {
  const { data, update, setPrefill, toast } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [expected, setExpected] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  /** Gửi mã xác thực, hiện như tin nhắn trên màn hình */
  function sendCode() {
    const c = makeCode();
    setExpected(c);
    toast(
      "info",
      `BENXEPY: Ma xac thuc cua ban la ${c}. Ma co hieu luc trong 5 phut.`,
    );
  }

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = checkPhone(data, phone);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSending(true);
    sendCode();
    setSending(false);
    setCode("");
    setStep(2);
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.trim() !== expected) {
      setError("Mã xác thực không đúng.");
      return;
    }
    setStep(3);
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = checkPassword(password, confirm);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setStep(4);
  }

  function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = checkProfile(profile);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const next = createAccount(data, phone, password, profile);
    update(() => next.data);
    setPrefill({ phone: next.account.phone, password });
    toast("ok", "Đã gửi hồ sơ đăng ký tới bến xe. Vui lòng đăng nhập.");
    router.push("/dang-nhap");
  }

  /** Gửi lại mã */
  function resend() {
    setError("");
    setCode("");
    sendCode();
  }

  /** Quay lại sửa số điện thoại */
  function backToPhone() {
    setError("");
    setStep(1);
  }

  return {
    step,
    phone,
    setPhone,
    code,
    setCode,
    password,
    setPassword,
    confirm,
    setConfirm,
    profile,
    setField,
    error,
    sending,
    submitPhone,
    submitCode,
    submitPassword,
    submitProfile,
    resend,
    backToPhone,
  };
}
