"use client";

/**
 * UC6 - Lập biên bản vi phạm tại bãi (nhân viên an ninh trật tự): nhập, kiểm tra và lưu hồ sơ vi phạm.
 */
import { useMemo, useState } from "react";
import { formatDate, localDateTime, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  fail,
  ok,
  VIOLATION_TYPES,
  type Bay,
  type Data,
  type Dossier,
  type Result,
  type Violation,
} from "@/types";
import { GATES } from "../rules";

export interface ViolationForm {
  dossierId: string;
  plate: string;
  driverName: string;
  type: string;
  occurredAt: string;
  location: string;
  description: string;
}

const INVALID = "Dữ liệu không hợp lệ: ";

/** Nơi xảy ra vi phạm: cổng, ô đón khách hoặc khu vực chung của bến */
export function locationsOf(bays: Bay[]): string[] {
  return [
    ...GATES,
    ...bays.map((b) => b.code),
    "Bãi đỗ xe",
    "Khu vực chờ lên khách",
  ];
}

export const emptyForm = (now: number): ViolationForm => ({
  dossierId: "",
  plate: "",
  driverName: "",
  type: "",
  occurredAt: localDateTime(now),
  location: "",
  description: "",
});

/** Kiểm tra thiếu trường bắt buộc hoặc sai định dạng */
export function checkViolation(
  f: ViolationForm,
  dossiers: Dossier[],
  now: number,
): Result {
  const dossier = dossiers.find((d) => d.id === f.dossierId);
  if (!dossier) return fail(`${INVALID}chưa chọn nhà xe.`);
  if (!f.plate || !dossier.vehicles.some((v) => v.plate === f.plate))
    return fail(`${INVALID}chưa chọn biển số xe của nhà xe.`);
  if (!f.type) return fail(`${INVALID}chưa chọn lỗi vi phạm.`);
  if (!f.occurredAt || Number.isNaN(new Date(`${f.occurredAt}:00`).getTime()))
    return fail(`${INVALID}chưa nhập thời điểm vi phạm.`);
  if (new Date(`${f.occurredAt}:00`).getTime() > now)
    return fail(`${INVALID}thời điểm vi phạm không được ở tương lai.`);
  if (!f.location) return fail(`${INVALID}chưa chọn vị trí vi phạm.`);
  if (!f.description.trim()) return fail(`${INVALID}chưa nhập mô tả vi phạm.`);
  return ok("");
}

/** Số biên bản kế tiếp: BB-0001, BB-0002... */
export function nextCode(list: Violation[]): string {
  const max = list.reduce(
    (m, v) => Math.max(m, Number(v.code.replace(/\D/g, "")) || 0),
    0,
  );
  return `BB-${String(max + 1).padStart(4, "0")}`;
}

/** Lưu hồ sơ vi phạm */
export function addViolation(
  data: Data,
  f: ViolationForm,
  byName: string,
): Data {
  const now = Date.now();
  const v: Violation = {
    id: `vp-${now}`,
    code: nextCode(data.violations),
    type: f.type,
    dossierId: f.dossierId,
    plate: f.plate,
    driverName: f.driverName || undefined,
    occurredAt: f.occurredAt,
    location: f.location,
    description: f.description.trim(),
    createdBy: byName,
    createdAt: localDateTime(now),
  };
  return { ...data, violations: [...data.violations, v] };
}

export const SHORT_TYPE: Record<string, string> = {
  "Dừng xe trả khách quá lâu": "Dừng quá lâu",
  "Đi sai cổng": "Sai cổng",
  "Đỗ sai vị trí quy định": "Sai vị trí",
  "Xe không đủ điều kiện vào bến": "Không đủ điều kiện",
  "Vi phạm khác": "Khác",
};

export type ViolationFilter = string;

export function useViolations() {
  const { data, user, update, toast } = useStore();

  const [filter, setFilter] = useState<ViolationFilter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<ViolationForm | null>(null);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );
  const approved = useMemo(
    () => data.dossiers.filter((d) => d.everApproved),
    [data.dossiers],
  );

  const list = useMemo(
    () =>
      data.violations
        .filter((v) => (filter === "all" ? true : v.type === filter))
        .filter((v) =>
          query.trim()
            ? matches(
                `${v.code} ${v.plate} ${v.driverName ?? ""} ${carrierOf.get(v.dossierId) ?? ""} ${v.location} ${v.type}`,
                query,
              )
            : true,
        )
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
    [data.violations, filter, query, carrierOf],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.violations.length };
    for (const t of VIOLATION_TYPES)
      c[t] = data.violations.filter((v) => v.type === t).length;
    return c;
  }, [data.violations]);

  const dossier = approved.find((d) => d.id === form?.dossierId) ?? null;

  /** Mở biểu mẫu lập biên bản */
  function openForm() {
    setForm(emptyForm(Date.now()));
    setError("");
  }

  function closeForm() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof ViolationForm>(
    key: K,
    value: ViolationForm[K],
  ) {
    setForm((f) => {
      if (!f) return f;
      // Đổi nhà xe thì biển số và tài xế đã chọn không còn thuộc nhà xe đó
      return key === "dossierId"
        ? { ...f, dossierId: value as string, plate: "", driverName: "" }
        : { ...f, [key]: value };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !user) return;
    const res = checkViolation(form, data.dossiers, Date.now());
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => addViolation(d, form, user.fullName || user.phone));
    toast("ok", "Lập biên bản vi phạm thành công.");
    closeForm();
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    carrierOf,
    approved,
    dossier,
    locations: locationsOf(data.bays),
    form,
    error,
    openForm,
    closeForm,
    setField,
    submit,
    viewing: data.violations.find((v) => v.id === viewId) ?? null,
    openView: setViewId,
    closeView: () => setViewId(null),
    describe: (v: Violation) => formatDate(v.occurredAt.split("T")[0]),
  };
}
