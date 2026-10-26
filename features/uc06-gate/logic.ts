"use client";

/** UC6, UC8.2 - Nhân viên điều độ ngoài trời duyệt yêu cầu xe vào/ra bến. */
import { useMemo, useState } from "react";
import { localDateTime, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  fail,
  ok,
  type Data,
  type EntryKind,
  type EntryRequest,
  type EntryStatus,
  type Result,
} from "@/types";
import { allPass } from "./rules";

export function checkReason(reason: string): Result {
  if (!reason.trim()) return fail("Nhập lý do.");
  return ok("");
}

/** Lưu quyết định; cho vào thì ghi luôn giờ vào bến lên chuyến */
export function decideEntry(
  data: Data,
  entryId: string,
  decision: "approve" | "reject",
  byName: string,
  reason = "",
): Data {
  const entry = data.entries.find((e) => e.id === entryId);
  if (!entry || entry.status !== "pending") return data;
  const at = localDateTime(Date.now());
  const approved = decision === "approve";
  return {
    ...data,
    entries: data.entries.map((e): EntryRequest =>
      e.id === entryId
        ? {
            ...e,
            status: approved ? "approved" : "rejected",
            exception: approved && !allPass(e) ? true : undefined,
            reason: reason.trim() || undefined,
            decidedBy: byName,
            decidedAt: at,
          }
        : e,
    ),
    trips: approved
      ? data.trips.map((t) =>
          t.id === entry.tripId
            ? entry.kind === "exit"
              ? { ...t, departure: { at, gate: entry.gate, entryId } }
              : { ...t, arrival: { at, gate: entry.gate, entryId } }
            : t,
        )
      : data.trips,
  };
}

export type EntryFilter = EntryStatus | "all";

export function useGate(kind: EntryKind = "entry") {
  const { data, user, update, toast } = useStore();

  const [filter, setFilter] = useState<EntryFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"reject" | "exception" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );

  /** Yêu cầu cùng hướng: vào bến hoặc ra bến (dữ liệu cũ không có hướng là vào bến) */
  const entries = useMemo(
    () => data.entries.filter((e) => (e.kind ?? "entry") === kind),
    [data.entries, kind],
  );

  const list = useMemo(
    () =>
      entries
        .filter((e) => (filter === "all" ? true : e.status === filter))
        .filter((e) =>
          query.trim()
            ? matches(
                `${e.driverName} ${e.plate} ${carrierOf.get(e.dossierId) ?? ""} ${e.gate}`,
                query,
              )
            : true,
        )
        // Yêu cầu chờ xác nhận lên đầu, rồi mới nhất trước
        .sort(
          (a, b) =>
            Number(b.status === "pending") - Number(a.status === "pending") ||
            b.requestedAt.localeCompare(a.requestedAt),
        ),
    [entries, filter, query, carrierOf],
  );

  const counts = useMemo<Record<EntryFilter, number>>(
    () => ({
      all: entries.length,
      pending: entries.filter((e) => e.status === "pending").length,
      approved: entries.filter((e) => e.status === "approved").length,
      rejected: entries.filter((e) => e.status === "rejected").length,
    }),
    [entries],
  );

  const current = data.entries.find((e) => e.id === openId) ?? null;

  function open(id: string) {
    setOpenId(id);
    setMode(null);
    setReason("");
    setError("");
  }

  function close() {
    setOpenId(null);
    setError("");
  }

  function chooseMode(m: "reject" | "exception" | null) {
    setMode(m);
    setError("");
  }

  /** Phê duyệt cho vào khi mọi mục đối chiếu đều đạt */
  function approve() {
    if (!current || !user || !allPass(current)) return;
    update((d) =>
      decideEntry(d, current.id, "approve", user.fullName || user.phone),
    );
    toast(
      "ok",
      kind === "exit"
        ? `Đã cho xe ${current.plate} ra bến.`
        : `Đã cho xe ${current.plate} vào bến.`,
    );
    close();
  }

  /** Từ chối hoặc cho vào ngoại lệ, cả hai bắt buộc có lý do */
  function submitReason(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !user || !mode) return;
    const res = checkReason(reason);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) =>
      decideEntry(
        d,
        current.id,
        mode === "exception" ? "approve" : "reject",
        user.fullName || user.phone,
        reason,
      ),
    );
    toast(
      mode === "exception" ? "warn" : "warn",
      mode === "exception"
        ? `Đã cho xe ${current.plate} ${kind === "exit" ? "ra" : "vào"} bến (ngoại lệ).`
        : `Đã từ chối xe ${current.plate}, cổng không mở.`,
    );
    close();
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    carrierOf,
    current,
    open,
    close,
    mode,
    chooseMode,
    reason,
    setReason,
    error,
    approve,
    submitReason,
  };
}
