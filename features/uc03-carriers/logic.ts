"use client";

/** UC3 - Nhân viên tiếp nhận đối chiếu giấy tờ và phê duyệt hồ sơ nhà xe (đăng ký mới hoặc yêu cầu cập nhật). */
import { useMemo, useState } from "react";
import { formatDate, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  fail,
  ok,
  type Data,
  type Dossier,
  type DossierInfo,
  type DossierStatus,
  type Result,
} from "@/types";
import { checkRejection, decide, isAwaiting } from "@/lib/review";

/** Các giấy tờ pháp lý nhân viên phải đối chiếu trước khi duyệt */
export const LEGAL_DOCS = [
  {
    key: "biz",
    label: "Giấy chứng nhận đăng ký doanh nghiệp",
    detail: (d: DossierInfo) =>
      `Số ${d.bizNo || "-"} · cấp ngày ${formatDate(d.bizDate) || "-"}`,
  },
  {
    key: "transport",
    label: "Giấy phép kinh doanh vận tải bằng xe ô tô",
    detail: (d: DossierInfo) =>
      `Số ${d.transportNo || "-"} · cấp ngày ${
        formatDate(d.transportDate) || "-"
      } · ${d.transportIssuer || "-"}`,
  },
] as const;

export type DocKey = (typeof LEGAL_DOCS)[number]["key"];

/** Nội dung nhân viên phải đối chiếu: bản đề nghị nếu là yêu cầu cập nhật */
export function subjectOf(d: Dossier): DossierInfo {
  return d.request ?? d;
}

/** Chỉ duyệt khi đã đối chiếu đủ giấy tờ */
export function checkApproval(checked: Record<string, boolean>): Result {
  const missing = LEGAL_DOCS.filter((d) => !checked[d.key]);
  if (missing.length > 0) {
    return fail("Chưa đối chiếu đủ giấy tờ pháp lý của hồ sơ.");
  }
  return ok("");
}

/**
 * Ghi kết quả phê duyệt vào hồ sơ (quy tắc chung ở
 * `lib/review`). Duyệt hồ sơ thì báo cho nhà xe biết kết quả ở lần đăng nhập
 * kế tiếp.
 */
export function writeDecision(
  data: Data,
  dossierId: string,
  decision: "approve" | "reject",
  reviewerName: string,
  rejectReason?: string,
): Data {
  return {
    ...data,
    dossiers: data.dossiers.map((d): Dossier => {
      if (d.id !== dossierId) return d;
      const next = decide(d, decision, reviewerName, rejectReason);
      return decision === "approve" ? { ...next, resultSeen: false } : next;
    }),
  };
}

// hook

export { isAwaiting };

export type Filter = DossierStatus | "all";

export function useDossiers() {
  const { data, user, update, toast } = useStore();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const list = useMemo(
    () =>
      data.dossiers
        .filter((d) => (filter === "all" ? true : d.status === filter))
        .filter((d) =>
          query.trim()
            ? matches(
                `${d.companyName} ${d.taxCode} ${d.phone} ${d.representative} ${d.routeFrom} ${d.routeTo}`,
                query,
              )
            : true,
        )
        .sort((a, b) =>
          (b.requestedAt ?? b.submittedAt).localeCompare(
            a.requestedAt ?? a.submittedAt,
          ),
        ),
    [data.dossiers, filter, query],
  );

  const counts = useMemo<Record<Filter, number>>(
    () => ({
      all: data.dossiers.length,
      receiving: data.dossiers.filter((d) => d.status === "receiving").length,
      active: data.dossiers.filter((d) => d.status === "active").length,
      updating: data.dossiers.filter((d) => d.status === "updating").length,
      rejected: data.dossiers.filter((d) => d.status === "rejected").length,
    }),
    [data.dossiers],
  );

  const current = data.dossiers.find((d) => d.id === openId) ?? null;

  function openDossier(id: string) {
    setOpenId(id);
    setChecked({});
    setRejecting(false);
    setReason("");
    setError("");
  }

  function closeDossier() {
    setOpenId(null);
    setError("");
  }

  function toggleDoc(key: DocKey) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }

  function approve() {
    if (!current || !user) return;
    const res = checkApproval(checked);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) =>
      writeDecision(d, current.id, "approve", user.fullName || user.phone),
    );
    toast(
      "ok",
      current.status === "updating"
        ? `Đã duyệt cập nhật hồ sơ ${current.companyName}.`
        : `Đã duyệt hồ sơ ${current.companyName}.`,
    );
    closeDossier();
  }

  function reject() {
    if (!current || !user) return;
    const res = checkRejection(reason);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) =>
      writeDecision(
        d,
        current.id,
        "reject",
        user.fullName || user.phone,
        reason,
      ),
    );
    toast(
      "warn",
      current.status === "updating"
        ? `Đã từ chối yêu cầu cập nhật của ${current.companyName}.`
        : `Đã từ chối hồ sơ ${current.companyName}.`,
    );
    closeDossier();
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    current,
    openDossier,
    closeDossier,
    checked,
    toggleDoc,
    rejecting,
    setRejecting,
    reason,
    setReason,
    error,
    approve,
    reject,
  };
}
