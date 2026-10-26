"use client";

/**
 * UC3 - Màn hình nhân viên tiếp nhận: danh sách hồ sơ nhà xe, đối chiếu và phê duyệt.
 */
import { FilterBar } from "@/components/FilterBar";
import { Icon } from "@/components/Icon";
import { Pager, usePaged } from "@/components/Pager";
import {
  Badge,
  Button,
  cx,
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
import { DOSSIER_STATUS_LABEL, DOSSIER_STATUS_TONE } from "@/types";
import {
  isAwaiting,
  LEGAL_DOCS,
  subjectOf,
  useDossiers,
  type Filter,
} from "./logic";
import { ProfileView } from "./ProfileView";
import { pickInfo, routeLabel } from "./profile";

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "receiving", label: DOSSIER_STATUS_LABEL.receiving },
  { key: "active", label: DOSSIER_STATUS_LABEL.active },
  { key: "updating", label: DOSSIER_STATUS_LABEL.updating },
  { key: "rejected", label: DOSSIER_STATUS_LABEL.rejected },
];

export function Dossiers() {
  const f = useDossiers();
  const d = f.current;
  const awaiting = d ? isAwaiting(d) : false;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Quản lý đơn vị vận tải"
        title="Hồ sơ nhà xe"
        desc="Tiếp nhận, đối chiếu giấy tờ pháp lý và phê duyệt hồ sơ đăng ký, yêu cầu cập nhật của các đơn vị vận tải."
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Tên đơn vị, mã số thuế, tuyến..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Không có hồ sơ nào"
            desc="Đổi bộ lọc trạng thái hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Đơn vị vận tải</Th>
              <Th>Tuyến đề nghị</Th>
              <Th>Ngày nộp</Th>
              <Th>Trạng thái</Th>
              <Th>Nhân viên phê duyệt</Th>
              <Th className="text-right">Tiếp nhận</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Đơn vị vận tải">
                    <p className="font-semibold text-ink">{row.companyName}</p>
                    <p className="tnum mt-0.5 text-xs text-muted">
                      MST {row.taxCode} · {row.phone}
                    </p>
                  </Td>
                  <Td label="Tuyến đề nghị" className="text-muted">
                    {routeLabel(subjectOf(row))}
                    <p className="mt-0.5 text-xs">
                      {subjectOf(row).serviceType} ·{" "}
                      {subjectOf(row).vehicles.length} xe
                    </p>
                  </Td>
                  <Td label="Ngày nộp" className="tnum text-muted">
                    {formatDate(row.requestedAt ?? row.submittedAt)}
                  </Td>
                  <Td label="Trạng thái">
                    <Badge tone={DOSSIER_STATUS_TONE[row.status]} dot>
                      {DOSSIER_STATUS_LABEL[row.status]}
                    </Badge>
                  </Td>
                  <Td label="Nhân viên phê duyệt" className="text-muted">
                    {row.reviewerName || "-"}
                  </Td>
                  <Td label="Tiếp nhận" className="lg:text-right" clip={false}>
                    <Button
                      variant={isAwaiting(row) ? "chinh" : "sub"}
                      small
                      onClick={() => f.openDossier(row.id)}
                    >
                      {isAwaiting(row) ? "Đối chiếu" : "Xem hồ sơ"}
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

      {/* đối chiếu và phê duyệt */}
      <Dialog
        open={d !== null}
        close={f.closeDossier}
        title={d?.companyName ?? ""}
        desc={
          d
            ? `${
                d.status === "updating" ? "Yêu cầu cập nhật" : "Hồ sơ"
              } nộp ngày ${formatDate(d.requestedAt ?? d.submittedAt)} · ${
                DOSSIER_STATUS_LABEL[d.status]
              }`
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
                  {d?.status === "updating" ? "Duyệt cập nhật" : "Duyệt hồ sơ"}
                </Button>
              </>
            )
          ) : (
            <Button variant="sub" onClick={f.closeDossier}>
              Đóng
            </Button>
          )
        }
      >
        {d && (
          <div className="space-y-6">
            <p className="text-sm text-muted">
              Số điện thoại tài khoản:{" "}
              <strong className="tnum text-ink">{d.phone}</strong>
            </p>

            <ProfileView info={pickInfo(d)} request={d.request} />

            {awaiting && (
              <div className="border-t border-line pt-5">
                <p className="text-xs font-bold tracking-wide text-muted uppercase">
                  Đối chiếu giấy tờ pháp lý
                  {d.status === "updating" && " (theo nội dung cập nhật)"}
                </p>
                <div className="mt-3 space-y-2">
                  {LEGAL_DOCS.map((doc) => (
                    <label
                      key={doc.key}
                      className={cx(
                        "flex cursor-pointer items-start gap-3 rounded-[14px] border px-4 py-3 transition-colors",
                        f.checked[doc.key]
                          ? "border-ok/40 bg-ok-soft"
                          : "border-line bg-surface-2",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 size-4 shrink-0 accent-[var(--ok)]"
                        checked={!!f.checked[doc.key]}
                        onChange={() => f.toggleDoc(doc.key)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          {doc.label}
                        </span>
                        <span className="tnum mt-0.5 block text-xs break-words text-muted">
                          {doc.detail(subjectOf(d))}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {f.rejecting && awaiting && (
              <div className="hien-len border-t border-line pt-5">
                <p className="mb-2 text-sm font-semibold text-ink">
                  Lý do từ chối
                </p>
                <Textarea
                  rows={3}
                  value={f.reason}
                  onChange={(e) => f.setReason(e.target.value)}
                  placeholder="Nêu rõ giấy tờ còn thiếu hoặc nội dung cần bổ sung."
                  autoFocus
                />
              </div>
            )}

            {d.status === "rejected" && (
              <Note tone="danger">
                Từ chối ngày {formatDate(d.reviewedAt)}
                {d.reviewerName ? ` · ${d.reviewerName}` : ""}
                {d.rejectReason ? ` - ${d.rejectReason}` : ""}
              </Note>
            )}
            {d.status === "active" && d.updateRejection && (
              <Note tone="danger">
                Đã từ chối yêu cầu cập nhật ngày{" "}
                {formatDate(d.updateRejection.date)}
                {d.reviewerName ? ` · ${d.reviewerName}` : ""} -{" "}
                {d.updateRejection.reason}
              </Note>
            )}
            {d.status === "active" && d.reviewedAt && !d.updateRejection && (
              <Note tone="ok">
                Duyệt ngày {formatDate(d.reviewedAt)}
                {d.reviewerName ? ` · ${d.reviewerName}` : ""}
              </Note>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
