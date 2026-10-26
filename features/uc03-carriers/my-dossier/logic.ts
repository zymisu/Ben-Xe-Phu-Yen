"use client";

/** UC3 - Nhà xe theo dõi hồ sơ, nộp lại khi bị từ chối và gửi yêu cầu cập nhật. */
import { useEffect, useMemo, useState } from "react";
import { submitChange } from "@/lib/review";
import { todayISO } from "@/lib/format";
import { useNow } from "@/lib/useNow";
import { useStore } from "@/lib/store";
import { resourceUsage } from "@/features/uc04-trips/trip";
import type { Data, Dossier } from "@/types";
import {
  checkNoRemovedInUse,
  checkProfile,
  pickInfo,
  toInfo,
  toProfile,
  type Profile,
} from "../profile";

/** Ghi nội dung đơn vị vừa nộp vào hồ sơ theo trạng thái hiện tại */
export function submitDossierChange(
  data: Data,
  dossierId: string,
  profile: Profile,
): Data {
  const info = toInfo(profile);
  const now = todayISO();
  return {
    ...data,
    dossiers: data.dossiers.map((d): Dossier => {
      if (d.id !== dossierId) return d;
      const next = submitChange(d, info);
      return d.everApproved ? next : { ...next, submittedAt: now };
    }),
  };
}

export function useMyDossier() {
  const { data, user, update, toast } = useStore();
  const d = data.dossiers.find((x) => x.accountId === user?.id) ?? null;

  // Thông báo duyệt chỉ hiện trong lần đăng nhập đầu tiên sau khi có kết quả:
  // chốt cờ lúc mở trang, rồi đánh dấu đã xem để lần sau không hiện lại.
  const [showApproved] = useState(
    () => d?.status === "active" && d.resultSeen === false,
  );
  const dossierId = d?.id;
  useEffect(() => {
    if (!showApproved || !dossierId) return;
    update((x) => ({
      ...x,
      dossiers: x.dossiers.map((h) =>
        h.id === dossierId ? { ...h, resultSeen: true } : h,
      ),
    }));
  }, [showApproved, dossierId, update]);

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  const now = useNow();
  const usage = useMemo(
    () => resourceUsage(data.trips, d?.id ?? "", now),
    [data.trips, d?.id, now],
  );

  const canEdit = d?.status === "active" || d?.status === "rejected";

  function openEditor() {
    if (!d) return;
    setProfile(toProfile(d.request ?? pickInfo(d)));
    setError("");
    setEditing(true);
  }

  function closeEditor() {
    setEditing(false);
    setError("");
  }

  function setField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d || !profile) return;
    const res = checkProfile(profile);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const guard = checkNoRemovedInUse(profile, pickInfo(d), usage);
    if (!guard.ok) {
      setError(guard.message);
      return;
    }
    update((x) => submitDossierChange(x, d.id, profile));
    toast(
      "ok",
      d.everApproved
        ? "Đã gửi yêu cầu cập nhật hồ sơ tới bến xe."
        : "Đã nộp lại hồ sơ tới bến xe.",
    );
    closeEditor();
  }

  return {
    dossier: d,
    showApproved,
    canEdit,
    usage,
    editing,
    profile,
    error,
    openEditor,
    closeEditor,
    setField,
    submit,
  };
}
