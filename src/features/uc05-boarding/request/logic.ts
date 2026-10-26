"use client";

/** UC5 - Nhà xe gửi yêu cầu điều chỉnh giờ đón khách. */
import { useState } from "react";
import { hmOf, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import { fail, ok, type Data, type Result, type Trip } from "@/types";
import { msOf } from "../rules";

/** Giờ mong muốn phải hợp lệ, từ hiện tại trở đi và khác giờ đã gán */
export function checkRequest(t: Trip, desired: string, now: number): Result {
  if (!t.boarding) return fail("Chuyến chưa có giờ đón khách.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(desired))
    return fail("Chưa chọn giờ mong muốn.");
  if (msOf(t.date, desired) < now)
    return fail("Giờ mong muốn phải từ thời điểm hiện tại trở đi.");
  if (desired === t.boarding.startAt)
    return fail("Giờ mong muốn trùng với giờ đón khách đã được sắp xếp.");
  return ok("");
}

export function requestAdjustment(
  data: Data,
  tripId: string,
  desired: string,
  note: string,
): Data {
  return {
    ...data,
    trips: data.trips.map((t): Trip =>
      t.id === tripId && t.boarding
        ? {
            ...t,
            boarding: {
              ...t.boarding,
              status: "adjusting",
              request: {
                desiredStart: desired,
                note: note.trim(),
                requestedAt: todayISO(),
              },
            },
          }
        : t,
    ),
  };
}

export function useAdjustRequest(trip: Trip) {
  const { update, toast, data } = useStore();
  const [open, setOpen] = useState(false);
  const [desired, setDesired] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function begin() {
    // Gợi ý mặc định: 30 phút sau giờ đón đã gán, hoặc sau hiện tại nếu đã qua
    const base = trip.boarding
      ? msOf(trip.date, trip.boarding.startAt)
      : Date.now();
    setDesired(hmOf(Math.max(base, Date.now()) + 30 * 60_000));
    setNote("");
    setError("");
    setOpen(true);
  }

  function cancel() {
    setOpen(false);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = checkRequest(trip, desired, Date.now());
    if (!res.ok) {
      setError(res.message);
      return;
    }
    update((d) => requestAdjustment(d, trip.id, desired, note));
    toast("ok", "Đã gửi yêu cầu điều chỉnh giờ đón khách.");
    setOpen(false);
  }

  return {
    open,
    desired,
    setDesired,
    note,
    setNote,
    error,
    begin,
    cancel,
    submit,
    bayCode: data.bays.find((b) => b.id === trip.boarding?.bayId)?.code ?? "-",
  };
}
