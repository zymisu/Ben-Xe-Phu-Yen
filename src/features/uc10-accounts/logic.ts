"use client";

/**
 * UC10 - Quản lý tài khoản nhân viên (quản trị viên): tạo, cập nhật, xóa.
 * Mỗi lần xong, tài khoản bị tác động nhận thông báo.
 */
import { useMemo, useState } from "react";
import { formatDate, matches, todayISO } from "@/lib/format";
import { notify } from "@/lib/notify";
import { useStore } from "@/lib/store";
import { ROLE_LABEL, type Account, type Data, type Role } from "@/types";
import {
  changedFields,
  checkAccount,
  emptyForm,
  isStaff,
  linksOf,
  nextStaffCode,
  renameInRecords,
  STAFF_ROLES,
  toForm,
  type AccountForm,
} from "./rules";

/** Lưu tài khoản mới và gửi thông báo chào mừng */
export function createAccount(
  data: Data,
  f: AccountForm,
  adminName: string,
): Data {
  const a: Account = {
    id: `u-${Date.now()}`,
    username: f.phone.trim(),
    password: f.password,
    phone: f.phone.trim(),
    email: f.email.trim(),
    fullName: f.fullName.trim(),
    role: f.role as Role,
    createdAt: todayISO(),
    code: f.code.trim(),
    address: f.address.trim(),
  };
  return notify(
    { ...data, accounts: [...data.accounts, a] },
    a.id,
    "Tài khoản đã được tạo",
    `Quản trị viên ${adminName} đã tạo tài khoản ${ROLE_LABEL[a.role]} cho bạn. Đăng nhập bằng số điện thoại ${a.phone}.`,
  );
}

/** Lưu thay đổi, đổi họ tên trong hạng mục cũ, báo cho tài khoản */
export function updateAccount(
  data: Data,
  id: string,
  f: AccountForm,
  adminName: string,
): Data {
  const current = data.accounts.find((a) => a.id === id);
  if (!current) return data;
  const changed = changedFields(current, f);
  const next: Account = {
    ...current,
    fullName: f.fullName.trim(),
    phone: f.phone.trim(),
    username: f.phone.trim(),
    role: f.role as Role,
    code: f.code.trim(),
    email: f.email.trim(),
    address: f.address.trim(),
  };
  const moved = renameInRecords(
    { ...data, accounts: data.accounts.map((a) => (a.id === id ? next : a)) },
    current.fullName,
    next.fullName,
  );
  return notify(
    moved,
    id,
    "Thông tin tài khoản đã được cập nhật",
    `Quản trị viên ${adminName} đã cập nhật: ${changed.join(", ")}.${
      current.phone !== next.phone
        ? ` Số điện thoại đăng nhập mới là ${next.phone}.`
        : ""
    }`,
  );
}

/** Xóa tài khoản và các thông báo của nó; chỉ khi không còn liên kết */
export function deleteAccount(data: Data, id: string): Data {
  const a = data.accounts.find((x) => x.id === id);
  if (!a || linksOf(data, a).length > 0) return data;
  return {
    ...data,
    accounts: data.accounts.filter((x) => x.id !== id),
    notifications: data.notifications.filter((n) => n.accountId !== id),
  };
}

export type AccountFilter = Role | "all";

export function useAccounts() {
  const { data, user, update, toast } = useStore();

  const [filter, setFilter] = useState<AccountFilter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{
    mode: "create" | "update";
    id?: string;
    values: AccountForm;
  } | null>(null);
  const [error, setError] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const staff = useMemo(() => data.accounts.filter(isStaff), [data.accounts]);

  const list = useMemo(
    () =>
      staff
        .filter((a) => (filter === "all" ? true : a.role === filter))
        .filter((a) =>
          query.trim()
            ? matches(
                `${a.fullName} ${a.phone} ${a.code} ${a.email} ${ROLE_LABEL[a.role]}`,
                query,
              )
            : true,
        )
        .sort((a, b) => a.code.localeCompare(b.code)),
    [staff, filter, query],
  );

  const counts = useMemo(() => {
    const c = { all: staff.length } as Record<AccountFilter, number>;
    for (const r of STAFF_ROLES)
      c[r] = staff.filter((a) => a.role === r).length;
    return c;
  }, [staff]);

  const adminName = user?.fullName || user?.phone || "";

  /** Mở biểu mẫu tạo tài khoản */
  function openCreate() {
    setForm({
      mode: "create",
      values: emptyForm(nextStaffCode(data.accounts)),
    });
    setError("");
  }

  /** Chọn tài khoản, hiện thông tin hiện tại (không có mật khẩu) */
  function openUpdate(a: Account) {
    setForm({ mode: "update", id: a.id, values: toForm(a) });
    setError("");
  }

  function closeForm() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof AccountForm>(
    key: K,
    value: AccountForm[K],
  ) {
    setForm((f) => (f ? { ...f, values: { ...f.values, [key]: value } } : f));
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const current = form.id
      ? data.accounts.find((a) => a.id === form.id)
      : undefined;
    const res = checkAccount(form.values, data.accounts, current);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (form.mode === "create") {
      update((d) => createAccount(d, form.values, adminName));
      toast("ok", `Đã tạo tài khoản ${form.values.fullName.trim()}.`);
    } else if (form.id) {
      const id = form.id;
      update((d) => updateAccount(d, id, form.values, adminName));
      toast(
        "ok",
        "Cập nhật tài khoản thành công, đã gửi thông báo cho nhân viên.",
      );
    }
    closeForm();
  }

  // xóa

  const removing = data.accounts.find((a) => a.id === removeId) ?? null;
  /** Các hạng mục liên kết; rỗng thì xóa được */
  const links = useMemo(
    () => (removing ? linksOf(data, removing) : []),
    [data, removing],
  );

  function confirmRemove() {
    if (!removing || links.length > 0) return;
    update((d) => deleteAccount(d, removing.id));
    toast(
      "ok",
      `Đã xóa tài khoản ${removing.fullName} và gửi thông báo tới số ${removing.phone}.`,
    );
    setRemoveId(null);
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    form,
    error,
    openCreate,
    openUpdate,
    closeForm,
    setField,
    submit,
    removing,
    links,
    askRemove: setRemoveId,
    cancelRemove: () => setRemoveId(null),
    confirmRemove,
    describe: (a: Account) => formatDate(a.createdAt),
  };
}
