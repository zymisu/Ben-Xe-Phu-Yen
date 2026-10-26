/** Quy tắc quản lý tài khoản nhân viên: kiểm tra hợp lệ, kiểm tra liên kết trước khi xóa. Không có React. */
import { normalizePhone } from "../uc02-login/logic";
import { checkPassword } from "../uc01-register/logic";
import { PHONE } from "@/lib/rules";
import {
  fail,
  ok,
  ROLE_LABEL,
  type Account,
  type Data,
  type Result,
  type Role,
} from "@/types";

/** Các vai trò nhân viên bến xe do quản trị viên quản lý */
export const STAFF_ROLES: Role[] = [
  "reception",
  "indoor",
  "outdoor",
  "security",
];

export const isStaff = (a: Account): boolean => STAFF_ROLES.includes(a.role);

const EMAIL = /^\S+@\S+\.\S+$/;
const INVALID = "Dữ liệu không hợp lệ: ";

export interface AccountForm {
  fullName: string;
  phone: string;
  role: Role | "";
  code: string;
  email: string;
  address: string;
  /** Mật khẩu ban đầu, chỉ có khi tạo; cập nhật không hiện và không đổi được mật khẩu */
  password: string;
}

export const emptyForm = (code: string): AccountForm => ({
  fullName: "",
  phone: "",
  role: "",
  code,
  email: "",
  address: "",
  password: "",
});

export const toForm = (a: Account): AccountForm => ({
  fullName: a.fullName,
  phone: a.phone,
  role: a.role,
  code: a.code,
  email: a.email,
  address: a.address,
  password: "",
});

