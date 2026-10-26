"use client";

/**
 * UC2 - Lấy lại mật khẩu: nhập email hoặc số điện thoại, xác thực bằng mã OTP rồi đặt mật khẩu mới.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Account, Data } from "@/types";

/** Chấp nhận email hoặc số điện thoại */
export function findAccount(data: Data, identity: string): Account | undefined {
  const key = identity.trim().toLowerCase();
  const digits = identity.replace(/\s/g, "");
  return data.accounts.find(
    (a) =>
      (a.email && a.email.toLowerCase() === key) ||
      a.phone.replace(/\s/g, "") === digits ||
      a.username.toLowerCase() === key,
  );
}

export function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Trả lời nhắc lỗi, hoặc chuỗi rỗng nếu mật khẩu mới hợp lệ */
export function passwordError(password: string, confirm: string): string {
  if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (password !== confirm) return "Hai lần nhập mật khẩu không khớp nhau.";
  return "";
}

/** Ghi mật khẩu mới */
export function writePassword(
  data: Data,
  accountId: string,
  password: string,
): Data {
  return {
    ...data,
    accounts: data.accounts.map((a) =>
      a.id === accountId ? { ...a, password } : a,
    ),
  };
}

// hook

export function useForgotPassword() {
  const { data, update, toast } = useStore();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identity, setIdentity] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState("");

  /** Gửi mã OTP, hiện như tin nhắn trên màn hình */
  function issueOtp() {
    const code = makeOtp();
    setExpectedOtp(code);
    toast(
      "info",
      `BENXEPY: Ma OTP cua ban la ${code}. Ma co hieu luc trong 5 phut.`,
    );
  }

  function submitIdentity(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const account = findAccount(data, identity);
    if (!account) {
      setError("Email hoặc số điện thoại không hợp lệ.");
      return;
    }
    setAccountId(account.id);
    issueOtp();
    setOtp("");
    setStep(2);
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.trim() !== expectedOtp) {
      setError("Mã OTP không hợp lệ.");
      return;
    }
    setStep(3);
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    const msg = passwordError(password, confirm);
    if (msg) {
      setError(msg);
      return;
    }
    update((d) => writePassword(d, accountId, password));
    toast("ok", "Đã cập nhật mật khẩu mới.");
    router.push("/dang-nhap");
  }

  /** Gửi lại mã */
  function resend() {
    setError("");
    setOtp("");
    issueOtp();
  }

  function backToIdentity() {
    setError("");
    setStep(1);
  }

  return {
    step,
    identity,
    setIdentity,
    otp,
    setOtp,
    password,
    setPassword,
    confirm,
    setConfirm,
    error,
    submitIdentity,
    submitOtp,
    submitPassword,
    resend,
    backToIdentity,
  };
}
