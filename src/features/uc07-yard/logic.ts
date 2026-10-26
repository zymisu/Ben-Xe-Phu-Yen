"use client";

/** UC7.1 - Nhà xe ghi nhận giờ xe vào/ra bãi. */
import { useMemo, useState } from "react";
import { localDateTime, matches } from "@/lib/format";
import { useStore } from "@/lib/store";
import {
  fail,
  ok,
  type Data,
  type Dossier,
  type Result,
  type YardLog,
} from "@/types";

export interface YardForm {
  kind: "in" | "out";
  vehicleId: string;
  driverId: string;
  at: string;
}

const INVALID = "Dữ liệu không hợp lệ: ";

export const emptyForm = (now: number): YardForm => ({
  kind: "in",
  vehicleId: "",
  driverId: "",
  at: localDateTime(now),
});

/** Lần ghi nhận gần nhất theo thời gian của một xe */
export function latestOf(logs: YardLog[], vehicleId: string): YardLog | null {
  return (
    logs
      .filter((l) => l.vehicleId === vehicleId)
      .sort(
        (a, b) =>
          b.at.localeCompare(a.at) || b.createdAt.localeCompare(a.createdAt),
      )[0] ?? null
  );
}

const hm = (at: string) => at.split("T")[1];

/** Kiểm tra thông tin; vào và ra phải nối tiếp nhau theo thời gian */
export function checkYardLog(
  f: YardForm,
  dossier: Dossier,
  logs: YardLog[],
  now: number,
): Result {
  const vehicle = dossier.vehicles.find((v) => v.id === f.vehicleId);
  if (!vehicle) return fail(`${INVALID}chưa chọn xe.`);
  if (!dossier.drivers.some((d) => d.id === f.driverId))
    return fail(`${INVALID}chưa chọn tài xế.`);
  const t = new Date(`${f.at}:00`).getTime();
  if (!f.at || Number.isNaN(t)) return fail(`${INVALID}chưa nhập thời gian.`);
  if (t > now) return fail(`${INVALID}thời gian không được ở tương lai.`);

  const last = latestOf(logs, vehicle.id);
  if (f.kind === "in") {
    if (last?.kind === "in")
      return fail(
        `${INVALID}xe ${vehicle.plate} đang ở trong bãi (vào lúc ${hm(last.at)}).`,
      );
    if (last && f.at < last.at)
      return fail(
        `${INVALID}giờ vào phải sau giờ ra gần nhất (${hm(last.at)}).`,
      );
  } else {
    if (!last || last.kind === "out")
      return fail(`${INVALID}xe ${vehicle.plate} chưa vào bãi.`);
    if (f.at < last.at)
      return fail(`${INVALID}giờ ra phải sau giờ vào (${hm(last.at)}).`);
  }
  return ok("");
}

/** Lưu bản ghi, chụp biển số và tên tài xế để lịch sử không đổi theo hồ sơ */
export function addYardLog(data: Data, dossierId: string, f: YardForm): Data {
  const dossier = data.dossiers.find((d) => d.id === dossierId);
  const vehicle = dossier?.vehicles.find((v) => v.id === f.vehicleId);
  const driver = dossier?.drivers.find((d) => d.id === f.driverId);
  if (!dossier || !vehicle || !driver) return data;
  const now = Date.now();
  const log: YardLog = {
    id: `yl-${now}`,
    dossierId,
    kind: f.kind,
    vehicleId: vehicle.id,
    driverId: driver.id,
    plate: vehicle.plate,
    driverName: driver.name,
    at: f.at,
    createdAt: localDateTime(now),
  };
  return { ...data, yardLogs: [...data.yardLogs, log] };
}

export type YardFilter = "all" | "in" | "out" | "inside";

export function useYard() {
  const { data, user, update, toast } = useStore();
  const dossier = data.dossiers.find((d) => d.accountId === user?.id) ?? null;

  const [filter, setFilter] = useState<YardFilter>("all");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<YardForm | null>(null);
  const [error, setError] = useState("");

  const mine = useMemo(
    () => data.yardLogs.filter((l) => l.dossierId === dossier?.id),
    [data.yardLogs, dossier?.id],
  );

  /** Xe đang ở bãi: lần ghi nhận gần nhất của xe là "vào" */
  const insideIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of dossier?.vehicles ?? []) {
      const last = latestOf(mine, v.id);
      if (last?.kind === "in") ids.add(last.id);
    }
    return ids;
  }, [mine, dossier?.vehicles]);

  const list = useMemo(
    () =>
      mine
        .filter((l) =>
          filter === "all"
            ? true
            : filter === "inside"
              ? insideIds.has(l.id)
              : l.kind === filter,
        )
        .filter((l) =>
          query.trim() ? matches(`${l.plate} ${l.driverName}`, query) : true,
        )
        .sort((a, b) => b.at.localeCompare(a.at)),
    [mine, filter, query, insideIds],
  );

  const counts = useMemo<Record<YardFilter, number>>(
    () => ({
      all: mine.length,
      in: mine.filter((l) => l.kind === "in").length,
      out: mine.filter((l) => l.kind === "out").length,
      inside: insideIds.size,
    }),
    [mine, insideIds],
  );

  /** Mở biểu mẫu ghi nhận */
  function openForm(kind: "in" | "out" = "in", vehicleId = "") {
    setForm({ ...emptyForm(Date.now()), kind, vehicleId });
    setError("");
  }

  function closeForm() {
    setForm(null);
    setError("");
  }

  function setField<K extends keyof YardForm>(key: K, value: YardForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !dossier) return;
    const res = checkYardLog(form, dossier, mine, Date.now());
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => addYardLog(d, dossier.id, form));
    toast("ok", "Ghi nhận xe vào/ra bãi thành công.");
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
    insideIds,
    mine,
    form,
    error,
    openForm,
    closeForm,
    setField,
    submit,
  };
}