/** Mã nhân viên kế tiếp: NV-0001, NV-0002... */
export function nextStaffCode(accounts: Account[]): string {
  const max = accounts.reduce((m, a) => {
    const n = a.code.startsWith("NV-") ? Number(a.code.slice(3)) : 0;
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `NV-${String(max + 1).padStart(4, "0")}`;
}

const FIELD_LABEL: Record<keyof Omit<AccountForm, "password">, string> = {
  fullName: "họ tên",
  phone: "số điện thoại",
  role: "vai trò",
  code: "mã nhân viên",
  email: "thư điện tử",
  address: "địa chỉ liên hệ",
};

/** Các trường khác với tài khoản hiện tại, dùng để báo cho người bị tác động */
export function changedFields(current: Account, f: AccountForm): string[] {
  const out: string[] = [];
  (Object.keys(FIELD_LABEL) as (keyof typeof FIELD_LABEL)[]).forEach((k) => {
    const a = k === "role" ? current.role : current[k];
    const b = k === "role" ? f.role : f[k].trim();
    if (a !== b) out.push(FIELD_LABEL[k]);
  });
  return out;
}

/**
 * Kiểm tra tính hợp lệ khi tạo hoặc cập nhật: đủ trường bắt buộc, số điện
 * thoại đúng định dạng, họ tên, số điện thoại, mã không trùng tài khoản khác.
 */
export function checkAccount(
  f: AccountForm,
  accounts: Account[],
  current?: Account,
): Result {
  const others = accounts.filter((a) => a.id !== current?.id);
  const name = f.fullName.trim();
  if (!name) return fail(`${INVALID}chưa nhập họ tên.`);
  if (name.length > 60) return fail(`${INVALID}họ tên tối đa 60 ký tự.`);
  if (
    others.some((a) => a.fullName.trim().toLowerCase() === name.toLowerCase())
  )
    return fail(`${INVALID}đã có tài khoản khác trùng họ tên "${name}".`);

  if (!PHONE.test(f.phone.trim()))
    return fail(`${INVALID}số điện thoại sai định dạng.`);
  if (others.some((a) => normalizePhone(a.phone) === normalizePhone(f.phone)))
    return fail(`${INVALID}số điện thoại đã được dùng cho tài khoản khác.`);

  if (!f.role || !STAFF_ROLES.includes(f.role))
    return fail(`${INVALID}chưa chọn vai trò.`);

  const code = f.code.trim();
  if (!code) return fail(`${INVALID}chưa nhập mã nhân viên.`);
  if (others.some((a) => a.code.toLowerCase() === code.toLowerCase()))
    return fail(`${INVALID}mã ${code} đã được dùng cho tài khoản khác.`);

  if (f.email.trim() && !EMAIL.test(f.email.trim()))
    return fail(`${INVALID}thư điện tử sai định dạng.`);
  if (f.address.trim().length > 200)
    return fail(`${INVALID}địa chỉ tối đa 200 ký tự.`);

  if (!current) {
    const pw = checkPassword(f.password, f.password);
    if (!pw.ok) return fail(`${INVALID}${pw.message.toLowerCase()}`);
  } else if (changedFields(current, f).length === 0) {
    return fail(`${INVALID}không có thay đổi nào để lưu.`);
  }
  return ok("");
}

// liên kết

export interface Link {
  label: string;
  count: number;
}

/**
 * Các hạng mục tài khoản đã xử lý; còn hạng mục nào thì không được xóa.
 * Hạng mục lưu theo họ tên người xử lý nên họ tên nhân viên phải duy nhất.
 */
export function linksOf(data: Data, a: Account): Link[] {
  const name = a.fullName;
  const count = (n: number, label: string): Link => ({ label, count: n });
  const trips = data.trips;
  return [
    count(
      data.dossiers.filter((d) => d.reviewerName === name).length,
      "Hồ sơ nhà xe đã tiếp nhận, phê duyệt",
    ),
    count(
      trips.filter((t) => t.reviewerName === name).length,
      "Chuyến xe đã tiếp nhận, phê duyệt",
    ),
    count(
      trips.filter((t) => t.boarding?.assignedBy === name).length,
      "Chuyến đã phân công đón khách",
    ),
    count(
      trips.reduce(
        (n, t) =>
          n + (t.inspections ?? []).filter((i) => i.byName === name).length,
        0,
      ),
      "Phiếu kiểm tra xuất bến đã lập",
    ),
    count(
      trips.filter((t) => t.departureOrder?.issuedBy === name).length,
      "Lệnh xuất bến đã cấp",
    ),
    count(
      data.entries.filter((e) => e.decidedBy === name).length,
      "Yêu cầu xe vào, ra bến đã xử lý",
    ),
    count(
      data.violations.filter((v) => v.createdBy === name).length,
      "Biên bản vi phạm đã lập",
    ),
    count(
      data.reports.filter((r) => r.recipientIds.includes(a.id)).length,
      "Báo cáo nhà xe gửi tới tài khoản",
    ),
    count(
      data.bayAdjustments.filter((x) => x.byName === name).length,
      "Cập nhật vị trí đón khách",
    ),
  ].filter((l) => l.count > 0);
}

/** Đổi họ tên trong mọi hạng mục cũ để liên kết với tài khoản không bị đứt */
export function renameInRecords(data: Data, from: string, to: string): Data {
  if (from === to) return data;
  const swap = (v?: string) => (v === from ? to : v);
  return {
    ...data,
    dossiers: data.dossiers.map((d) => ({
      ...d,
      reviewerName: swap(d.reviewerName),
    })),
    trips: data.trips.map((t) => ({
      ...t,
      reviewerName: swap(t.reviewerName),
      boarding: t.boarding
        ? { ...t.boarding, assignedBy: swap(t.boarding.assignedBy) ?? "" }
        : undefined,
      inspections: t.inspections?.map((i) => ({
        ...i,
        byName: swap(i.byName) ?? "",
      })),
      departureOrder: t.departureOrder
        ? {
            ...t.departureOrder,
            issuedBy: swap(t.departureOrder.issuedBy) ?? "",
          }
        : undefined,
    })),
    entries: data.entries.map((e) => ({ ...e, decidedBy: swap(e.decidedBy) })),
    violations: data.violations.map((v) => ({
      ...v,
      createdBy: swap(v.createdBy) ?? "",
    })),
    reports: data.reports.map((r) => ({
      ...r,
      reads: r.reads.map((x) => ({ ...x, name: swap(x.name) ?? x.name })),
    })),
    bayAdjustments: data.bayAdjustments.map((x) => ({
      ...x,
      byName: swap(x.byName) ?? "",
    })),
  };
}

export const roleLabel = (r: Role): string => ROLE_LABEL[r];
