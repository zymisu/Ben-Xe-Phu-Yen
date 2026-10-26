"use client";

/** UC7.2 - Nhà xe lập báo cáo gửi nhân viên điều độ trong nhà. */
import { useMemo, useState } from "react";
import { localDateTime, matches } from "@/lib/format";
import { notify } from "@/lib/notify";
import { useStore } from "@/lib/store";
import {
  fail,
  ok,
  reportStatus,
  type Data,
  type Report,
  type ReportStatus,
  type Result,
} from "@/types";

export const TITLE_MAX = 100;
export const BODY_MAX = 2000;

export interface ReportForm {
  title: string;
  body: string;
  plate: string;
  recipientIds: string[];
}

const INVALID = "Dữ liệu không hợp lệ: ";

export const emptyForm: ReportForm = {
  title: "",
  body: "",
  plate: "",
  recipientIds: [],
};

/** Tiêu đề và nội dung bắt buộc, có giới hạn độ dài */
export function checkReport(f: ReportForm): Result {
  if (f.recipientIds.length === 0)
    return fail(`${INVALID}chưa chọn người nhận.`);
  if (!f.title.trim()) return fail(`${INVALID}chưa nhập tiêu đề.`);
  if (f.title.trim().length > TITLE_MAX)
    return fail(`${INVALID}tiêu đề tối đa ${TITLE_MAX} ký tự.`);
  if (!f.body.trim()) return fail(`${INVALID}chưa nhập nội dung báo cáo.`);
  if (f.body.trim().length > BODY_MAX)
    return fail(`${INVALID}nội dung tối đa ${BODY_MAX} ký tự.`);
  return ok("");
}

/** Lưu báo cáo (chưa ai đọc) và gửi thông báo tới những người nhận đã chọn */
export function addReport(data: Data, dossierId: string, f: ReportForm): Data {
  const now = Date.now();
  const recipients = data.accounts.filter(
    (a) => a.role === "indoor" && f.recipientIds.includes(a.id),
  );
  const r: Report = {
    id: `bc-${now}`,
    dossierId,
    title: f.title.trim(),
    body: f.body.trim(),
    plate: f.plate || undefined,
    createdAt: localDateTime(now),
    recipientIds: recipients.map((a) => a.id),
    reads: [],
  };
  const company =
    data.dossiers.find((d) => d.id === dossierId)?.companyName ?? "nhà xe";
  return recipients.reduce(
    (acc, a) => notify(acc, a.id, `Báo cáo mới từ ${company}`, r.title),
    { ...data, reports: [...data.reports, r] },
  );
}

export type ReportFilter = ReportStatus | "all";

export function useReports() {
  const { data, user, update, toast } = useStore();
  const dossier = data.dossiers.find((d) => d.accountId === user?.id) ?? null;

  const [filter, setFilter] = useState<ReportFilter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<ReportForm | null>(null);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);

  /** Người có thể nhận báo cáo: nhân viên điều độ trong nhà */
  const staff = useMemo(
    () => data.accounts.filter((a) => a.role === "indoor"),
    [data.accounts],
  );

  const mine = useMemo(
    () => data.reports.filter((r) => r.dossierId === dossier?.id),
    [data.reports, dossier?.id],
  );

  const list = useMemo(
    () =>
      mine
        .filter((r) => (filter === "all" ? true : reportStatus(r) === filter))
        .filter((r) =>
          query.trim()
            ? matches(`${r.title} ${r.body} ${r.plate ?? ""}`, query)
            : true,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [mine, filter, query],
  );

  const counts = useMemo<Record<ReportFilter, number>>(
    () => ({
      all: mine.length,
      unread: mine.filter((r) => reportStatus(r) === "unread").length,
      read: mine.filter((r) => reportStatus(r) === "read").length,
    }),
    [mine],
  );

  /** Mở biểu mẫu lập báo cáo */
  function openForm() {
    setForm(emptyForm);
    setError("");
  }

  function closeForm() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setError("");
  }

  /** Chọn hoặc bỏ chọn một người nhận */
  function toggleRecipient(id: string) {
    setForm((f) =>
      f
        ? {
            ...f,
            recipientIds: f.recipientIds.includes(id)
              ? f.recipientIds.filter((x) => x !== id)
              : [...f.recipientIds, id],
          }
        : f,
    );
    setError("");
  }

  function setAllRecipients(all: boolean) {
    setForm((f) =>
      f ? { ...f, recipientIds: all ? staff.map((a) => a.id) : [] } : f,
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !dossier) return;
    const res = checkReport(form);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => addReport(d, dossier.id, form));
    toast("ok", "Gửi báo cáo thành công.");
    closeForm();
  }

  return {
    dossier,
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    form,
    error,
    openForm,
    closeForm,
    setField,
    submit,
    staff,
    toggleRecipient,
    setAllRecipients,
    nameOf: (id: string) =>
      data.accounts.find((a) => a.id === id)?.fullName ?? "Tài khoản đã xóa",
    viewing: mine.find((r) => r.id === viewId) ?? null,
    openView: setViewId,
    closeView: () => setViewId(null),
  };
}
