/** Các loại báo cáo, thống kê: truy xuất dữ liệu rồi tổng hợp thành chỉ số, biểu đồ và bảng. Không có React. */
import { formatDate, hmOf, toISODate } from "@/lib/format";
import { DOSSIER_STATUS_LABEL, type Data, type DossierStatus } from "@/types";

export type ReportKey =
  "dossiers" | "trips" | "gate" | "inspections" | "violations" | "boarding";

export interface ReportType {
  key: ReportKey;
  title: string;
  desc: string;
}

export const REPORT_TYPES: ReportType[] = [
  {
    key: "dossiers",
    title: "Hồ sơ nhà xe",
    desc: "Số hồ sơ theo trạng thái, số xe và tài xế của từng nhà xe.",
  },
  {
    key: "trips",
    title: "Chuyến xe theo tuyến",
    desc: "Số chuyến theo tuyến và trạng thái duyệt, số chuyến đã xuất bến.",
  },
  {
    key: "boarding",
    title: "Đón khách theo vị trí",
    desc: "Số chuyến được gán và số lần điều chỉnh của từng ô đón khách.",
  },
  {
    key: "gate",
    title: "Xe vào, ra bến theo ngày",
    desc: "Số lượt xe vào, ra, bị từ chối và cho qua ngoại lệ mỗi ngày.",
  },
  {
    key: "inspections",
    title: "Kiểm tra xuất bến",
    desc: "Số lần kiểm tra đạt, không đạt và lệnh xuất bến đã cấp theo nhà xe.",
  },
  {
    key: "violations",
    title: "Vi phạm tại bãi",
    desc: "Số biên bản vi phạm theo từng lỗi và nhà xe vi phạm nhiều nhất.",
  },
];

export type Cell = string | number;

export interface ReportTable {
  key: ReportKey;
  title: string;
  /** Thời điểm lập, dạng HH:MM DD/MM/YYYY */
  generatedAt: string;
  summary: { label: string; value: Cell }[];
  columns: string[];
  rows: Cell[][];
  chart: ChartSpec;
}

/** Biểu đồ đi kèm bảng: các nhãn trục và các chuỗi số liệu */
export interface ChartSpec {
  kind: "bar" | "doughnut" | "line";
  /** Cột chồng nhau (bar) hoặc thanh nằm ngang */
  stacked?: boolean;
  horizontal?: boolean;
  labels: string[];
  series: { label: string; data: number[] }[];
}

const count = <T>(list: T[], pred: (x: T) => boolean) =>
  list.filter(pred).length;

