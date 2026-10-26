/** Dữ liệu mẫu (hư cấu), neo theo thời điểm nạp trang để mọi màn hình luôn có dữ liệu ở đủ trạng thái. */
import type { Data } from "@/types";
import { buildCarriers, CARRIER_PHONES, REP_NAMES } from "./carriers";
import {
  BAYS,
  bayAdjustments,
  notices,
  reports,
  ROUTES,
  violations,
} from "./misc";
import { namePool, phonePool, STAFF, staffAccounts } from "./people";
import { buildTrips } from "./trips";
import { at, MIN, mulberry32 } from "./util";

export function seedData(): Data {
  const now = Date.now();
  const r = mulberry32(20261021);

  const names = namePool(
    new Set([...STAFF.map((s) => s.name), ...REP_NAMES]),
    r,
  );
  const phones = phonePool(
    new Set([...STAFF.map((s) => s.phone), ...CARRIER_PHONES]),
    r,
  );

  const carriers = buildCarriers(now, r, names, phones);
  const { trips, entries, yardLogs } = buildTrips(
    now,
    r,
    carriers.dossiers,
    ROUTES,
    BAYS,
  );

  // Một chuyến sắp xuất bến được xếp vào Ô 05 đúng lúc ô này tạm ngưng: hiện "Cần xếp lại"
  const soon = trips.find((t) => {
    if (!t.boarding || t.boarding.status !== "assigned" || t.arrival)
      return false;
    const start = at(t.date, t.boarding.startAt);
    if (start < now + 20 * MIN || start > now + 80 * MIN) return false;
    return !trips.some(
      (o) =>
        o !== t &&
        o.boarding?.bayId === "b5" &&
        o.date === t.date &&
        Math.abs(at(o.date, o.boarding.startAt) - start) < 15 * MIN,
    );
  });
  if (soon?.boarding) soon.boarding.bayId = "b5";

  const rep = reports(now, r, carriers.dossiers);

  return {
    accounts: [...staffAccounts(), ...carriers.accounts],
    dossiers: carriers.dossiers,
    routes: ROUTES,
    trips,
    notices: notices(now),
    bays: BAYS,
    bayAdjustments: bayAdjustments(now, r, trips),
    entries,
    violations: violations(now, r, trips),
    yardLogs,
    reports: rep.reports,
    notifications: rep.notifications,
  };
}
