/**
 * Dữ liệu mẫu: lịch chạy và vòng đời mỗi chuyến, từ đăng ký đến xe ra bến.
 * Mỗi xe, mỗi tài xế chỉ chạy một chuyến tại một thời điểm.
 */
import {
  autoItems,
  cargoLimit,
  MANUAL_ITEMS,
} from "@/features/uc08-departure/rules";
import {
  cardUid,
  ENTRY_GATE,
  EXIT_GATE,
  runChecks,
} from "@/features/uc06-gate/rules";
import type {
  Bay,
  Data,
  Dossier,
  EntryRequest,
  Inspection,
  InspectionItem,
  Route,
  Trip,
  TripInfo,
  YardLog,
} from "@/types";
import { CARRIER_ROUTES } from "./carriers";
import { byRole } from "./people";
import {
  at,
  between,
  chance,
  dateOf,
  dayOf,
  DAY,
  HOUR,
  MIN,
  pick,
  round5,
  stamp,
  type Rnd,
} from "./util";

const SHORT = [
  "05:30",
  "06:30",
  "07:30",
  "08:30",
  "09:30",
  "10:30",
  "11:30",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];
const MID = [
  "05:45",
  "06:30",
  "08:00",
  "09:30",
  "11:00",
  "13:30",
  "15:00",
  "16:30",
];
const LONG = ["05:45", "06:30", "13:00", "17:30", "19:30", "20:15", "21:45"];

const slotsFor = (minutes: number) =>
  minutes <= 200 ? SHORT : minutes <= 420 ? MID : LONG;

const REJECT_REASONS = [
  "Biển số xe chưa có trong danh sách phương tiện của hồ sơ nhà xe. Đề nghị kiểm tra lại biển số.",
  "Giờ xuất bến đề nghị trùng với chuyến khác của nhà xe trên cùng tuyến.",
  "Tài xế chưa có trong danh sách tài xế của hồ sơ nhà xe.",
];

const UPDATE_REJECT_REASONS = [
  "Giờ xuất bến mới trùng với chuyến khác tại bến.",
  "Tài xế đề nghị thay thế chưa có trong danh sách tài xế của hồ sơ.",
];

const FAIL_REASONS: Record<string, string> = {
  tyres: "Lốp trước bên phải mòn quá vạch báo",
  brakes: "Hành trình phanh dài, cần điều chỉnh",
  lights: "Đèn phanh bên trái không sáng",
  horn: "Gạt mưa phía tài xế hỏng",
  tracker: "Thiết bị giám sát hành trình mất tín hiệu",
  camera: "Camera trong xe không ghi hình",
  exits: "Búa phá kính bị mất",
  extinguisher: "Bình chữa cháy hết hạn kiểm định",
  leak: "Rò rỉ dầu ở khu vực gầm xe",
  alcohol: "Tài xế có nồng độ cồn, đã thay người lái",
  secured: "Hàng hóa chưa chằng buộc chắc chắn",
};

const LATE_NOTES = [
  "Xe vào bến muộn do kẹt xe trên đường.",
  "Xe trước đó về trễ nên chuyến này chuẩn bị chậm.",
  "Đón thêm khách đoàn nên cần thêm thời gian.",
];

export interface TripsResult {
  trips: Trip[];
  entries: EntryRequest[];
  yardLogs: YardLog[];
}

interface Plan {
  dossier: Dossier;
  route: Route;
  date: string;
  dep: number;
  vehicleIdx: number;
  driverIdx: number;
}

const busyFor = (route: Route, dep: number) =>
  dep + 2 * route.minutes * MIN + HOUR;

