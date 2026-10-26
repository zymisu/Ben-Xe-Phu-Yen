"use client";

/**
 * UC11.2 - Hộp thoại xuất báo cáo: xem trước, chọn trang, khổ giấy, định dạng.
 */
import { Icon } from "@/components/Icon";
import { Button, cx, Dialog, Field, Note, O } from "@/components/ui";
import { ReportChart } from "../ReportChart";
import type { ReportTable } from "../reports";
import { useExport } from "./logic";
import {
  FORMAT_LABEL,
  rowsPerPage,
  SIZES,
  type Format,
  type Orientation,
} from "./rules";

const ORIENT: Record<Orientation, string> = {
  portrait: "Dọc",
  landscape: "Ngang",
};

function Choice<T extends string>({
  value,
  current,
  onPick,
  children,
}: {
  value: T;
  current: T;
  onPick: (v: T) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={current === value}
      onClick={() => onPick(value)}
      className={cx(
        "cham-duoc rounded-xl border px-4 text-sm font-bold transition-colors",
        current === value
          ? "border-brand bg-brand-soft text-brand-soft-ink"
          : "border-line bg-card text-ink hover:border-brand",
      )}
    >
      {children}
    </button>
  );
}

/** Hộp thoại xuất báo cáo theo ba bước: xem trước và chọn trang, chọn định dạng, xác nhận */
export function ExportReport({
  report,
  onClose,
}: {
  report: ReportTable;
  onClose: () => void;
}) {
  const f = useExport(report, onClose);

  const titles = {
    preview: "Xuất báo cáo - xem trước",
    format: "Xuất báo cáo - định dạng",
    confirm: "Xuất báo cáo - xác nhận",
  } as const;

  return (
    <Dialog
      open
      close={onClose}
      title={titles[f.step]}
      desc={report.title}
      size="lg"
      notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
      footer={
        f.step === "preview" ? (
          <>
            <Button variant="nhe" onClick={onClose}>
              Huỷ
            </Button>
            <Button variant="chinh" onClick={f.toFormat}>
              Tiếp tục
              <Icon name="chevronRight" className="size-4" />
            </Button>
          </>
        ) : f.step === "format" ? (
          <>
            <Button variant="nhe" onClick={() => f.setStep("preview")}>
              Quay lại
            </Button>
            <Button variant="chinh" onClick={() => f.setStep("confirm")}>
              Tiếp tục
              <Icon name="chevronRight" className="size-4" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="nhe" onClick={() => f.setStep("format")}>
              Quay lại
            </Button>
            <Button variant="ok" onClick={f.confirm} disabled={f.busy}>
              <Icon name="download" className="size-4" />
              Xác nhận xuất báo cáo
            </Button>
          </>
        )
      }
    >
      {/* xem trước, số trang, khổ */}
      {f.step === "preview" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">
                Kích thước
              </p>
              <div
                role="radiogroup"
                aria-label="Khổ giấy"
                className="flex gap-2"
              >
                {SIZES.map((s) => (
                  <Choice key={s} value={s} current={f.size} onPick={f.setSize}>
                    {s}
                  </Choice>
                ))}
              </div>
              <div
                role="radiogroup"
                aria-label="Hướng giấy"
                className="mt-2 flex gap-2"
              >
                {(Object.keys(ORIENT) as Orientation[]).map((o) => (
                  <Choice
                    key={o}
                    value={o}
                    current={f.orient}
                    onPick={f.setOrient}
                  >
                    {ORIENT[o]}
                  </Choice>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                {rowsPerPage(f.size, f.orient)} dòng mỗi trang · tổng {f.pages}{" "}
                trang
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink">Số trang</p>
              <div className="flex items-end gap-2">
                <Field label="Từ trang" className="flex-1">
                  <O
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={f.pages}
                    value={f.from}
                    onChange={(e) => f.setFrom(e.target.value)}
                  />
                </Field>
                <Field label="Đến trang" className="flex-1">
                  <O
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={f.pages}
                    value={f.to}
                    onChange={(e) => f.setTo(e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">
                Xem trước
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="sub"
                  small
                  disabled={f.view <= 1}
                  onClick={() => f.setView(f.view - 1)}
                >
                  <Icon name="chevronRight" className="size-4 rotate-180" />
                  Trước
                </Button>
                <span className="tnum text-sm font-semibold text-ink">
                  Trang {Math.min(f.view, f.pages)}/{f.pages}
                </span>
                <Button
                  variant="sub"
                  small
                  disabled={f.view >= f.pages}
                  onClick={() => f.setView(f.view + 1)}
                >
                  Sau
                  <Icon name="chevronRight" className="size-4" />
                </Button>
              </div>
            </div>
            <ReportChart spec={report.chart} />
            <div className="overflow-x-auto rounded-[14px] border border-line">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {report.columns.map((c) => (
                      <th
                        key={c}
                        className="border-b border-line bg-surface-2 px-3 py-2 text-left font-bold text-muted"
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {f.previewRows.map((r, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      {r.map((c, j) => (
                        <td
                          key={j}
                          className={cx(
                            "px-3 py-1.5 text-ink",
                            typeof c === "number" && "tnum text-right",
                          )}
                        >
                          {c}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* chọn định dạng */}
      {f.step === "format" && (
        <div
          role="radiogroup"
          aria-label="Định dạng báo cáo"
          className="grid gap-2 sm:grid-cols-3"
        >
          {(Object.keys(FORMAT_LABEL) as Format[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={f.format === k}
              onClick={() => f.setFormat(k)}
              className={cx(
                "cham-duoc rounded-[14px] border px-4 py-4 text-left transition-colors",
                f.format === k
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-card hover:border-brand",
              )}
            >
              <span className="block text-sm font-bold text-ink">
                {FORMAT_LABEL[k]}
              </span>
              <span className="mt-1 block text-xs text-muted">
                {k === "pdf"
                  ? "Mở hộp thoại in, chọn Lưu dưới dạng PDF."
                  : k === "xlsx"
                    ? "Tệp bảng tính, mở bằng Excel."
                    : "Dữ liệu thô, mở bằng Excel hoặc nhập vào phần mềm khác."}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* xác nhận xuất */}
      {f.step === "confirm" && (
        <dl className="space-y-3 text-sm">
          {[
            ["Báo cáo", report.title],
            ["Kích thước", `${f.size} · ${ORIENT[f.orient]}`],
            [
              "Trang xuất",
              `Từ trang ${f.from} đến trang ${f.to} (tổng ${f.pages})`,
            ],
            ["Định dạng", FORMAT_LABEL[f.format]],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="shrink-0 text-xs text-muted sm:w-28 sm:pt-0.5">
                {k}
              </dt>
              <dd className="font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </Dialog>
  );
}
