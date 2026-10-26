"use client";

/**
 * UC11 - Nội dung một báo cáo: chỉ số tóm tắt, biểu đồ và bảng dữ liệu.
 * Dùng cho quản trị viên lúc lập báo cáo và cho người nhận mở từ thông báo.
 */
import { Pager, usePaged } from "@/components/Pager";
import { cx, StatCard, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { ReportChart } from "./ReportChart";
import type { ReportTable } from "./reports";

export function ReportView({ report }: { report: ReportTable }) {
  const paged = usePaged(report.rows, report.key);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">
          {report.title}
        </h2>
        <p className="tnum text-xs text-muted">Lập lúc {report.generatedAt}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {report.summary.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      <ReportChart spec={report.chart} />

      <div>
        <Table>
          <THead>
            {report.columns.map((c) => (
              <Th key={c}>{c}</Th>
            ))}
          </THead>
          <TBody>
            {paged.rows.map((r, i) => (
              <Tr key={i}>
                {r.map((c, j) => (
                  <Td
                    key={j}
                    label={report.columns[j]}
                    className={cx(
                      typeof c === "number"
                        ? "tnum text-ink"
                        : j === 0
                          ? "font-semibold text-ink"
                          : "text-muted",
                    )}
                  >
                    {c}
                  </Td>
                ))}
              </Tr>
            ))}
          </TBody>
        </Table>
        <Pager {...paged} />
      </div>
    </div>
  );
}
