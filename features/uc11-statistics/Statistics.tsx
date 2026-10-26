"use client";

/**
 * UC11.1 - Màn hình lập báo cáo, thống kê và xem bảng kết quả.
 */
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button, cx, Dialog, Empty, Note, PageHeader } from "@/components/ui";
import { notify } from "@/lib/notify";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/types";
import { ExportReport } from "./export/ExportReport";
import { ReportView } from "./ReportView";
import {
  buildReport,
  REPORT_TYPES,
  type ReportKey,
  type ReportTable,
} from "./reports";

/**
 * UC11.1 - Quản trị viên lập báo cáo, xem rồi chọn người nhận để gửi qua Thông báo.
 * Mở rộng: Xuất báo cáo (UC11.2).
 */
export function Statistics() {
  const { data, user, update, toast } = useStore();

  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  const [choice, setChoice] = useState<ReportKey | null>(null);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportTable | null>(null);
  const [empty, setEmpty] = useState(false);
  const [exporting, setExporting] = useState(false);

  /** Nhân viên bến xe có thể nhận báo cáo (không gồm nhà xe và chính người gửi) */
  const staff = useMemo(
    () =>
      data.accounts
        .filter((a) => a.role !== "carrier" && a.id !== user?.id)
        .sort(
          (a, b) =>
            a.role.localeCompare(b.role) ||
            a.fullName.localeCompare(b.fullName, "vi"),
        ),
    [data.accounts, user?.id],
  );

  /** Mở hộp thoại chọn loại báo cáo */
  function begin() {
    setChoice(report?.key ?? null);
    setPicking(true);
  }

  /** Lập báo cáo của loại đã chọn và hiển thị cho quản trị viên xem */
  function generate() {
    if (!choice) return;
    const built = buildReport(choice, data, Date.now());
    setPicking(false);
    if (built.rows.length === 0) {
      setReport(null);
      setEmpty(true);
      return;
    }
    setEmpty(false);
    setReport(built);
  }

  /** Mở hộp thoại chọn người nhận */
  function beginSend() {
    setRecipients([]);
    setError("");
    setSending(true);
  }

  function toggle(id: string) {
    setError("");
    setRecipients((r) =>
      r.includes(id) ? r.filter((x) => x !== id) : [...r, id],
    );
  }

  /** Gửi báo cáo đang xem tới những người nhận đã chọn */
  function send() {
    if (!report) return;
    if (recipients.length === 0) {
      setError("Dữ liệu không hợp lệ: chưa chọn người nhận báo cáo.");
      return;
    }
    setSending(false);
    update((d) =>
      recipients.reduce(
        (acc, id) =>
          notify(
            acc,
            id,
            `Báo cáo: ${report.title}`,
            `${user?.fullName ?? "Quản trị viên"} gửi báo cáo, thống kê lập lúc ${report.generatedAt}.`,
            report,
          ),
        d,
      ),
    );
    toast("ok", "Gửi báo cáo thành công.");
  }

  return (
    <>
      <PageHeader
        branch="Báo cáo, thống kê"
        title="Báo cáo, thống kê"
        desc="Lập báo cáo tổng hợp tình hình hoạt động của bến xe, xem, gửi cho nhân viên và xuất ra tệp."
        phai={
          <>
            {report && (
              <Button variant="sub" small onClick={beginSend}>
                <Icon name="mail" className="size-4" />
                Gửi báo cáo
              </Button>
            )}
            {report && (
              <Button variant="sub" small onClick={() => setExporting(true)}>
                <Icon name="download" className="size-4" />
                Xuất báo cáo
              </Button>
            )}
            <Button variant="chinh" small onClick={begin}>
              <Icon name="chart" className="size-4" />
              Lập báo cáo, thống kê
            </Button>
          </>
        }
      />

      {empty && (
        <Note tone="warn" title="Không có dữ liệu">
          Chưa có dữ liệu để thống kê cho loại báo cáo này.
        </Note>
      )}

      {!report && !empty && (
        <Empty
          title="Chưa lập báo cáo nào"
          desc="Bấm Lập báo cáo, thống kê rồi chọn loại báo cáo cần xem."
        />
      )}

      {report && <ReportView report={report} />}

      {/* chọn loại */}
      <Dialog
        open={picking}
        close={() => setPicking(false)}
        title="Chọn loại báo cáo"
        desc="Hệ thống tổng hợp dữ liệu theo loại bạn chọn."
        footer={
          <>
            <Button variant="nhe" onClick={() => setPicking(false)}>
              Huỷ
            </Button>
            <Button variant="chinh" onClick={generate} disabled={!choice}>
              Lập báo cáo
            </Button>
          </>
        }
      >
        <div role="radiogroup" aria-label="Loại báo cáo" className="space-y-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={choice === t.key}
              onClick={() => setChoice(t.key)}
              className={cx(
                "cham-duoc w-full rounded-[14px] border px-4 py-3 text-left transition-colors",
                choice === t.key
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-card hover:border-brand",
              )}
            >
              <span className="block text-sm font-bold text-ink">
                {t.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{t.desc}</span>
            </button>
          ))}
        </div>
      </Dialog>

      {/* chọn người nhận */}
      <Dialog
        open={sending}
        close={() => setSending(false)}
        title="Chọn người nhận báo cáo"
        desc="Báo cáo được gửi vào trang Thông báo của những người bạn chọn."
        notice={error ? <Note tone="danger">{error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={() => setSending(false)}>
              Huỷ
            </Button>
            <Button variant="chinh" onClick={send}>
              Gửi báo cáo
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="tnum text-xs text-muted">
              Đã chọn {recipients.length}/{staff.length}
            </p>
            <Button
              variant="nhe"
              small
              onClick={() =>
                setRecipients(
                  recipients.length === staff.length
                    ? []
                    : staff.map((a) => a.id),
                )
              }
            >
              {recipients.length === staff.length
                ? "Bỏ chọn tất cả"
                : "Chọn tất cả"}
            </Button>
          </div>
          {staff.map((a) => {
            const on = recipients.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(a.id)}
                className={cx(
                  "cham-duoc flex w-full items-center gap-3 rounded-[14px] border px-4 py-2.5 text-left transition-colors",
                  on
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-card hover:border-brand",
                )}
              >
                <span
                  className={cx(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border",
                    on
                      ? "border-brand bg-brand text-brand-ink"
                      : "border-line-strong",
                  )}
                >
                  {on && <Icon name="check" className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">
                    {a.fullName}
                  </span>
                  <span className="block text-xs text-muted">
                    {ROLE_LABEL[a.role]}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Dialog>

      {exporting && report && (
        <ExportReport report={report} onClose={() => setExporting(false)} />
      )}
    </>
  );
}
