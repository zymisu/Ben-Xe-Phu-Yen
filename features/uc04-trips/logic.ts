"use client";

/** UC4 - Nhà xe đăng ký, cập nhật và xóa chuyến xe. */
import { useMemo, useState } from "react";
import { matches, todayISO } from "@/lib/format";
import { submitChange } from "@/lib/review";
import { useStore } from "@/lib/store";
import { useNow } from "@/lib/useNow";
import type { Data, Trip, TripState } from "@/types";
import {
  checkTrip,
  checkUpdateWindow,
  EMPTY_TRIP_FORM,
  isExpired,
  tripState,
  pickTripInfo,
  routeName,
  toTripForm,
  toTripInfo,
  type TripForm,
} from "./trip";

/** Lưu yêu cầu đăng ký chuyến mới */
export function registerTrip(
  data: Data,
  dossierId: string,
  form: TripForm,
): Data {
  const dossier = data.dossiers.find((d) => d.id === dossierId);
  if (!dossier) return data;
  const now = todayISO();
  const trip: Trip = {
    ...toTripInfo(form, dossier),
    id: `ch-${Date.now()}`,
    dossierId,
    status: "receiving",
    everApproved: false,
    createdAt: now,
  };
  return { ...data, trips: [...data.trips, trip] };
}

/** Ghi nội dung nhà xe vừa nộp theo trạng thái hiện tại của chuyến */
export function submitTripChange(
  data: Data,
  tripId: string,
  form: TripForm,
): Data {
  const owner = data.trips.find((t) => t.id === tripId);
  const dossier = data.dossiers.find((d) => d.id === owner?.dossierId);
  if (!dossier) return data;
  const info = toTripInfo(form, dossier);
  const now = todayISO();
  return {
    ...data,
    trips: data.trips.map((t): Trip => {
      if (t.id !== tripId) return t;
      const next = submitChange(t, info);
      return t.everApproved ? next : { ...next, createdAt: now };
    }),
  };
}

/** Xóa chuyến - chỉ khi chuyến còn chờ tiếp nhận */
export function removeTrip(data: Data, tripId: string): Data {
  return {
    ...data,
    trips: data.trips.filter(
      (t) => !(t.id === tripId && t.status === "receiving"),
    ),
  };
}

/** Chuyến sắp tới xếp trước theo thứ tự gần nhất, chuyến đã qua xếp sau */
export function byDeparture(now: number) {
  return (a: Trip, b: Trip): number => {
    const ka = `${a.date}${a.departAt}`;
    const kb = `${b.date}${b.departAt}`;
    const pa = isExpired(a, now);
    const pb = isExpired(b, now);
    if (pa !== pb) return pa ? 1 : -1;
    return pa ? kb.localeCompare(ka) : ka.localeCompare(kb);
  };
}

// hook

export type TripFilter = TripState | "all";

export function useTrips() {
  const { data, user, update, toast } = useStore();
  const dossier = data.dossiers.find((d) => d.accountId === user?.id) ?? null;
  const canRegister = !!dossier?.everApproved;
  const now = useNow();
  const stateOf = (t: Trip) => tripState(t, now);

  const [filter, setFilter] = useState<TripFilter>("all");
  const [query, setQuery] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewError, setViewError] = useState("");
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(EMPTY_TRIP_FORM);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const mine = useMemo(
    () => data.trips.filter((t) => t.dossierId === dossier?.id),
    [data.trips, dossier?.id],
  );

  const list = useMemo(
    () =>
      mine
        .filter((t) => (filter === "all" ? true : tripState(t, now) === filter))
        .filter((t) =>
          query.trim()
            ? matches(
                `${t.plate} ${t.driverName} ${t.driverPhone} ${routeName(data.routes, t.routeId)} ${t.date}`,
                query,
              )
            : true,
        )
        .sort(byDeparture(now)),
    [mine, filter, query, data.routes, now],
  );

  const counts = useMemo<Record<TripFilter, number>>(
    () => ({
      all: mine.length,
      receiving: mine.filter((t) => tripState(t, now) === "receiving").length,
      active: mine.filter((t) => tripState(t, now) === "active").length,
      updating: mine.filter((t) => tripState(t, now) === "updating").length,
      rejected: mine.filter((t) => tripState(t, now) === "rejected").length,
      expired: mine.filter((t) => tripState(t, now) === "expired").length,
    }),
    [mine, now],
  );

  const viewing = mine.find((t) => t.id === viewId) ?? null;

  function openView(id: string) {
    setViewId(id);
    setViewError("");
    setConfirmDelete(false);
  }

  function closeView() {
    setViewId(null);
    setViewError("");
    setConfirmDelete(false);
  }

  /** Mở biểu mẫu đăng ký chuyến */
  function openCreate() {
    setForm(EMPTY_TRIP_FORM);
    setFormError("");
    setEditId(null);
    setMode("create");
  }

  /** Cập nhật chuyến đã duyệt phải qua quy tắc 7 ngày; nộp lại chuyến bị từ chối thì không */
  function openEdit(t: Trip) {
    if (isExpired(t, now)) return;
    if (t.status === "active") {
      const res = checkUpdateWindow(t);
      if (!res.ok) {
        setViewError(res.message);
        return;
      }
    }
    setForm(toTripForm(t.request ?? pickTripInfo(t)));
    setFormError("");
    setEditId(t.id);
    closeView();
    setMode("edit");
  }

  function closeForm() {
    setMode(null);
    setFormError("");
  }

  function setField<K extends keyof TripForm>(key: K, value: TripForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!dossier) return;
    const res = checkTrip(form, dossier);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    if (mode === "create") {
      update((d) => registerTrip(d, dossier.id, form));
      toast("ok", "Gửi yêu cầu đăng ký chuyến xe thành công.");
    } else if (editId) {
      const t = data.trips.find((x) => x.id === editId);
      update((d) => submitTripChange(d, editId, form));
      toast(
        "ok",
        t?.everApproved
          ? "Đã gửi yêu cầu cập nhật chuyến xe."
          : "Đã nộp lại yêu cầu đăng ký chuyến xe.",
      );
    }
    closeForm();
  }

  function remove() {
    if (!viewing || stateOf(viewing) !== "receiving") return;
    update((d) => removeTrip(d, viewing.id));
    toast("ok", "Đã xóa chuyến xe.");
    closeView();
  }

  return {
    dossier,
    canRegister,
    stateOf,
    list,
    counts,
    filter,
    setFilter,
    query,
    setQuery,
    viewing,
    viewError,
    openView,
    closeView,
    mode,
    form,
    formError,
    openCreate,
    openEdit,
    closeForm,
    setField,
    submit,
    confirmDelete,
    setConfirmDelete,
    remove,
    routes: data.routes,
    vehicles: dossier?.vehicles ?? [],
    drivers: dossier?.drivers ?? [],
  };
}
