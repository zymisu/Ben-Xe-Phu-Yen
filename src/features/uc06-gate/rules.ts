/** Quy tắc kiểm soát cổng: đọc thẻ NFC, ghép chuyến, đối chiếu và tạo yêu cầu duyệt. Không có React. */
import { localDateTime, todayISO } from "@/lib/format";
import { normalizePlate } from "@/lib/rules";
import type {
  Data,
  Dossier,
  Driver,
  EntryCheck,
  EntryKind,
  EntryRequest,
  Trip,
} from "@/types";

/** Bến có hai cổng: Cổng 1 để xe vào, Cổng 2 để xe ra */
export const GATES = ["Cổng 1", "Cổng 2"] as const;
export const ENTRY_GATE = "Cổng 1";
export const EXIT_GATE = "Cổng 2";

/** Cổng đúng cho từng hướng đi */
export const gateOf = (kind: EntryKind): string =>
  kind === "entry" ? ENTRY_GATE : EXIT_GATE;

/** Mã thẻ NFC của tài xế, cấp theo mã tài xế trong hồ sơ nhà xe */
export const cardUid = (driverId: string): string =>
  `NFC-${driverId.toUpperCase()}`;

/** Đọc thẻ: tìm tài xế và nhà xe sở hữu thẻ; thẻ lạ thì không có */
export function readCard(
  dossiers: Dossier[],
  uid: string,
): { driver: Driver; dossier: Dossier } | null {
  for (const dossier of dossiers) {
    if (!dossier.everApproved) continue;
    const driver = dossier.drivers.find((d) => cardUid(d.id) === uid);
    if (driver) return { driver, dossier };
  }
  return null;
}

const departAtMs = (t: Trip) =>
  new Date(`${t.date}T${t.departAt}:00`).getTime();

/**
 * Chuyến hệ thống ghép khi vào bến: chuyến hôm nay đã duyệt của tài xế, chưa
 * vào bến, gần giờ hiện tại nhất.
 */
export function pickTrip(
  trips: Trip[],
  driverId: string,
  dossierId: string,
  now: number,
): Trip | null {
  const today = todayISO();
  const mine = trips.filter(
    (t) =>
      t.dossierId === dossierId &&
      t.driverId === driverId &&
      t.status === "active" &&
      t.date === today &&
      !t.arrival,
  );
  return (
    mine.sort(
      (a, b) => Math.abs(departAtMs(a) - now) - Math.abs(departAtMs(b) - now),
    )[0] ?? null
  );
}

/**
 * Chuyến hệ thống ghép khi ra bến: xe đang ở trong bến chưa xuất bến. Ưu tiên
 * chuyến khớp biển số camera; không có thì lấy chuyến của tài xế. Chuyến đã có
 * lệnh xuất bến được ưu tiên.
 */
export function pickExitTrip(
  trips: Trip[],
  dossierId: string,
  driverId: string,
  plate: string,
  now: number,
): Trip | null {
  const inYard = trips.filter(
    (t) =>
      t.dossierId === dossierId &&
      t.status === "active" &&
      t.arrival &&
      !t.departure,
  );
  const byPlate = plate
    ? inYard.filter((t) => normalizePlate(t.plate) === normalizePlate(plate))
    : [];
  const pool = byPlate.length
    ? byPlate
    : inYard.filter((t) => t.driverId === driverId);
  return (
    pool.sort(
      (a, b) =>
        Number(!!b.departureOrder) - Number(!!a.departureOrder) ||
        Math.abs(departAtMs(a) - now) - Math.abs(departAtMs(b) - now),
    )[0] ?? null
  );
}

