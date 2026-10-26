"use client";

/**
 * UC6, UC8.2 - Trạm cổng: tài xế quẹt thẻ, hệ thống đối chiếu rồi tạo yêu cầu cho nhân viên duyệt;
 * thẻ không hợp lệ thì báo từ chối, không tạo yêu cầu.
 */
import { useMemo, useState } from "react";
import { todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Driver, Dossier, EntryKind, Trip } from "@/types";
import { buildEntry, cardUid, ENTRY_GATE, gateOf, readCard } from "../rules";

export const UNKNOWN_CARD = "NFC-0000-LA";

export interface Card {
  uid: string;
  driver: Driver;
  dossier: Dossier;
  trip: Trip;
}

export function useKiosk() {
  const { data, update } = useStore();

  const [kind, setKindState] = useState<EntryKind>("entry");
  const [gate, setGate] = useState<string>(ENTRY_GATE);
  const [cameraPlate, setCameraPlate] = useState("");
  const [lastId, setLastId] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  /**
   * Thẻ hiện trên trạm: khi vào bến là tài xế có chuyến hôm nay chưa vào bến;
   * khi ra bến là tài xế của các xe đang ở trong bến chưa xuất bến. Theo giờ chuyến.
   */
  const cards = useMemo<Card[]>(() => {
    const out: Card[] = [];
    const today = todayISO();
    const seen = new Set<string>();
    const trips = [...data.trips].sort((a, b) =>
      a.departAt.localeCompare(b.departAt),
    );
    for (const t of trips) {
      if (t.status !== "active") continue;
      if (
        kind === "entry"
          ? t.arrival || t.date !== today
          : !t.arrival || t.departure
      )
        continue;
      if (seen.has(t.driverId)) continue;
      const dossier = data.dossiers.find((d) => d.id === t.dossierId);
      const driver = dossier?.drivers.find((d) => d.id === t.driverId);
      if (!dossier || !driver) continue;
      seen.add(driver.id);
      out.push({ uid: cardUid(driver.id), driver, dossier, trip: t });
    }
    return out;
  }, [data.trips, data.dossiers, kind]);

  const plates = useMemo(
    () =>
      data.dossiers
        .filter((d) => d.everApproved)
        .flatMap((d) => d.vehicles.map((v) => v.plate))
        .sort(),
    [data.dossiers],
  );

  const entry = data.entries.find((e) => e.id === lastId) ?? null;
  const trip = entry?.tripId
    ? (data.trips.find((t) => t.id === entry.tripId) ?? null)
    : null;
  const bayCode =
    data.bays.find((b) => b.id === trip?.boarding?.bayId)?.code ?? null;

  function swipe(uid: string, plateOfCard?: string) {
    setInvalid(false);
    const card = readCard(data.dossiers, uid);
    if (!card) {
      setLastId(null);
      setInvalid(true);
      return;
    }
    const now = Date.now();
    const built = buildEntry({
      data,
      kind,
      uid,
      gate,
      plate: cameraPlate || plateOfCard || "",
      now,
    });
    if (!built) {
      setInvalid(true);
      return;
    }
    // Đã có yêu cầu cho chuyến này thì không tạo trùng
    const dup = built.tripId
      ? data.entries.find(
          (e) =>
            (e.kind ?? "entry") === kind &&
            e.tripId === built.tripId &&
            e.status !== "rejected" &&
            e.driverId === built.driverId,
        )
      : undefined;
    if (dup) {
      setLastId(dup.id);
      return;
    }
    update((d) => ({ ...d, entries: [...d.entries, built] }));
    setLastId(built.id);
  }

  /** Chọn hướng: vào bến hoặc ra bến; cổng chuyển về cổng đúng của hướng đó */
  function setKind(k: EntryKind) {
    setKindState(k);
    setGate(gateOf(k));
    setLastId(null);
    setInvalid(false);
  }

  function reset() {
    setLastId(null);
    setInvalid(false);
  }

  return {
    kind,
    setKind,
    gate,
    setGate,
    cameraPlate,
    setCameraPlate,
    cards,
    plates,
    entry,
    trip,
    bayCode,
    invalid,
    swipe,
    reset,
  };
}
