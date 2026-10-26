"use client";

/**
 * UC7.2 - Phía nhân viên điều độ trong nhà: đọc báo cáo của các nhà xe.
 * Báo cáo được mở thì chuyển sang "đã đọc", nhà xe thấy giờ và người đọc.
 */
import { useMemo, useState } from "react";
import { localDateTime, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Data, Report, ReportStatus } from "@/types";
import type { ReportFilter } from "../logic";

/** Người nhận mở báo cáo thì ghi họ đã đọc (chỉ ghi lần đầu), nhà xe thấy giờ và người đọc */
export function markRead(
  data: Data,
  id: string,
  reader: { id: string; name: string },
): Data {
  return {
    ...data,
    reports: data.reports.map((r): Report =>
      r.id === id && !r.reads.some((x) => x.accountId === reader.id)
        ? {
            ...r,
            reads: [
              ...r.reads,
              {
                accountId: reader.id,
                name: reader.name,
                at: localDateTime(Date.now()),
              },
            ],
          }
        : r,
    ),
  };
}

/** Trạng thái báo cáo đối với một người nhận */
export const readBy = (r: Report, accountId?: string): ReportStatus =>
  r.reads.some((x) => x.accountId === accountId) ? "read" : "unread";

export function useInbox() {
  const { data, user, update } = useStore();

  const [filter, setFilter] = useState<ReportFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );

  /** Chỉ các báo cáo gửi tới chính người đang đăng nhập */
  const mine = useMemo(
    () => data.reports.filter((r) => r.recipientIds.includes(user?.id ?? "")),
    [data.reports, user?.id],
  );

  const list = useMemo(
    () =>
      mine
        .filter((r) =>
          filter === "all" ? true : readBy(r, user?.id) === filter,
        )
        .filter((r) =>
          query.trim()
            ? matches(
                `${r.title} ${r.body} ${r.plate ?? ""} ${carrierOf.get(r.dossierId) ?? ""}`,
                query,
              )
            : true,
        )
        // Chưa đọc lên đầu, rồi mới nhất trước
        .sort(
          (a, b) =>
            Number(readBy(b, user?.id) === "unread") -
              Number(readBy(a, user?.id) === "unread") ||
            b.createdAt.localeCompare(a.createdAt),
        ),
    [mine, filter, query, carrierOf, user?.id],
  );

  const counts = useMemo<Record<ReportFilter, number>>(
    () => ({
      all: mine.length,
      unread: mine.filter((r) => readBy(r, user?.id) === "unread").length,
      read: mine.filter((r) => readBy(r, user?.id) === "read").length,
    }),
    [mine, user?.id],
  );

  function open(id: string) {
    setOpenId(id);
    if (user)
      update((d) =>
        markRead(d, id, { id: user.id, name: user.fullName || user.phone }),
      );
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    carrierOf,
    statusOf: (r: Report) => readBy(r, user?.id),
    current: mine.find((r) => r.id === openId) ?? null,
    open,
    close: () => setOpenId(null),
  };
}