/** Đối chiếu từng mục để nhân viên xem trên form yêu cầu */
export function runChecks(args: {
  kind: EntryKind;
  trip: Trip | null;
  dossier: Dossier;
  driver: Driver;
  plate: string;
  gate: string;
}): EntryCheck[] {
  const { kind, trip, dossier, driver, plate, gate } = args;
  const today = todayISO();
  const vehicle = trip
    ? dossier.vehicles.find((v) => v.id === trip.vehicleId)
    : undefined;
  const noTrip = "Không có chuyến để đối chiếu";

  const expiry = (
    key: string,
    label: string,
    date: string | undefined,
  ): EntryCheck => {
    if (!vehicle || !date) return { key, label, ok: false, detail: noTrip };
    const ok = date >= today;
    return {
      key,
      label,
      ok,
      detail: `${ok ? "Còn hạn" : "Đã hết hạn"} ${date.split("-").reverse().join("/")}`,
    };
  };

  const plateCheck: EntryCheck = {
    key: "plate",
    label: "Biển số khớp chuyến",
    ok: !!trip && normalizePlate(plate) === normalizePlate(trip.plate),
    detail: trip ? `Camera ${plate || "-"}, chuyến ${trip.plate}` : noTrip,
  };
  const gateCheck: EntryCheck = {
    key: "gate",
    label: "Đúng cổng",
    ok: gate === gateOf(kind),
    detail:
      gate === gateOf(kind)
        ? `${gate} là cổng ${kind === "entry" ? "vào" : "ra"}`
        : `${gate} không phải cổng ${kind === "entry" ? "vào" : "ra"}, xe ${kind === "entry" ? "vào" : "ra"} bến qua ${gateOf(kind)}`,
  };

  if (kind === "exit") {
    return [
      {
        key: "driver",
        label: "Tài xế đúng người trong chuyến",
        ok: !!trip && trip.driverId === driver.id,
        detail: trip
          ? `Chuyến của ${trip.driverName}, thẻ của ${driver.name}`
          : noTrip,
      },
      plateCheck,
      {
        key: "inyard",
        label: "Xe đang ở trong bến",
        ok: !!trip,
        detail: trip
          ? `Vào bến lúc ${trip.arrival?.at.split("T")[1]}`
          : "Không có xe nào của tài xế đang ở trong bến",
      },
      {
        key: "order",
        label: "Có lệnh xuất bến",
        ok: !!trip?.departureOrder,
        detail: trip?.departureOrder
          ? `Lệnh ${trip.departureOrder.code}`
          : "Chưa được kiểm tra đạt, chưa cấp lệnh xuất bến",
      },
      gateCheck,
    ];
  }

  return [
    {
      key: "trip",
      label: "Tài xế có chuyến hôm nay",
      ok: !!trip,
      detail: trip
        ? `Chuyến ${trip.departAt}, ${trip.plate}`
        : "Không có chuyến đã duyệt chưa vào bến",
    },
    plateCheck,
    expiry("inspection", "Kiểm định còn hạn", vehicle?.inspectionExpiry),
    expiry("insurance", "Bảo hiểm còn hạn", vehicle?.insuranceExpiry),
    gateCheck,
  ];
}

/** Tạo yêu cầu duyệt ở trạng thái chờ nhân viên */
export function buildEntry(args: {
  data: Pick<Data, "dossiers" | "trips">;
  kind?: EntryKind;
  uid: string;
  gate: string;
  plate: string;
  now: number;
}): EntryRequest | null {
  const kind = args.kind ?? "entry";
  const card = readCard(args.data.dossiers, args.uid);
  if (!card) return null;
  const trip =
    kind === "entry"
      ? pickTrip(args.data.trips, card.driver.id, card.dossier.id, args.now)
      : pickExitTrip(
          args.data.trips,
          card.dossier.id,
          card.driver.id,
          args.plate,
          args.now,
        );
  const plate = args.plate || trip?.plate || "";
  return {
    id: `vb-${args.now}`,
    kind,
    gate: args.gate,
    cardUid: args.uid,
    driverId: card.driver.id,
    driverName: card.driver.name,
    dossierId: card.dossier.id,
    tripId: trip?.id,
    plate,
    requestedAt: localDateTime(args.now),
    checks: runChecks({
      kind,
      trip,
      dossier: card.dossier,
      driver: card.driver,
      plate,
      gate: args.gate,
    }),
    status: "pending",
  };
}

export const allPass = (e: EntryRequest): boolean =>
  e.checks.every((c) => c.ok);
