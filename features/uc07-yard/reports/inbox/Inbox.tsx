"use client";

/**
 * UC7.2 - Màn hình nhân viên điều độ trong nhà đọc báo cáo của nhà xe.
 */
import { FilterBar } from "@/components/FilterBar";
import { Icon } from "@/components/Icon";
import { Pager, usePaged } from "@/components/Pager";
import {
  Badge,
  Button,
  Dialog,
  Empty,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { REPORT_STATUS_LABEL } from "@/types";
import type { ReportFilter } from "../logic";
import { useInbox } from "./logic";

const TABS: { key: ReportFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: REPORT_STATUS_LABEL.unread },
  { key: "read", label: REPORT_STATUS_LABEL.read },
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s?: string): string {
  if (!s) return "-";
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Inbox() {
  const f = useInbox();
  const r = f.current;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Điều phối xe tại bến"
        title="Báo cáo nhà xe"
        desc="Đọc các báo cáo mà nhà xe gửi về cơ sở vật chất, sự việc tại bến."
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Nhà xe, tiêu đề, nội dung, biển số..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có báo cáo nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Thời điểm gửi</Th>
              <Th>Nhà xe</Th>
              <Th>Tiêu đề</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Đọc</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Thời điểm gửi" className="tnum text-muted">
                    {showAt(row.createdAt)}
                  </Td>
                  <Td label="Nhà xe" className="text-muted">
                    {f.carrierOf.get(row.dossierId) ?? "-"}
                  </Td>
                  <Td
                    label="Tiêu đề"
                    className={
                      f.statusOf(row) === "unread"
                        ? "font-bold text-ink"
                        : "font-semibold text-ink"
                    }
                  >
                    {row.title}
                  </Td>
                  <Td label="Trạng thái" clip={false}>
                    <Badge
                      tone={f.statusOf(row) === "read" ? "ok" : "warn"}
                      dot
                    >
                      {REPORT_STATUS_LABEL[f.statusOf(row)]}
                    </Badge>
                  </Td>
                  <Td label="Đọc" className="lg:text-right" clip={false}>
                    <Button
                      variant={f.statusOf(row) === "unread" ? "chinh" : "sub"}
                      small
                      onClick={() => f.open(row.id)}
                    >
                      Đọc
                      <Icon name="chevronRight" className="size-4" />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pager {...paged} />
      </div>

      <Dialog
        open={r !== null}
        close={f.close}
        title={r?.title ?? ""}
        desc={
          r
            ? `${f.carrierOf.get(r.dossierId) ?? "-"} · gửi lúc ${showAt(r.createdAt)}`
            : undefined
        }
        size="lg"
        footer={
          <Button variant="sub" onClick={f.close}>
            Đóng
          </Button>
        }
      >
        {r && (
          <div className="space-y-4">
            {r.plate && (
              <p className="text-sm text-muted">
                Xe liên quan:{" "}
                <strong className="tnum text-ink">{r.plate}</strong>
              </p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink">
              {r.body}
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
