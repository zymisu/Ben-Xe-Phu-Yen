"use client";

/** UC5 - Nhân viên điều độ ngoài trời báo tạm ngưng hoặc lệch giờ cho vị trí đón khách. */
import { useMemo, useState } from "react";
import { localDateTime, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import {
  fail,
  ok,
  type Bay,
  type BayAdjustment,
  type Data,
  type Result,
  type Trip,
} from "@/types";
import { checkAdjustment, isInEffect, slotOf } from "../rules";

export type AdjustFilter = "all" | "active" | "ended";

export interface AdjustForm {
  bayIds: string[];
  kind: BayAdjustment["kind"];
  from: string;
  until: string;
  minutes: string;
  reason: string;
}

const emptyForm = (now: number, bayIds: string[] = []): AdjustForm => ({
  bayIds,
  kind: "unavailable",
  from: localDateTime(now),
  until: "",
  minutes: "5",
  reason: "",
});

export function addAdjustment(data: Data, f: AdjustForm, byName: string): Data {
  // Chọn nhiều ô cùng lúc: mỗi ô một điều chỉnh để kết thúc riêng được
  const stamp = Date.now();
  const list: BayAdjustment[] = f.bayIds.map((bayId, i) => ({
    id: `dc-${stamp}-${i}`,
    bayId,
    kind: f.kind,
    from: f.from,
    until: f.until || undefined,
    minutes: f.kind === "delay" ? Number(f.minutes) : undefined,
    reason: f.reason.trim(),
    byName,
    createdAt: localDateTime(stamp),
  }));
  return { ...data, bayAdjustments: [...data.bayAdjustments, ...list] };
}

/** Mã ô gợi ý khi thêm mới: số lớn nhất hiện có cộng một */
export function nextBayCode(bays: Bay[]): string {
  const max = bays.reduce((m, b) => {
    const n = Number(b.code.replace(/\D/g, ""));
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return `Ô ${String(max + 1).padStart(2, "0")}`;
}

/** Mã ô phải có và không trùng ô khác (không phân biệt hoa thường) */
export function checkBayCode(bays: Bay[], code: string): Result {
  const c = code.trim();
  if (!c) return fail("Nhập mã ô.");
  if (bays.some((b) => b.code.toLowerCase() === c.toLowerCase()))
    return fail(`Mã ô ${c} đã tồn tại.`);
  return ok("");
}

export function addBay(data: Data, code: string): Data {
  const bay: Bay = { id: `b${Date.now()}`, code: code.trim() };
  return { ...data, bays: [...data.bays, bay] };
}

/** Số chuyến đang được gán vào ô; ô còn chuyến thì không được xóa */
export function assignedCount(trips: Trip[], bayId: string): number {
  return trips.filter((t) => t.boarding?.bayId === bayId).length;
}

/** Xóa ô và các điều chỉnh của ô đó; chỉ xóa khi không còn chuyến nào được gán */
export function removeBay(data: Data, bayId: string): Data {
  if (assignedCount(data.trips, bayId) > 0) return data;
  return {
    ...data,
    bays: data.bays.filter((b) => b.id !== bayId),
    bayAdjustments: data.bayAdjustments.filter((a) => a.bayId !== bayId),
  };
}

export function endAdjustment(data: Data, id: string): Data {
  return {
    ...data,
    bayAdjustments: data.bayAdjustments.map((a) =>
      a.id === id ? { ...a, endedAt: localDateTime(Date.now()) } : a,
    ),
  };
}

export function useBays() {
  const { data, user, update, toast } = useStore();
  const now = useNow();

  const [filter, setFilter] = useState<AdjustFilter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<AdjustForm | null>(null);
  const [error, setError] = useState("");

  const bayOf = useMemo(
    () => new Map(data.bays.map((b) => [b.id, b])),
    [data.bays],
  );

  const stateOf = (a: BayAdjustment): "active" | "ended" =>
    isInEffect(a, now) ? "active" : "ended";

  const list = useMemo(
    () =>
      data.bayAdjustments
        .filter((a) =>
          filter === "all"
            ? true
            : (isInEffect(a, now) ? "active" : "ended") === filter,
        )
        .filter((a) =>
          query.trim()
            ? matches(
                `${bayOf.get(a.bayId)?.code ?? ""} ${a.reason} ${a.byName}`,
                query,
              )
            : true,
        )
        .sort((a, b) => b.from.localeCompare(a.from)),
    [data.bayAdjustments, filter, query, now, bayOf],
  );

  const counts = useMemo<Record<AdjustFilter, number>>(() => {
    const active = data.bayAdjustments.filter((a) => isInEffect(a, now)).length;
    return {
      all: data.bayAdjustments.length,
      active,
      ended: data.bayAdjustments.length - active,
    };
  }, [data.bayAdjustments, now]);

  /** Tình hình từng vị trí ngay lúc này, để nhân viên đối chiếu với thực tế */
  const tiles = useMemo(
    () =>
      data.bays.map((bay) => {
        const live = data.bayAdjustments.filter(
          (a) =>
            a.bayId === bay.id &&
            isInEffect(a, now) &&
            new Date(`${a.from}:00`).getTime() <= now,
        );
        const blocked = live.find((a) => a.kind === "unavailable");
        const delay = live
          .filter((a) => a.kind === "delay")
          .reduce((sum, a) => sum + (a.minutes ?? 0), 0);
        const occupant = data.trips.find((t) => {
          const s = slotOf(t, data.bayAdjustments);
          return s && s.bayId === bay.id && s.start <= now && now < s.end;
        });
        return { bay, blocked, delay, occupant };
      }),
    [data.bays, data.bayAdjustments, data.trips, now],
  );

  function openForm(bayId = "") {
    setForm(emptyForm(Date.now(), bayId ? [bayId] : []));
    setError("");
  }

  function closeForm() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof AdjustForm>(key: K, value: AdjustForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !user) return;
    const res = checkAdjustment(form);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => addAdjustment(d, form, user.fullName || user.phone));
    toast("ok", "Đã cập nhật tình trạng vị trí đón khách.");
    closeForm();
  }

  /** Chọn hoặc bỏ chọn một ô trong biểu mẫu cập nhật */
  function toggleBay(id: string) {
    setForm((f) =>
      f
        ? {
            ...f,
            bayIds: f.bayIds.includes(id)
              ? f.bayIds.filter((x) => x !== id)
              : [...f.bayIds, id],
          }
        : f,
    );
    setError("");
  }

  function setAllBays(all: boolean) {
    setForm((f) =>
      f ? { ...f, bayIds: all ? data.bays.map((b) => b.id) : [] } : f,
    );
  }

  // thêm, xóa ô

  const [newCode, setNewCode] = useState<string | null>(null);
  const [codeError, setCodeError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  const usage = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of data.trips)
      if (t.boarding) m[t.boarding.bayId] = (m[t.boarding.bayId] ?? 0) + 1;
    return m;
  }, [data.trips]);

  function openAdd() {
    setNewCode(nextBayCode(data.bays));
    setCodeError("");
  }

  function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (newCode === null) return;
    const res = checkBayCode(data.bays, newCode);
    if (!res.ok) {
      setCodeError(res.message);
      return;
    }
    update((d) => addBay(d, newCode));
    toast("ok", `Đã thêm ${newCode.trim()}.`);
    setNewCode(null);
  }

  function confirmRemove() {
    const bay = data.bays.find((b) => b.id === removing);
    if (!bay) return;
    if (assignedCount(data.trips, bay.id) > 0) {
      toast("danger", `${bay.code} đang có chuyến được gán, không thể xóa.`);
      setRemoving(null);
      return;
    }
    update((d) => removeBay(d, bay.id));
    toast("ok", `Đã xóa ${bay.code}.`);
    setRemoving(null);
  }

  function end(id: string) {
    update((d) => endAdjustment(d, id));
    toast("ok", "Đã kết thúc điều chỉnh, vị trí trở lại bình thường.");
  }

  return {
    bays: data.bays,
    bayOf,
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    stateOf,
    tiles,
    form,
    error,
    openForm,
    toggleBay,
    setAllBays,
    newCode,
    setNewCode,
    codeError,
    openAdd,
    closeAdd: () => setNewCode(null),
    submitAdd,
    usage,
    removing,
    setRemoving,
    confirmRemove,
    closeForm,
    setField,
    submit,
    end,
  };
}