/** Xếp lịch: mỗi xe, mỗi tài xế chỉ nhận chuyến khi đã rảnh */
function plan(
  now: number,
  r: Rnd,
  dossiers: Dossier[],
  routes: Route[],
): Plan[] {
  const out: Plan[] = [];
  const vFree = new Map<string, number>();
  const dFree = new Map<string, number>();

  for (let off = -3; off <= 24; off++) {
    const date = dayOf(now, off);
    const factor = off <= 0 ? 1 : off <= 3 ? 0.9 : off <= 6 ? 0.7 : 0.25;
    for (const d of dossiers) {
      for (const rid of CARRIER_ROUTES[d.id] ?? []) {
        const route = routes.find((x) => x.id === rid);
        if (!route) continue;
        const heavy = route.minutes > 600 ? 0.5 : 1;
        const target = Math.round(d.vehicles.length * 0.32 * heavy * factor);
        const slots = [...slotsFor(route.minutes)];
        for (
          let k = 0;
          k < Math.max(target, off > 6 ? (chance(r, 0.4) ? 1 : 0) : 1);
          k++
        ) {
          if (slots.length === 0) break;
          const slot = slots.splice(Math.floor(r() * slots.length), 1)[0];
          const dep = at(date, slot);
          const vOrder = d.vehicles.map((_, i) => i).sort(() => r() - 0.5);
          const dOrder = d.drivers.map((_, i) => i).sort(() => r() - 0.5);
          const vi = vOrder.find(
            (i) => (vFree.get(d.vehicles[i].id) ?? 0) <= dep - 30 * MIN,
          );
          const di = dOrder.find(
            (i) => (dFree.get(d.drivers[i].id) ?? 0) <= dep - 30 * MIN,
          );
          if (vi === undefined || di === undefined) continue;
          const until = busyFor(route, dep);
          vFree.set(d.vehicles[vi].id, until);
          dFree.set(d.drivers[di].id, until);
          out.push({
            dossier: d,
            route,
            date,
            dep,
            vehicleIdx: vi,
            driverIdx: di,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.dep - b.dep);
}

const infoOf = (p: Plan): TripInfo => {
  const v = p.dossier.vehicles[p.vehicleIdx];
  const d = p.dossier.drivers[p.driverIdx];
  return {
    routeId: p.route.id,
    vehicleId: v.id,
    driverId: d.id,
    plate: v.plate,
    seats: v.seats,
    driverName: d.name,
    driverPhone: d.phone,
    date: p.date,
    departAt: new Date(p.dep).toTimeString().slice(0, 5),
  };
};

export function buildTrips(
  now: number,
  r: Rnd,
  dossiers: Dossier[],
  routes: Route[],
  bays: Bay[],
): TripsResult {
  const approved = dossiers.filter((d) => d.everApproved);
  const reception = byRole("reception").filter((s) => s.id !== "u13");
  const indoor = byRole("indoor");
  const outdoor = byRole("outdoor");
  const security = byRole("security");
  const today = dateOf(now);
  const todayOffset = (date: string) =>
    Math.round((at(date, "00:00") - at(today, "00:00")) / DAY);

  const plans = plan(now, r, approved, routes);
  const trips: Trip[] = [];
  const entries: EntryRequest[] = [];
  const yardLogs: YardLog[] = [];
  const bayBusy = new Map<string, [number, number][]>();
  const pass: { trip: Trip; at: number }[] = [];
  /** Giờ xe ra bến của từng chuyến đã ra */
  const outAt = new Map<string, number>();
  let seq = 0;
  let pendingAdjust = 0;

  const bayFree = (id: string, s: number, e: number) =>
    !(bayBusy.get(id) ?? []).some(([a, b]) => s < b && a < e);

  /** Xếp ô còn trống cho cửa sổ đón khách 15 phút bắt đầu lúc `s`, lùi dần nếu kín */
  const allocate = (s: number): { bayId: string; start: number } | null => {
    for (let back = 0; back <= 30 * MIN; back += 5 * MIN) {
      const start = s - back;
      const bay = bays.find((b) => bayFree(b.id, start, start + 15 * MIN));
      if (bay) {
        bayBusy.set(bay.id, [
          ...(bayBusy.get(bay.id) ?? []),
          [start, start + 15 * MIN],
        ]);
        return { bayId: bay.id, start };
      }
    }
    return null;
  };

  const entryOf = (
    kind: "entry" | "exit",
    trip: Trip,
    dossier: Dossier,
    swipe: number,
    decided: number,
    gate: string,
    rejected: boolean,
    idSuffix: string,
  ): EntryRequest => {
    const driver = dossier.drivers.find((d) => d.id === trip.driverId)!;
    const staff = pick(r, outdoor);
    return {
      id: `vb-${kind === "entry" ? "in" : "out"}-${trip.id}${idSuffix}`,
      kind,
      gate,
      cardUid: cardUid(driver.id),
      driverId: driver.id,
      driverName: driver.name,
      dossierId: dossier.id,
      tripId: trip.id,
      plate: trip.plate,
      requestedAt: stamp(swipe),
      checks: runChecks({
        kind,
        trip,
        dossier,
        driver,
        plate: trip.plate,
        gate,
      }),
      status: rejected ? "rejected" : "approved",
      reason: rejected
        ? kind === "entry"
          ? "Xe quẹt thẻ tại cổng ra, hướng dẫn đi vào qua Cổng 1."
          : "Xe quẹt thẻ tại cổng vào, hướng dẫn đi ra qua Cổng 2."
        : undefined,
      decidedBy: staff.name,
      decidedAt: stamp(decided),
    };
  };

  for (const p of plans) {
    const dossier = p.dossier;
    const info = infoOf(p);
    const off = todayOffset(p.date);
    seq += 1;

    // ----- trạng thái duyệt của chuyến
    let status: Trip["status"] = "active";
    if (off > 7) {
      const x = r();
      status =
        x < 0.55
          ? "active"
          : x < 0.8
            ? "receiving"
            : x < 0.92
              ? "updating"
              : "rejected";
    } else if (off >= 1 && chance(r, 0.1)) status = "receiving";

    const lead = between(r, 4, 14);
    const created = ((): string => {
      const c = dayOf(p.dep, -lead);
      return c > today ? today : c;
    })();
    const reviewer = pick(r, reception).name;
    const reviewedOn = (() => {
      const c = dayOf(at(created, "12:00"), 1);
      return c > today ? today : c;
    })();

    const trip: Trip = {
      ...info,
      id: `c${seq}`,
      dossierId: dossier.id,
      status,
      everApproved: status === "active" || status === "updating",
      createdAt: created,
    };

    if (status === "receiving") {
      trip.createdAt = dayOf(now, -between(r, 0, 4));
    } else if (status === "rejected") {
      trip.createdAt = dayOf(now, -between(r, 2, 5));
      trip.reviewedAt = dayOf(at(trip.createdAt, "12:00"), 1);
      trip.reviewerName = reviewer;
      trip.rejectReason = pick(r, REJECT_REASONS);
    } else {
      trip.reviewedAt = reviewedOn;
      trip.reviewerName = reviewer;
      if (status === "updating") {
        trip.request = {
          ...info,
          departAt: new Date(p.dep + HOUR).toTimeString().slice(0, 5),
        };
        trip.requestedAt = dayOf(now, -between(r, 0, 2));
      } else if (off > 8 && chance(r, 0.06)) {
        trip.updateRejection = {
          reason: pick(r, UPDATE_REJECT_REASONS),
          date: dayOf(now, -1),
        };
      }
    }

    // ----- vòng đời của chuyến đã duyệt
    if (status === "active" || status === "updating") {
      const late =
        status === "active" && chance(r, 0.1) && p.dep <= now + 6 * HOUR;
      const swipeIn = late
        ? round5(p.dep + between(r, 12, 40) * MIN)
        : round5(p.dep - between(r, 42, 80) * MIN);
      const arrivalAt = swipeIn + between(r, 2, 4) * MIN;

      // boarding: phân công trước tối đa hai ngày
      if (status === "active" && p.dep <= now + 2 * DAY) {
        const ideal = late ? round5(arrivalAt + 5 * MIN) : p.dep - 15 * MIN;
        const slot = allocate(ideal);
        if (slot) {
          const assigned = dayOf(p.dep, -1) > today ? today : dayOf(p.dep, -1);
          trip.boarding = {
            bayId: slot.bayId,
            startAt: new Date(slot.start).toTimeString().slice(0, 5),
            status: "assigned",
            assignedBy: pick(r, indoor).name,
            assignedAt: assigned,
            previousStart: late
              ? new Date(p.dep - 15 * MIN).toTimeString().slice(0, 5)
              : undefined,
          };
          // Vài chuyến sắp tới đã có yêu cầu điều chỉnh giờ đón chờ nhân viên xử lý
          if (
            !late &&
            pendingAdjust < 3 &&
            p.dep > now + 20 * MIN &&
            p.dep < now + 5 * HOUR &&
            arrivalAt > now &&
            chance(r, 0.3)
          ) {
            pendingAdjust += 1;
            trip.boarding.status = "adjusting";
            trip.boarding.request = {
              desiredStart: new Date(
                round5(slot.start + between(r, 25, 40) * MIN),
              )
                .toTimeString()
                .slice(0, 5),
              note: pick(r, LATE_NOTES),
              requestedAt: today,
            };
          }
        }
      }

      // xe vào bến
      if (status === "active" && trip.boarding && swipeIn <= now) {
        const firstWrong = chance(r, 0.04);
        if (firstWrong) {
          entries.push(
            entryOf(
              "entry",
              trip,
              dossier,
              swipeIn - 4 * MIN,
              swipeIn - 2 * MIN,
              EXIT_GATE,
              true,
              "-x",
            ),
          );
        }
        if (arrivalAt <= now) {
          const e = entryOf(
            "entry",
            trip,
            dossier,
            swipeIn,
            arrivalAt,
            ENTRY_GATE,
            false,
            "",
          );
          entries.push(e);
          trip.arrival = { at: e.decidedAt!, gate: ENTRY_GATE, entryId: e.id };
        } else {
          const e = entryOf(
            "entry",
            trip,
            dossier,
            swipeIn,
            arrivalAt,
            ENTRY_GATE,
            false,
            "",
          );
          entries.push({
            ...e,
            status: "pending",
            decidedBy: undefined,
            decidedAt: undefined,
          });
        }
      }

      // kiểm tra xuất bến và lệnh xuất bến
      if (trip.arrival) {
        const base = late
          ? arrivalAt + between(r, 8, 14) * MIN
          : Math.max(
              arrivalAt + between(r, 8, 15) * MIN,
              p.dep - between(r, 10, 28) * MIN,
            );
        const inspAt = round5(base);
        const staff = pick(r, security).name;
        const driverFail = chance(r, 0.06) && inspAt + 25 * MIN <= now;
        const make = (n: number, when: number, fail: boolean): Inspection => {
          const failKey = fail ? pick(r, Object.keys(FAIL_REASONS)) : "";
          const items: InspectionItem[] = [
            ...autoItems(trip, dossier, today),
            ...MANUAL_ITEMS.map((m) => ({
              key: m.key,
              group: m.group,
              label: m.label,
              ok: m.key !== failKey,
              reason: m.key === failKey ? FAIL_REASONS[m.key] : undefined,
            })),
          ];
          const seatsUsed = Math.round(trip.seats * (0.5 + r() * 0.5));
          return {
            id: `kt-${trip.id}-${n}`,
            at: stamp(when),
            byName: staff,
            result: fail ? "fail" : "pass",
            items,
            passengers: seatsUsed,
            cargoKg: Math.round(cargoLimit(trip.seats) * (0.1 + r() * 0.5)),
          };
        };
        let passAt = inspAt;
        const list: Inspection[] = [];
        if (driverFail) {
          list.push(make(1, inspAt, true));
          passAt = inspAt + between(r, 12, 20) * MIN;
          list.push(make(2, passAt, false));
        } else if (inspAt <= now) {
          list.push(make(1, inspAt, false));
        }
        if (list.length > 0 && passAt <= now) {
          trip.inspections = list;
          pass.push({ trip, at: passAt });
        }

        // xe ra bến
        const depOut = late
          ? round5(passAt + between(r, 8, 15) * MIN)
          : round5(Math.max(p.dep + between(r, 1, 8) * MIN, passAt + 5 * MIN));
        if (trip.inspections && depOut <= now) outAt.set(trip.id, depOut);
      }
    }

    trips.push(trip);
  }

  // ----- số lệnh xuất bến theo thứ tự thời gian, rồi ghi nhận xe ra bến
  pass.sort((a, b) => a.at - b.at);
  pass.forEach(({ trip, at: when }, i) => {
    trip.departureOrder = {
      code: `LXB-${String(i + 1).padStart(4, "0")}`,
      issuedAt: stamp(when),
      issuedBy: trip.inspections![trip.inspections!.length - 1].byName,
    };
  });

  for (const trip of trips) {
    const out = outAt.get(trip.id);
    if (!out || !trip.arrival) continue;
    const dossier = dossiers.find((d) => d.id === trip.dossierId)!;
    if (chance(r, 0.03)) {
      entries.push(
        entryOf(
          "exit",
          trip,
          dossier,
          out - 5 * MIN,
          out - 3 * MIN,
          ENTRY_GATE,
          true,
          "-x",
        ),
      );
    }
    const e = entryOf(
      "exit",
      trip,
      dossier,
      out - 2 * MIN,
      out,
      EXIT_GATE,
      false,
      "",
    );
    entries.push(e);
    trip.departure = { at: e.decidedAt!, gate: EXIT_GATE, entryId: e.id };
  }

  // ----- luôn có vài chuyến sắp xuất bến để thao tác: hai chuyến chờ kiểm tra, một chuyến không đạt
  const busy = (
    vehicleId: string,
    driverId: string,
    from: number,
    to: number,
  ) =>
    trips.some((t) => {
      if (t.vehicleId !== vehicleId && t.driverId !== driverId) return false;
      const route = routes.find((x) => x.id === t.routeId)!;
      const dep = at(t.date, t.departAt);
      return dep - 30 * MIN < to && from < busyFor(route, dep);
    });
  const demo: {
    id: string;
    dossier: string;
    route: string;
    min: number;
    /** Chuyến đã kiểm tra: đạt (có lệnh, đang chờ ra cổng) hoặc không đạt */
    result?: "pass" | "fail";
    /** Chuyến sắp tới, xe chưa vào bến, dùng để thử xếp lại ô và quẹt thẻ vào bến */
    upcoming?: boolean;
  }[] = [
    { id: "dp0", dossier: "hs6", route: "t8", min: 4, result: "pass" },
    { id: "dp1", dossier: "hs1", route: "t4", min: 12 },
    { id: "dp2", dossier: "hs3", route: "t5", min: 22 },
    { id: "dp3", dossier: "hs5", route: "t3", min: 28, result: "fail" },
    { id: "dq1", dossier: "hs7", route: "t3", min: 75, upcoming: true },
    { id: "dq2", dossier: "hs8", route: "t6", min: 105, upcoming: true },
    { id: "dq3", dossier: "hs10", route: "t5", min: 140, upcoming: true },
    { id: "dq4", dossier: "hs1", route: "t1", min: 185, upcoming: true },
  ];
  let extraOrders = 0;
  for (const x of demo) {
    const dossier = approved.find((d) => d.id === x.dossier);
    const route = routes.find((q) => q.id === x.route);
    if (!dossier || !route) continue;
    const dep = round5(now + x.min * MIN);
    const vi = dossier.vehicles.findIndex((v) =>
      dossier.drivers.some((d) => !busy(v.id, d.id, dep, busyFor(route, dep))),
    );
    if (vi < 0) continue;
    const di = dossier.drivers.findIndex(
      (d) => !busy(dossier.vehicles[vi].id, d.id, dep, busyFor(route, dep)),
    );
    const info = infoOf({
      dossier,
      route,
      date: dateOf(dep),
      dep,
      vehicleIdx: vi,
      driverIdx: di,
    });
    const slot = allocate(dep - 15 * MIN);
    if (!slot) continue;
    seq += 1;
    const trip: Trip = {
      ...info,
      id: x.id,
      dossierId: dossier.id,
      status: "active",
      everApproved: true,
      createdAt: dayOf(now, -6),
      reviewedAt: dayOf(now, -5),
      reviewerName: pick(r, reception).name,
      boarding: {
        bayId: slot.bayId,
        startAt: new Date(slot.start).toTimeString().slice(0, 5),
        status: "assigned",
        assignedBy: pick(r, indoor).name,
        assignedAt: today,
      },
    };
    if (!x.upcoming) {
      const swipe = round5(now - between(r, 18, 30) * MIN);
      const e = entryOf(
        "entry",
        trip,
        dossier,
        swipe,
        swipe + 3 * MIN,
        ENTRY_GATE,
        false,
        "",
      );
      entries.push(e);
      trip.arrival = { at: e.decidedAt!, gate: ENTRY_GATE, entryId: e.id };
    }
    if (x.result) {
      const fail = x.result === "fail";
      const staff = pick(r, security).name;
      const items: InspectionItem[] = [
        ...autoItems(trip, dossier, today),
        ...MANUAL_ITEMS.map((m) => ({
          key: m.key,
          group: m.group,
          label: m.label,
          ok: !(fail && m.key === "tyres"),
          reason: fail && m.key === "tyres" ? FAIL_REASONS.tyres : undefined,
        })),
      ];
      const when = now - (fail ? 6 : 12) * MIN;
      trip.inspections = [
        {
          id: `kt-${trip.id}-1`,
          at: stamp(when),
          byName: staff,
          result: fail ? "fail" : "pass",
          items,
          passengers: Math.round(trip.seats * 0.7),
          cargoKg: 90,
        },
      ];
      if (!fail) {
        extraOrders += 1;
        trip.departureOrder = {
          code: `LXB-${String(pass.length + extraOrders).padStart(4, "0")}`,
          issuedAt: stamp(when),
          issuedBy: staff,
        };
      }
    }
    trips.push(trip);
  }

  // ----- sổ vào/ra bãi do nhà xe tự ghi: ghi cả vào lẫn ra, hoặc không ghi
  let logN = 0;
  for (const trip of trips) {
    if (!trip.arrival || !chance(r, 0.85)) continue;
    const dossier = dossiers.find((d) => d.id === trip.dossierId)!;
    const inAt =
      new Date(`${trip.arrival.at}:00`).getTime() + between(r, 1, 6) * MIN;
    const same = chance(r, 0.8);
    const driverIn = dossier.drivers.find((d) => d.id === trip.driverId)!;
    const log = (
      kind: "in" | "out",
      when: number,
      driverName: string,
      driverId: string,
    ): YardLog => ({
      id: `yl${++logN}`,
      dossierId: dossier.id,
      kind,
      vehicleId: trip.vehicleId,
      driverId,
      plate: trip.plate,
      driverName,
      at: stamp(when),
      createdAt: stamp(when + 2 * MIN),
    });
    yardLogs.push(log("in", inAt, driverIn.name, driverIn.id));
    if (trip.departure) {
      const outAt = new Date(`${trip.departure.at}:00`).getTime() - 1 * MIN;
      const other = same
        ? driverIn
        : (dossier.drivers.find((d) => d.id !== driverIn.id) ?? driverIn);
      yardLogs.push(log("out", outAt, other.name, other.id));
    }
  }

  return { trips, entries, yardLogs };
}

export type { Data };
