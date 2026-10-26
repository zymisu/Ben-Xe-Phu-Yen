"use client";

/** UC11.2 - Xuất báo cáo: chọn trang, khổ giấy, định dạng rồi tạo tệp. */
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { chartImage } from "./chartImage";
import type { ReportTable } from "../reports";
import {
  checkRange,
  exportCsv,
  exportPdf,
  exportXlsx,
  pageCount,
  pageRows,
  rangeRows,
  type Format,
  type Orientation,
  type PaperSize,
} from "./rules";

export type Step = "preview" | "format" | "confirm";

export function useExport(report: ReportTable, close: () => void) {
  const { toast } = useStore();

  const [step, setStep] = useState<Step>("preview");
  const [size, setSizeState] = useState<PaperSize>("A4");
  const [orient, setOrientState] = useState<Orientation>("portrait");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState(() =>
    String(pageCount(report, "A4", "portrait")),
  );
  const [view, setView] = useState(1);
  const [format, setFormat] = useState<Format>("pdf");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const pages = useMemo(
    () => pageCount(report, size, orient),
    [report, size, orient],
  );

  /** Đổi khổ giấy hoặc hướng thì số trang đổi theo, chọn lại toàn bộ các trang */
  function reset(nextSize: PaperSize, nextOrient: Orientation) {
    const n = pageCount(report, nextSize, nextOrient);
    setFrom("1");
    setTo(String(n));
    setView(1);
    setError("");
  }

  function setSize(s: PaperSize) {
    setSizeState(s);
    reset(s, orient);
  }

  function setOrient(o: Orientation) {
    setOrientState(o);
    reset(size, o);
  }

  const f = Number(from);
  const t = Number(to);

  function toFormat() {
    const res = checkRange(f, t, pages);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError("");
    setStep("format");
  }

  async function confirm() {
    setBusy(true);
    try {
      const now = new Date();
      // CSV là văn bản thuần nên chỉ có bảng; PDF và Excel kèm biểu đồ dạng ảnh
      if (format === "csv") {
        exportCsv(report, rangeRows(report, size, orient, f, t), now);
      } else {
        const chart = await chartImage(report.chart);
        if (format === "pdf") exportPdf(report, size, orient, f, t, chart);
        else
          await exportXlsx(
            report,
            rangeRows(report, size, orient, f, t),
            now,
            chart,
          );
      }
      toast("ok", "Xuất báo cáo thành công.");
      close();
    } finally {
      setBusy(false);
    }
  }

  return {
    step,
    setStep,
    size,
    setSize,
    orient,
    setOrient,
    from,
    setFrom: (v: string) => {
      setFrom(v);
      setError("");
    },
    to,
    setTo: (v: string) => {
      setTo(v);
      setError("");
    },
    pages,
    view,
    setView,
    previewRows: pageRows(report, size, orient, Math.min(view, pages)),
    format,
    setFormat,
    error,
    busy,
    toFormat,
    confirm,
  };
}
