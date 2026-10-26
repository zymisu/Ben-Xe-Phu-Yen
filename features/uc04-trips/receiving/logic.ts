"use client";

/** UC4 - Nhân viên tiếp nhận duyệt hoặc từ chối chuyến xe, xem bản cũ cạnh bản đề nghị. */
import { useMemo, useState } from "react";
import { matches } from "@/lib/format";
import { checkRejection, decide } from "@/lib/review";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Data, Trip, TripState } from "@/types";
import { byDeparture } from "../logic";
import { isAwaitingState, routeName, tripState } from "../trip";

/** Ghi kết quả duyệt vào chuyến */
export function writeTripDecision(
  data: Data,
  tripId: string,
  decision: "approve" | "reject",
  reviewerName: string,
  rejectReason?: string,
): Data {
  return {
    ...data,
    trips: data.trips.map((t): Trip => {
      if (t.id !== tripId) return t;
      const next = decide(t, decision, reviewerName, rejectReason);
      // Đổi ngày hoặc giờ khởi hành thì giờ đón khách đã xếp không còn đúng, xếp lại từ đầu
      if (
        next.boarding &&
        (next.date !== t.date || next.departAt !== t.departAt)
      ) {
        return { ...next, boarding: undefined };
      }
      return next;
    }),
  };
}

export type TripFilter = TripState | "all";

export function useTripRequests() {
  const { data, user, update, toast } = useStore();
  const now = useNow();
  const stateOf = (t: Trip) => tripState(t, now);

  const [filter, setFilter] = useState<TripFilter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );

  const list = useMemo(
    () =>
      data.trips
        .filter((t) => (filter === "all" ? true : tripState(t, now) === filter))
        .filter((t) =>
          query.trim()
            ? matches(
                `${carrierOf.get(t.dossierId) ?? ""} ${t.plate} ${t.driverName} ${routeName(data.routes, t.routeId)} ${t.date}`,
                query,
              )
            : true,
        )
        // Chuyến đang chờ xử lý lên đầu, còn lại theo ngày xuất bến
        .sort(
          (a, b) =>
            Number(isAwaitingState(tripState(b, now))) -
              Number(isAwaitingState(tripState(a, now))) ||
            byDeparture(now)(a, b),
        ),
    [data.trips, data.routes, filter, query, carrierOf, now],
  );

  const counts = useMemo<Record<TripFilter, number>>(
    () => ({
      all: data.trips.length,
      receiving: data.trips.filter((t) => tripState(t, now) === "receiving")
        .length,
      active: data.trips.filter((t) => tripState(t, now) === "active").length,
      updating: data.trips.filter((t) => tripState(t, now) === "updating")
        .length,
      rejected: data.trips.filter((t) => tripState(t, now) === "rejected")
        .length,
      expired: data.trips.filter((t) => tripState(t, now) === "expired").length,
    }),
    [data.trips, now],
  );

  const current = data.trips.find((t) => t.id === openId) ?? null;

  function openTrip(id: string) {
    setOpenId(id);
    setRejecting(false);
    setReason("");
    setError("");
  }

  function closeTrip() {
    setOpenId(null);
    setError("");
  }

  function approve() {
    if (!current || !user || stateOf(current) === "expired") return;
    update((d) =>
      writeTripDecision(d, current.id, "approve", user.fullName || user.phone),
    );
    toast(
      "ok",
      current.status === "updating"
        ? "Đã duyệt yêu cầu cập nhật chuyến xe."
        : "Đã duyệt chuyến xe.",
    );
    closeTrip();
  }

  function reject() {
    if (!current || !user || stateOf(current) === "expired") return;
    const res = checkRejection(reason);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) =>
      writeTripDecision(
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
        ? "Đã từ chối yêu cầu cập nhật chuyến xe."
        : "Đã từ chối chuyến xe.",
    );
    closeTrip();
  }

  return {
    stateOf,
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    routes: data.routes,
    carrierOf,
    current,
    openTrip,
    closeTrip,
    rejecting,
    setRejecting,
    reason,
    setReason,
    error,
    approve,
    reject,
  };
}
