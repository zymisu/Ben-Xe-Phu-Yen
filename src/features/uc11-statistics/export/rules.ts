/**
 * Xuất báo cáo (UC11.2): chia trang theo khổ giấy, chọn dải trang rồi tạo tệp
 * PDF, Excel hoặc CSV từ đúng các trang đã chọn.
 */
import { fail, ok, type Result } from "@/types";
import type { Cell, ReportTable } from "../reports";

export type PaperSize = "A3" | "A4" | "A5";
export type Orientation = "portrait" | "landscape";
export type Format = "pdf" | "xlsx" | "csv";

export const SIZES: PaperSize[] = ["A3", "A4", "A5"];

export const FORMAT_LABEL: Record<Format, string> = {
  pdf: "PDF",
  xlsx: "Excel (.xlsx)",
  csv: "CSV (.csv)",
};

/** Số dòng dữ liệu vừa một trang, theo khổ giấy và hướng */
const ROWS: Record<PaperSize, Record<Orientation, number>> = {
  A3: { portrait: 44, landscape: 28 },
  A4: { portrait: 28, landscape: 16 },
  A5: { portrait: 16, landscape: 9 },
};

export const rowsPerPage = (size: PaperSize, o: Orientation): number =>
  ROWS[size][o];

export const pageCount = (t: ReportTable, size: PaperSize, o: Orientation) =>
  Math.max(1, Math.ceil(t.rows.length / rowsPerPage(size, o)));

/** Các dòng của trang `page` (bắt đầu từ 1) */
export function pageRows(
  t: ReportTable,
  size: PaperSize,
  o: Orientation,
  page: number,
): Cell[][] {
  const n = rowsPerPage(size, o);
  return t.rows.slice((page - 1) * n, page * n);
}

/** Các dòng thuộc dải trang từ `from` đến `to` */
export function rangeRows(
  t: ReportTable,
  size: PaperSize,
  o: Orientation,
  from: number,
  to: number,
): Cell[][] {
  const n = rowsPerPage(size, o);
  return t.rows.slice((from - 1) * n, to * n);
}

/** Dải trang phải nằm trong số trang của báo cáo */
export function checkRange(from: number, to: number, pages: number): Result {
  if (!Number.isInteger(from) || !Number.isInteger(to))
    return fail("Số trang phải là số nguyên.");
  if (from < 1 || to > pages)
    return fail(`Số trang phải nằm trong khoảng từ 1 đến ${pages}.`);
  if (from > to)
    return fail("Trang bắt đầu không được lớn hơn trang kết thúc.");
  return ok("");
}

/** Tên tệp: bao-cao-<loại>-YYYYMMDD.<đuôi> */
export function fileName(t: ReportTable, ext: string, now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `bao-cao-${t.key}-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}.${ext}`;
}

// tệp

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const esc = (c: Cell) => `"${String(c).replace(/"/g, '""')}"`;

/** Bảng dạng mảng các dòng: tiêu đề, thời điểm lập, chỉ số tóm tắt, rồi bảng dữ liệu */
function sheet(t: ReportTable, rows: Cell[][]): Cell[][] {
  return [
    [t.title],
    [`Lập lúc ${t.generatedAt}`],
    [],
    ...t.summary.map((s) => [s.label, s.value]),
    [],
    t.columns,
    ...rows,
  ];
}

export function exportCsv(t: ReportTable, rows: Cell[][], now: Date) {
  const text = sheet(t, rows)
    .map((r) => r.map(esc).join(","))
    .join("\r\n");
  // BOM để Excel đọc đúng tiếng Việt có dấu
  download(
    new Blob(["﻿", text], { type: "text/csv;charset=utf-8" }),
    fileName(t, "csv", now),
  );
}

