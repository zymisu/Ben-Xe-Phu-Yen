"use client";

/**
 * UC4 - Màn hình chuyến xe của nhà xe: danh sách, đăng ký, cập nhật, xóa.
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
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { TRIP_STATUS_LABEL, TRIP_STATUS_TONE, type TripState } from "@/types";
import { useTrips, type TripFilter } from "./logic";
import { pickTripInfo, routeName } from "./trip";
import { TripForm } from "./TripForm";
import { BoardingSection } from "../uc05-boarding/request/BoardingSection";
import { TripView } from "./TripView";

const TABS: { key: TripFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...(
    ["receiving", "active", "updating", "rejected", "expired"] as TripState[]
  ).map((k) => ({ key: k, label: TRIP_STATUS_LABEL[k] })),
];

export function Trips() {
  const f = useTrips();
  const t = f.viewing;
  const st = t ? f.stateOf(t) : null;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Đăng ký chuyến xe"
        title="Chuyến xe"
        desc="Đăng ký chuyến xuất bến, theo dõi kết quả tiếp nhận và yêu cầu cập nhật."
        phai={
          <Button
            variant="chinh"
            small
            onClick={f.openCreate}
            disabled={!f.canRegister}
          >
            <Icon name="plus" className="size-4" />
            Đăng ký chuyến xe
          </Button>
        }
      />

      {!f.canRegister && (
        <div className="mb-4">
          <Note tone="warn" title="Chưa thể đăng ký chuyến xe">
            Hồ sơ đơn vị cần được bến xe duyệt trước khi đăng ký chuyến.
          </Note>
        </div>
      )}

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Biển số, tài xế, tuyến, ngày..."
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
              <Th>Tuyến đường</Th>
              <Th>Biển số</Th>
              <Th>Tài xế</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Chi tiết</Th>
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
                  <Td label="Tuyến đường" className="text-muted">
                    {routeName(f.routes, row.routeId)}
                  </Td>
                  <Td label="Biển số" className="tnum text-ink">
                    {row.plate}
                  </Td>
                  <Td label="Tài xế" className="text-muted">
                    <p>{row.driverName}</p>
                    <p className="tnum mt-0.5 text-xs">{row.driverPhone}</p>
                  </Td>
                  <Td label="Trạng thái" clip={false}>
                    <Badge tone={TRIP_STATUS_TONE[f.stateOf(row)]} dot>
                      {TRIP_STATUS_LABEL[f.stateOf(row)]}
                    </Badge>
                  </Td>
                  <Td label="Chi tiết" className="lg:text-right" clip={false}>
                    <Button
                      variant="sub"
                      small
                      onClick={() => f.openView(row.id)}
                    >
                      Xem chi tiết
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

      {/* chi tiết một chuyến */}
      <Dialog
        open={t !== null}
        close={f.closeView}
        title={t ? routeName(f.routes, t.routeId) : ""}
        desc={
          t
            ? `${t.plate} · ${formatDate(t.date)} lúc ${t.departAt} · ${TRIP_STATUS_LABEL[f.stateOf(t)]}`
            : undefined
        }
        size="lg"
        notice={
          f.viewError ? <Note tone="danger">{f.viewError}</Note> : undefined
        }
        footer={
          t && (
            <>
              <Button variant="nhe" onClick={f.closeView}>
                Đóng
              </Button>
              {st === "receiving" &&
                (f.confirmDelete ? (
                  <>
                    <Button
                      variant="sub"
                      onClick={() => f.setConfirmDelete(false)}
                    >
                      Không xóa
                    </Button>
                    <Button variant="nguy" onClick={f.remove}>
                      Xác nhận xóa
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="sub"
                    onClick={() => f.setConfirmDelete(true)}
                  >
                    <Icon name="trash" className="size-4" />
                    Xóa chuyến
                  </Button>
                ))}
              {st === "active" && (
                <Button variant="chinh" onClick={() => f.openEdit(t)}>
                  Yêu cầu cập nhật
                </Button>
              )}
              {st === "rejected" && (
                <Button variant="chinh" onClick={() => f.openEdit(t)}>
                  Chỉnh sửa và nộp lại
                </Button>
              )}
            </>
          )
        }
      >
        {t && (
          <div className="space-y-5">
            {st === "expired" && (
              <Note tone="neutral">
                Chuyến đã quá giờ xuất bến dự kiến, không còn chỉnh sửa hay xử
                lý được.
              </Note>
            )}
            {st === "receiving" && (
              <Note tone="warn">
                Chuyến đang chờ nhân viên bến xe tiếp nhận.
              </Note>
            )}
            {st === "updating" && (
              <Note tone="info">
                Yêu cầu cập nhật gửi ngày {formatDate(t.requestedAt)} đang chờ
                duyệt. Trong thời gian này nội dung cũ vẫn có hiệu lực.
              </Note>
            )}
            {t.status === "rejected" && st !== "expired" && (
              <Note tone="danger" title="Chuyến bị từ chối">
                {t.rejectReason}
                <span className="mt-1 block text-xs opacity-80">
                  Ngày xử lý {formatDate(t.reviewedAt)}
                  {t.reviewerName ? ` · ${t.reviewerName}` : ""}
                </span>
              </Note>
            )}
            {t.status === "active" && t.updateRejection && (
              <Note tone="danger" title="Yêu cầu cập nhật gần nhất bị từ chối">
                {t.updateRejection.reason}
                <span className="mt-1 block text-xs opacity-80">
                  Ngày xử lý {formatDate(t.updateRejection.date)}
                  {t.reviewerName ? ` · ${t.reviewerName}` : ""}. Nội dung hiện
                  tại vẫn có hiệu lực.
                </span>
              </Note>
            )}
            <TripView
              routes={f.routes}
              info={pickTripInfo(t)}
              request={t.request}
            />
            <BoardingSection trip={t} />
          </div>
        )}
      </Dialog>

      {/* nhập thông tin */}
      <Dialog
        open={f.mode !== null}
        close={f.closeForm}
        title={
          f.mode === "create"
            ? "Đăng ký chuyến xe"
            : "Yêu cầu cập nhật chuyến xe"
        }
        desc="Nhập đủ thông tin xe, tài xế, tuyến đường và thời gian xuất bến dự kiến."
        size="lg"
        notice={
          f.formError ? <Note tone="danger">{f.formError}</Note> : undefined
        }
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-chuyen-xe">
              Gửi yêu cầu
            </Button>
          </>
        }
      >
        <form id="form-chuyen-xe" onSubmit={f.submit} noValidate>
          <TripForm
            form={f.form}
            setField={f.setField}
            routes={f.routes}
            vehicles={f.vehicles}
            drivers={f.drivers}
            autoFocus
          />
        </form>
      </Dialog>
    </>
  );
}
