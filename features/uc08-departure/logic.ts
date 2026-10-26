"use client";

/**
 * UC8.1 - Kiểm tra xe xuất bến (nhân viên an ninh trật tự): điền phiếu kiểm tra, đạt thì cấp lệnh xuất bến.
 */
import { useMemo, useState } from "react";
import { localDateTime, matches, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Trip } from "@/types";
import { routeName } from "../uc04-trips/trip";
import {
  autoItems,
  checkInspection,
  emptyForm,
  inspectionState,
  saveInspection,
  type InspectionForm,
  type InspectionState,
} from "./rules";

export type InspectionFilter = InspectionState | "all";

export function useInspections() {
  const { data, user, update, toast } = useStore();
  const now = useNow();

  const [filter, setFilter] = useState<InspectionFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<InspectionForm>(emptyForm());
  const [error, setError] = useState("");

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );

  const eligible = useMemo(
    () => data.trips.filter((t) => inspectionState(t, now) !== null),
    [data.trips, now],
  );

  const list = useMemo(
    () =>
      eligible
        .filter((t) =>
          filter === "all" ? true : inspectionState(t, now) === filter,
        )
        .filter((t) =>
          query.trim()
            ? matches(
                `${carrierOf.get(t.dossierId) ?? ""} ${t.plate} ${t.driverName} ${routeName(data.routes, t.routeId)}`,
                query,
              )
            : true,
        )
        // Chờ kiểm tra lên đầu theo giờ xuất bến, rồi không đạt, rồi đã cấp lệnh
        .sort((a, b) => {
          const rank = { pending: 0, failed: 1, passed: 2 } as const;
          return (
            rank[inspectionState(a, now)!] - rank[inspectionState(b, now)!] ||
            `${a.date}${a.departAt}`.localeCompare(`${b.date}${b.departAt}`)
          );
        }),
    [eligible, filter, query, now, carrierOf, data.routes],
  );

  const counts = useMemo<Record<InspectionFilter, number>>(() => {
    const c = { all: eligible.length, pending: 0, failed: 0, passed: 0 };
    for (const t of eligible) c[inspectionState(t, now)!] += 1;
    return c;
  }, [eligible, now]);

  const current = data.trips.find((t) => t.id === openId) ?? null;
  const dossier = data.dossiers.find((d) => d.id === current?.dossierId);
  const auto = useMemo(
    () => (current && dossier ? autoItems(current, dossier, todayISO()) : []),
    [current, dossier],
  );

  /** Mở phiếu kiểm tra của chuyến */
  function openTrip(t: Trip) {
    setOpenId(t.id);
    setForm(emptyForm());
    setError("");
  }

  function close() {
    setOpenId(null);
    setError("");
  }

  /** Đánh dấu Đạt / Không đạt và nhập lý do cho một hạng mục */
  function setItem(
    key: string,
    patch: Partial<InspectionForm["items"][string]>,
  ) {
    setForm((f) => ({
      ...f,
      items: { ...f.items, [key]: { ...f.items[key], ...patch } },
    }));
    setError("");
  }

  function setField(key: "passengers" | "cargoKg", value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !user) return;
    const res = checkInspection(form, current);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const out = saveInspection(
      data,
      current.id,
      form,
      user.fullName || user.phone,
      localDateTime(Date.now()),
      todayISO(),
    );
    update(() => out.data);
    if (out.passed) toast("ok", "Cấp lệnh xuất bến thành công.");
    else
      toast(
        "warn",
        `Kiểm tra không đạt, không cấp lệnh xuất bến cho xe ${current.plate}.`,
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
    routes: data.routes,
    carrierOf,
    current,
    auto,
    form,
    error,
    openTrip,
    close,
    setItem,
    setField,
    submit,
    now,
  };
}
