"use client";

/**
 * Màn hình thông báo của người dùng đang đăng nhập.
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
import { ReportView } from "@/features/uc11-statistics/ReportView";
import { useNotifications, type NotificationFilter } from "./logic";

const TABS: { key: NotificationFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "read", label: "Đã đọc" },
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s: string): string {
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Notifications() {
  const f = useNotifications();
  const n = f.current;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Tài khoản"
        title="Thông báo"
        desc="Thông báo gửi tới tài khoản của bạn."
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Tiêu đề, nội dung..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có thông báo nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Thời điểm</Th>
              <Th>Nội dung</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Đọc</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Thời điểm" className="tnum text-muted">
                    {showAt(row.createdAt)}
                  </Td>
                  <Td
                    label="Nội dung"
                    className={
                      row.read ? "font-semibold text-ink" : "font-bold text-ink"
                    }
                  >
                    <p>{row.title}</p>
                    <p className="mt-0.5 text-xs font-normal text-muted">
                      {row.text}
                    </p>
                  </Td>
                  <Td label="Trạng thái" clip={false}>
                    <Badge tone={row.read ? "ok" : "warn"} dot>
                      {row.read ? "Đã đọc" : "Chưa đọc"}
                    </Badge>
                  </Td>
                  <Td label="Đọc" className="lg:text-right" clip={false}>
                    <Button
                      variant={row.read ? "sub" : "chinh"}
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
        open={n !== null}
        close={f.close}
        title={n?.title ?? ""}
        desc={n ? showAt(n.createdAt) : undefined}
        size={n?.report ? "lg" : "sm"}
        footer={
          <Button variant="sub" onClick={f.close}>
            Đóng
          </Button>
        }
      >
        {n && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-ink">{n.text}</p>
            {n.report && <ReportView report={n.report} />}
          </div>
        )}
      </Dialog>
    </>
  );
}