/** Excel: tiêu đề, chỉ số tóm tắt, biểu đồ (ảnh) rồi bảng dữ liệu trong cùng một trang tính */
export async function exportXlsx(
  t: ReportTable,
  rows: Cell[][],
  now: Date,
  chart: string,
) {
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const ws = wb.addWorksheet("Báo cáo");
  const cols = Math.max(t.columns.length, 4);

  ws.addRow([t.title]).font = { bold: true, size: 14 };
  ws.addRow([`Lập lúc ${t.generatedAt}`]);
  ws.addRow([]);
  for (const s of t.summary) ws.addRow([s.label, s.value]);
  ws.addRow([]);

  // Chừa 18 dòng trống bên dưới cho ảnh biểu đồ
  const imageRow = ws.rowCount;
  const id = wb.addImage({ base64: chart, extension: "png" });
  ws.addImage(id, {
    tl: { col: 0, row: imageRow },
    ext: { width: 720, height: 336 },
  });
  for (let i = 0; i < 18; i++) ws.addRow([]);

  const head = ws.addRow(t.columns);
  head.font = { bold: true };
  head.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEEEEEE" },
    };
    c.border = { bottom: { style: "thin" } };
  });
  for (const r of rows) ws.addRow(r);

  for (let c = 1; c <= cols; c++) {
    const header = t.columns[c - 1] ?? "";
    const longest = Math.max(
      header.length,
      ...rows.map((r) => String(r[c - 1] ?? "").length),
    );
    ws.getColumn(c).width = Math.min(40, Math.max(14, longest + 2));
  }

  const out = await wb.xlsx.writeBuffer();
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    fileName(t, "xlsx", now),
  );
}

const html = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * PDF: dựng tài liệu theo đúng khổ giấy và hướng đã chọn rồi mở hộp thoại in
 * của trình duyệt (chọn "Lưu dưới dạng PDF"). Mỗi trang báo cáo là một trang in.
 */
export function exportPdf(
  t: ReportTable,
  size: PaperSize,
  o: Orientation,
  from: number,
  to: number,
  chart: string,
) {
  const pages: string[] = [];
  for (let p = from; p <= to; p++) {
    const body = pageRows(t, size, o, p)
      .map(
        (r) =>
          `<tr>${r
            .map(
              (c) =>
                `<td class="${typeof c === "number" ? "n" : ""}">${html(String(c))}</td>`,
            )
            .join("")}</tr>`,
      )
      .join("");
    const summary =
      p === from
        ? `<p class="s">${t.summary
            .map((s) => `${html(s.label)}: <b>${html(String(s.value))}</b>`)
            .join(" &nbsp;|&nbsp; ")}</p>`
        : "";
    pages.push(`<section>
      <h1>${html(t.title)}</h1>
      <p class="m">Lập lúc ${html(t.generatedAt)} · Trang ${p}/${to}</p>
      ${summary}
      ${p === from ? `<img class="c" src="${chart}" alt="">` : ""}
      <table><thead><tr>${t.columns
        .map((c) => `<th>${html(c)}</th>`)
        .join("")}</tr></thead><tbody>${body}</tbody></table>
    </section>`);
  }
  const doc = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${html(t.title)}</title>
  <style>
    @page { size: ${size} ${o}; margin: 12mm; }
    body { font-family: "Be Vietnam Pro", Arial, sans-serif; color: #111; font-size: 11px; }
    section { page-break-after: always; }
    section:last-child { page-break-after: auto; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    .m { color: #555; margin: 0 0 8px; }
    .s { margin: 0 0 10px; line-height: 1.6; }
    .c { display: block; max-width: 100%; max-height: 80mm; margin: 0 auto 10px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #999; padding: 4px 6px; text-align: left; }
    th { background: #eee; }
    td.n { text-align: right; }
  </style></head><body>${pages.join("")}</body></html>`;

  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  const w = frame.contentWindow;
  if (!w) return;
  w.document.open();
  w.document.write(doc);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
    setTimeout(() => frame.remove(), 2000);
  }, 300);
}
