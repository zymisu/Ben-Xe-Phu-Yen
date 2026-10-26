"use client";

/** UC5 - Nhân viên điều độ trong nhà chọn giờ, vị trí đón khách và xử lý yêu cầu điều chỉnh giờ. */
import { useMemo, useState } from "react";
import { formatDate, hmOf, matches, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import { type BoardingState, type Data, type Trip } from "@/types";
import { routeName } from "../uc04-trips/trip";
import {
  BOARD_MINUTES,
  bayStatuses,
  boardingState,
  checkBoarding,
  conflictIds,
  msOf,
  needsBoarding,
  slotOf,
} from "./rules";

/** Lưu thông tin đón khách; xử lý xong thì yêu cầu điều chỉnh được đóng */
export function assignBoarding(
  data: Data,
  tripId: string,
  bayId: string,
  startAt: string,
  byName: string,
): Data {
  return {
    ...data,
    trips: data.trips.map((t): Trip => {
      if (t.id !== tripId) return t;
      const old = t.boarding;
      return {
        ...t,
        boarding: {
          bayId,
          startAt,
          status: "assigned",
          assignedBy: byName,
          assignedAt: todayISO(),
          previousStart:
            old && old.startAt !== startAt ? old.startAt : old?.previousStart,
        },
      };
    }),
  };
}

/** Giờ đón gợi ý: 15 phút trước giờ trên vé, không sớm hơn thời điểm hiện tại */
export function suggestStart(t: Trip, now: number): string {
  const ideal = msOf(t.date, t.departAt) - BOARD_MINUTES * 60_000;
  const step = 5 * 60_000;
  return hmOf(Math.max(ideal, Math.ceil(now / step) * step));
}

/**
 * Giờ đón mặc định khi mở một chuyến: giờ nhà xe mong muốn, hoặc giờ đã gán;
 * nếu giờ đó đã qua (cửa sổ đón đã bắt đầu mà vẫn phải xếp lại) thì lấy mốc 5
 * phút kế tiếp, vì giờ đón phải từ thời điểm hiện tại trở đi.
 */
export function defaultStart(t: Trip, now: number): string {
  const wanted = t.boarding?.request?.desiredStart ?? t.boarding?.startAt;
  if (!wanted) return suggestStart(t, now);
  const step = 5 * 60_000;
  return msOf(t.date, wanted) < now
    ? hmOf(Math.ceil(now / step) * step)
    : wanted;
}

export type BoardingFilter = BoardingState | "all";

export function useBoarding() {
  const { data, user, update, toast } = useStore();
  const now = useNow();

  const [filter, setFilter] = useState<BoardingFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [bayId, setBayId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [error, setError] = useState("");

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );
  const bayOf = useMemo(
    () => new Map(data.bays.map((b) => [b.id, b])),
    [data.bays],
  );
  const conflicts = useMemo(
    () => conflictIds(data.trips, data.bayAdjustments, now),
    [data.trips, data.bayAdjustments, now],
  );
  const stateOf = (t: Trip) => boardingState(t, conflicts);

  const eligible = useMemo(
    () => data.trips.filter((t) => needsBoarding(t, now)),
    [data.trips, now],
  );

  const list = useMemo(
    () =>
      eligible
        .filter((t) =>
          filter === "all" ? true : boardingState(t, conflicts) === filter,
        )
        .filter((t) =>
          query.trim()
            ? matches(
                `${carrierOf.get(t.dossierId) ?? ""} ${t.plate} ${routeName(data.routes, t.routeId)} ${bayOf.get(t.boarding?.bayId ?? "")?.code ?? ""}`,
                query,
              )
            : true,
        )
        // Việc cần xử lý lên đầu, rồi theo giờ khởi hành
        .sort(
          (a, b) =>
            Number(boardingState(b, conflicts) !== "assigned") -
              Number(boardingState(a, conflicts) !== "assigned") ||
            `${a.date}${a.departAt}`.localeCompare(`${b.date}${b.departAt}`),
        ),
    [eligible, filter, query, conflicts, carrierOf, bayOf, data.routes],
  );

  const counts = useMemo<Record<BoardingFilter, number>>(() => {
    const c = {
      all: eligible.length,
      pending: 0,
      assigned: 0,
      adjusting: 0,
      conflict: 0,
    };
    for (const t of eligible) c[boardingState(t, conflicts)] += 1;
    return c;
  }, [eligible, conflicts]);

  const current = data.trips.find((t) => t.id === openId) ?? null;

  /** Mở biểu mẫu chọn giờ và vị trí đón khách */
  function openTrip(t: Trip) {
    setOpenId(t.id);
    setError("");
    setBayId(t.boarding?.bayId ?? "");
    setStartAt(defaultStart(t, now));
  }

  function closeTrip() {
    setOpenId(null);
    setError("");
  }

  /** Tình trạng từng vị trí trong khung giờ đang chọn, để nhân viên thấy mật độ */
  const statuses = useMemo(
    () =>
      current && /^\d\d:\d\d$/.test(startAt)
        ? bayStatuses(
            data.bays,
            data.trips,
            data.bayAdjustments,
            current.date,
            startAt,
            current.id,
          )
        : [],
    [current, startAt, data.bays, data.trips, data.bayAdjustments],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || !user) return;
    const res = checkBoarding({
      trip: current,
      trips: data.trips,
      bays: data.bays,
      adjustments: data.bayAdjustments,
      bayId,
      startAt,
      now: Date.now(),
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) =>
      assignBoarding(
        d,
        current.id,
        bayId,
        startAt,
        user.fullName || user.phone,
      ),
    );
    toast(
      "ok",
      current.boarding?.request
        ? "Đã điều chỉnh giờ đón khách."
        : "Sắp xếp xe đón khách thành công.",
    );
    closeTrip();
  }

  return {
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    routes: data.routes,
    bays: data.bays,
    carrierOf,
    bayOf,
    stateOf,
    effectiveSlot: (t: Trip) => slotOf(t, data.bayAdjustments),
    current,
    openTrip,
    closeTrip,
    bayId,
    setBayId: (id: string) => {
      setBayId(id);
      setError("");
    },
    startAt,
    setStartAt: (v: string) => {
      setStartAt(v);
      setError("");
    },
    statuses,
    error,
    submit,
    describe: (t: Trip) => `${formatDate(t.date)} lúc ${t.departAt}`,
  };
}