/** Nhóm theo khóa và đếm; trả về cặp [khóa, số lượng] giảm dần */
function tally(keys: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

/** Truy xuất dữ liệu của loại đã chọn và thống kê, tổng hợp */
export function buildReport(
  key: ReportKey,
  data: Data,
  now: number,
): ReportTable {
  const title = REPORT_TYPES.find((t) => t.key === key)?.title ?? "";
  const base = {
    key,
    title,
    generatedAt: `${hmOf(now)} ${formatDate(toISODate(new Date(now)))}`,
  };
  const carrier = new Map(data.dossiers.map((d) => [d.id, d.companyName]));

  switch (key) {
    case "dossiers": {
      const by = (s: DossierStatus) =>
        count(data.dossiers, (d) => d.status === s);
      return {
        ...base,
        summary: [
          { label: "Tổng hồ sơ", value: data.dossiers.length },
          { label: DOSSIER_STATUS_LABEL.active, value: by("active") },
          { label: DOSSIER_STATUS_LABEL.receiving, value: by("receiving") },
          { label: DOSSIER_STATUS_LABEL.updating, value: by("updating") },
          { label: DOSSIER_STATUS_LABEL.rejected, value: by("rejected") },
          {
            label: "Tổng số xe",
            value: data.dossiers.reduce((n, d) => n + d.vehicles.length, 0),
          },
        ],
        chart: {
          kind: "doughnut",
          labels: (
            ["active", "receiving", "updating", "rejected"] as const
          ).map((k) => DOSSIER_STATUS_LABEL[k]),
          series: [
            {
              label: "Hồ sơ",
              data: (
                ["active", "receiving", "updating", "rejected"] as const
              ).map(by),
            },
          ],
        },
        columns: [
          "Nhà xe",
          "Mã số thuế",
          "Trạng thái",
          "Số xe",
          "Số tài xế",
          "Tuyến đề nghị",
          "Nhân viên phê duyệt",
        ],
        rows: [...data.dossiers]
          .sort((a, b) => a.companyName.localeCompare(b.companyName))
          .map((d) => [
            d.companyName,
            d.taxCode,
            DOSSIER_STATUS_LABEL[d.status],
            d.vehicles.length,
            d.drivers.length,
            `${d.routeFrom} - ${d.routeTo}`,
            d.reviewerName ?? "-",
          ]),
      };
    }

    case "trips": {
      const rows = data.routes.map((r) => {
        const t = data.trips.filter((x) => x.routeId === r.id);
        return [
          `${r.from} - ${r.to}`,
          t.length,
          count(t, (x) => x.status === "receiving"),
          count(t, (x) => x.status === "active"),
          count(t, (x) => x.status === "updating"),
          count(t, (x) => x.status === "rejected"),
          count(t, (x) => !!x.departure),
        ] as Cell[];
      });
      const total = (i: number) =>
        rows.reduce((n, r) => n + (r[i] as number), 0);
      return {
        ...base,
        summary: [
          { label: "Tổng chuyến", value: data.trips.length },
          {
            label: "Đã duyệt",
            value: count(data.trips, (t) => t.status === "active"),
          },
          {
            label: "Chờ tiếp nhận",
            value: count(data.trips, (t) => t.status === "receiving"),
          },
          {
            label: "Đã xuất bến",
            value: count(data.trips, (t) => !!t.departure),
          },
        ],
        chart: {
          kind: "bar",
          stacked: true,
          labels: rows.map((r) => String(r[0]).replace("Tuy Hòa - ", "")),
          series: [
            { label: "Chờ tiếp nhận", data: rows.map((r) => r[2] as number) },
            { label: "Đã duyệt", data: rows.map((r) => r[3] as number) },
            { label: "Đang cập nhật", data: rows.map((r) => r[4] as number) },
            { label: "Đã từ chối", data: rows.map((r) => r[5] as number) },
          ],
        },
        columns: [
          "Tuyến",
          "Tổng chuyến",
          "Chờ tiếp nhận",
          "Đã duyệt",
          "Đang cập nhật",
          "Đã từ chối",
          "Đã xuất bến",
        ],
        rows: data.trips.length
          ? [
              ...rows,
              [
                "Tổng",
                total(1),
                total(2),
                total(3),
                total(4),
                total(5),
                total(6),
              ],
            ]
          : [],
      };
    }

    case "boarding": {
      const rows = data.bays.map((b) => [
        b.code,
        count(data.trips, (t) => t.boarding?.bayId === b.id),
        count(
          data.bayAdjustments,
          (a) => a.bayId === b.id && a.kind === "unavailable",
        ),
        count(
          data.bayAdjustments,
          (a) => a.bayId === b.id && a.kind === "delay",
        ),
      ]);
      const top = [...rows].sort(
        (a, b) => (b[1] as number) - (a[1] as number),
      )[0];
      return {
        ...base,
        summary: [
          { label: "Số vị trí", value: data.bays.length },
          {
            label: "Chuyến đã phân công",
            value: count(data.trips, (t) => !!t.boarding),
          },
          {
            label: "Vị trí dùng nhiều nhất",
            value: top ? `${top[0]} (${top[1]} chuyến)` : "-",
          },
        ],
        chart: {
          kind: "bar",
          labels: rows.map((r) => String(r[0])),
          series: [
            { label: "Chuyến được gán", data: rows.map((r) => r[1] as number) },
            { label: "Lần tạm ngưng", data: rows.map((r) => r[2] as number) },
            { label: "Lần lệch giờ", data: rows.map((r) => r[3] as number) },
          ],
        },
        columns: [
          "Vị trí",
          "Số chuyến được gán",
          "Lần tạm ngưng",
          "Lần lệch giờ",
        ],
        rows,
      };
    }

    case "gate": {
      const dayOf = (e: { requestedAt: string }) => e.requestedAt.split("T")[0];
      const days = [...new Set(data.entries.map(dayOf))].sort().reverse();
      const rows = days.map((d) => {
        const e = data.entries.filter((x) => dayOf(x) === d);
        return [
          formatDate(d),
          count(
            e,
            (x) => (x.kind ?? "entry") === "entry" && x.status === "approved",
          ),
          count(e, (x) => x.kind === "exit" && x.status === "approved"),
          count(e, (x) => x.status === "rejected"),
          count(e, (x) => !!x.exception),
        ] as Cell[];
      });
      const sum = (i: number) => rows.reduce((n, r) => n + (r[i] as number), 0);
      return {
        ...base,
        summary: [
          { label: "Xe đã vào bến", value: sum(1) },
          { label: "Xe đã ra bến", value: sum(2) },
          { label: "Bị từ chối", value: sum(3) },
          { label: "Cho qua ngoại lệ", value: sum(4) },
        ],
        chart: {
          kind: "line",
          labels: [...rows].reverse().map((r) => String(r[0]).slice(0, 5)),
          series: [
            {
              label: "Xe vào bến",
              data: [...rows].reverse().map((r) => r[1] as number),
            },
            {
              label: "Xe ra bến",
              data: [...rows].reverse().map((r) => r[2] as number),
            },
            {
              label: "Bị từ chối",
              data: [...rows].reverse().map((r) => r[3] as number),
            },
          ],
        },
        columns: [
          "Ngày",
          "Xe vào bến",
          "Xe ra bến",
          "Bị từ chối",
          "Cho qua ngoại lệ",
        ],
        rows,
      };
    }

    case "inspections": {
      const list = data.trips.flatMap((t) =>
        (t.inspections ?? []).map((i) => ({ t, i })),
      );
      const names = [
        ...new Set(list.map((x) => carrier.get(x.t.dossierId) ?? "-")),
      ].sort();
      const rows = names.map((n) => {
        const mine = list.filter(
          (x) => (carrier.get(x.t.dossierId) ?? "-") === n,
        );
        const pass = count(mine, (x) => x.i.result === "pass");
        return [
          n,
          mine.length,
          pass,
          mine.length - pass,
          `${Math.round((pass / mine.length) * 100)}%`,
          count(mine, (x) => !!x.t.departureOrder),
        ] as Cell[];
      });
      const failItems = tally(
        list.flatMap((x) =>
          x.i.items.filter((it) => !it.ok).map((it) => it.label),
        ),
      )[0];
      return {
        ...base,
        summary: [
          { label: "Số lần kiểm tra", value: list.length },
          { label: "Đạt", value: count(list, (x) => x.i.result === "pass") },
          {
            label: "Không đạt",
            value: count(list, (x) => x.i.result === "fail"),
          },
          {
            label: "Lệnh xuất bến đã cấp",
            value: count(data.trips, (t) => !!t.departureOrder),
          },
          {
            label: "Hạng mục không đạt nhiều nhất",
            value: failItems ? `${failItems[0]} (${failItems[1]})` : "-",
          },
        ],
        chart: {
          kind: "bar",
          stacked: true,
          horizontal: true,
          labels: rows.map((r) => String(r[0])),
          series: [
            { label: "Đạt", data: rows.map((r) => r[2] as number) },
            { label: "Không đạt", data: rows.map((r) => r[3] as number) },
          ],
        },
        columns: [
          "Nhà xe",
          "Số lần kiểm tra",
          "Đạt",
          "Không đạt",
          "Tỷ lệ đạt",
          "Lệnh đã cấp",
        ],
        rows,
      };
    }

    case "violations": {
      const types = tally(data.violations.map((v) => v.type));
      const rows = types.map(([type, n]) => {
        const mine = data.violations.filter((v) => v.type === type);
        const top = tally(mine.map((v) => carrier.get(v.dossierId) ?? "-"))[0];
        return [
          type,
          n,
          new Set(mine.map((v) => v.dossierId)).size,
          top ? `${top[0]} (${top[1]})` : "-",
        ] as Cell[];
      });
      const worst = tally(
        data.violations.map((v) => carrier.get(v.dossierId) ?? "-"),
      )[0];
      return {
        ...base,
        summary: [
          { label: "Tổng biên bản", value: data.violations.length },
          { label: "Số lỗi khác nhau", value: types.length },
          {
            label: "Nhà xe vi phạm nhiều nhất",
            value: worst ? `${worst[0]} (${worst[1]})` : "-",
          },
        ],
        chart: {
          kind: "bar",
          horizontal: true,
          labels: rows.map((r) => String(r[0])),
          series: [
            { label: "Số biên bản", data: rows.map((r) => r[1] as number) },
          ],
        },
        columns: [
          "Lỗi vi phạm",
          "Số biên bản",
          "Số nhà xe",
          "Nhà xe vi phạm nhiều nhất",
        ],
        rows,
      };
    }
  }
}
