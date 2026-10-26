"use client";

/**
 * UC4 - Màn hình nhân viên tiếp nhận: danh sách chuyến chờ duyệt, duyệt hoặc từ chối.
 */
import { FilterBar } from "@/components/FilterBar";
import { Icon } from "@/components/Icon";
import { Pager, usePaged } from "@/components/Pager";
import {
  Badge,
  Button,
  Dialog,
  Empty,
  Note,
  PageHeader,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { TRIP_STATUS_LABEL, TRIP_STATUS_TONE, type TripState } from "@/types";
import { isAwaitingState, pickTripInfo, routeName } from "../trip";
import { TripView } from "../TripView";
import { useTripRequests, type TripFilter } from "./logic";

const TABS: { key: TripFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...(
    ["receiving", "active", "updating", "rejected", "expired"] as TripState[]
  ).map((k) => ({ key: k, label: TRIP_STATUS_LABEL[k] })),
];

export function TripRequests() {
  const f = useTripRequests();
  const t = f.current;
  const st = t ? f.stateOf(t) : null;
  const awaiting = st ? isAwaitingState(st) : false;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Quản lý chuyến xe"
        title="Tiếp nhận chuyến xe"
        desc="Xem, duyệt hoặc từ chối yêu cầu đăng ký và yêu cầu cập nhật chuyến xe của các nhà xe."
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Nhà xe, biển số, tài xế, tuyến..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Không có chuyến xe nào"
            desc="Đổi bộ lọc trạng thái hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Xuất bến</Th>
              <Th>Nhà xe</Th>
              <Th>Tuyến đường</Th>
              <Th>Trạng thái</Th>
              <Th>Nhân viên phê duyệt</Th>
              <Th className="text-right">Tiếp nhận</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Xuất bến">
                    <p className="tnum font-semibold text-ink">
                      {row.departAt}
                    </p>
                    <p className="tnum mt-0.5 text-xs text-muted">
                      {formatDate(row.date)}
                    </p>
                  </Td>
                  <Td label="Nhà xe" className="font-semibold text-ink">
                    {f.carrierOf.get(row.dossierId) ?? "-"}
                  </Td>
                  <Td label="Tuyến đường" className="text-muted">
                    <p>{routeName(f.routes, row.routeId)}</p>
                    <p className="tnum mt-0.5 text-xs">{row.plate}</p>
                  </Td>
                  <Td label="Trạng thái" clip={false}>
                    <Badge tone={TRIP_STATUS_TONE[f.stateOf(row)]} dot>
                      {TRIP_STATUS_LABEL[f.stateOf(row)]}
                    </Badge>
                  </Td>
                  <Td label="Nhân viên phê duyệt" className="text-muted">
                    {row.reviewerName || "-"}
                  </Td>
                  <Td label="Tiếp nhận" className="lg:text-right" clip={false}>
                    <Button
                      variant={
                        isAwaitingState(f.stateOf(row)) ? "chinh" : "sub"
                      }
                      small
                      onClick={() => f.openTrip(row.id)}
                    >
                      {isAwaitingState(f.stateOf(row)) ? "Duyệt" : "Xem"}
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
        open={t !== null}
        close={f.closeTrip}
        title={t ? routeName(f.routes, t.routeId) : ""}
        desc={
          t
            ? `${f.carrierOf.get(t.dossierId) ?? "-"} · ${TRIP_STATUS_LABEL[f.stateOf(t)]}`
            : undefined
        }
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          awaiting ? (
            f.rejecting ? (
              <>
                <Button variant="nhe" onClick={() => f.setRejecting(false)}>
                  Quay lại
                </Button>
                <Button variant="nguy" onClick={f.reject}>
                  Xác nhận từ chối
                </Button>
              </>
            ) : (
              <>
                <Button variant="sub" onClick={() => f.setRejecting(true)}>
                  Từ chối duyệt
                </Button>
                <Button variant="ok" onClick={f.approve}>
                  <Icon name="check" className="size-4" />
                  {st === "updating" ? "Duyệt cập nhật" : "Duyệt chuyến xe"}
                </Button>
              </>
            )
          ) : (
            <Button variant="sub" onClick={f.closeTrip}>
              Đóng
            </Button>
          )
        }
      >
        {t && (
          <div className="space-y-6">
            <TripView
              routes={f.routes}
              info={pickTripInfo(t)}
              request={t.request}
            />

            {f.rejecting && awaiting && (
              <div className="hien-len border-t border-line pt-5">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Lý do từ chối
                </p>
                <Textarea
                  rows={3}
                  value={f.reason}
                  onChange={(e) => f.setReason(e.target.value)}
                  placeholder="Nêu rõ nội dung cần chỉnh sửa."
                  autoFocus
                />
              </div>
            )}

            {st === "expired" && (
              <Note tone="neutral">
                Chuyến đã quá giờ xuất bến dự kiến, không còn duyệt hay từ chối
                được.
              </Note>
            )}

            {t.status === "rejected" && st !== "expired" && (
              <Note tone="danger">
                Từ chối ngày {formatDate(t.reviewedAt)}
                {t.reviewerName ? ` · ${t.reviewerName}` : ""}
                {t.rejectReason ? ` - ${t.rejectReason}` : ""}
              </Note>
            )}
            {st === "active" && t.updateRejection && (
              <Note tone="danger">
                Đã từ chối yêu cầu cập nhật ngày{" "}
                {formatDate(t.updateRejection.date)}
                {t.reviewerName ? ` · ${t.reviewerName}` : ""} -{" "}
                {t.updateRejection.reason}
              </Note>
            )}
            {st === "active" && t.reviewedAt && !t.updateRejection && (
              <Note tone="ok">
                Duyệt ngày {formatDate(t.reviewedAt)}
                {t.reviewerName ? ` · ${t.reviewerName}` : ""}
              </Note>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
