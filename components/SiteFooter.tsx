/**
 * Chân trang công khai: thông tin pháp lý và liên hệ của đơn vị.
 */
import { Logo } from "./Icon";
import { ORG } from "../lib/org";

/** __XOA__ */
export function SiteFooter() {
  return (
    <footer id="lien-he" className="mt-auto border-t border-line bg-surface-2">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-7 sm:px-6 sm:py-8">
        <div className="flex items-center gap-3">
          <Logo className="size-9 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-ink">
              {ORG.name}
            </p>
            <p className="text-xs text-muted">
              {ORG.type} · Chủ quản: {ORG.authority}
            </p>
          </div>
        </div>

        <dl className="grid gap-x-8 gap-y-2 text-xs text-muted sm:grid-cols-2">
          <div className="flex gap-1.5">
            <dt className="shrink-0">Địa chỉ:</dt>
            <dd className="text-ink">{ORG.address}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Mã số thuế:</dt>
            <dd className="tnum text-ink">
              {ORG.taxCode} - cấp ngày {ORG.taxCodeDate}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Người đại diện pháp luật:</dt>
            <dd className="text-ink">
              {ORG.representative} - {ORG.position}
            </dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Thành lập:</dt>
            <dd className="tnum text-ink">{ORG.founded}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Tổng đài:</dt>
            <dd className="tnum text-ink">{ORG.phone}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Thư điện tử:</dt>
            <dd className="text-ink">{ORG.email}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="shrink-0">Giờ phục vụ:</dt>
            <dd className="text-ink">04h00 – 22h00 hằng ngày</dd>
          </div>
        </dl>

        <p className="border-t border-line pt-4 text-xs text-muted">
          © {new Date().getFullYear()} {ORG.name}
        </p>
      </div>
    </footer>
  );
}
