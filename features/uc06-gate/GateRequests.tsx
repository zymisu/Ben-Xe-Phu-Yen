"use client";

/**
 * UC6, UC8.2 - Danh sách yêu cầu xe vào/ra bến để nhân viên điều độ ngoài trời duyệt.
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
import {
  ENTRY_STATUS_LABEL,
  ENTRY_STATUS_TONE,
  type EntryKind,
  type EntryStatus,
} from "@/types";
import { CameraFrame } from "./CameraFrame";
import { useGate, type EntryFilter } from "./logic";
import { allPass } from "./rules";

const label = (k: EntryKind, s: EntryStatus): string =>
  k === "exit" && s === "approved" ? "Đã cho ra" : ENTRY_STATUS_LABEL[s];

const tabsOf = (k: EntryKind): { key: EntryFilter; label: string }[] => [
  { key: "all", label: "Tất cả" },
  ...(["pending", "approved", "rejected"] as EntryStatus[]).map((s) => ({
    key: s,
    label: label(k, s),
  })),
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s?: string): string {
  if (!s) return "-";
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function GateRequests({ kind = "entry" }: { kind?: EntryKind }) {
  const f = useGate(kind);
  const exit = kind === "exit";
  const tabs = tabsOf(kind);
  const e = f.current;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);
  const passed = e ? allPass(e) : true;

  return (
    <>
      <PageHeader
        branch={exit ? "Quản lý xe rời bến" : "Kiểm soát xe vào bến"}
        title={exit ? "Xe ra bến" : "Xe vào bến"}
        desc={
          exit
            ? "Xem kết quả đối chiếu khi tài xế quẹt thẻ tại cổng ra, phê duyệt cho ra hoặc từ chối."
            : "Xem kết quả đối chiếu khi tài xế quẹt thẻ tại cổng, phê duyệt cho vào hoặc từ chối."
        }
      />

      <FilterBar
        tabs={tabs}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Tài xế, biển số, nhà xe, cổng..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có yêu cầu nào"
            desc="Các yêu cầu hiện ở đây khi tài xế quẹt thẻ tại cổng."
          />
        ) : (
          <Table>
            <THead>
              <Th>Thời điểm</Th>
              <Th>Tài xế</Th>
              <Th>Biển số</Th>
              <Th>Đối chiếu</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Xử lý</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => {
                const pass = row.checks.filter((c) => c.ok).length;
                return (
                  <Tr key={row.id}>
                    <Td label="Thời điểm" className="tnum text-muted">
                      <p className="font-semibold text-ink">
                        {row.requestedAt.split("T")[1]}
                      </p>
                      <p className="mt-0.5 text-xs">
                        {formatDate(row.requestedAt.split("T")[0])} · {row.gate}
                      </p>
                    </Td>
                    <Td label="Tài xế" className="text-muted">
                      <p className="font-semibold text-ink">{row.driverName}</p>
                      <p className="mt-0.5 text-xs">
                        {f.carrierOf.get(row.dossierId) ?? "-"}
                      </p>
                    </Td>
                    <Td label="Biển số" className="tnum text-ink">
                      {row.plate || "-"}
                    </Td>
                    <Td label="Đối chiếu" clip={false}>
                      <Badge
                        tone={pass === row.checks.length ? "ok" : "danger"}
                      >
                        {pass}/{row.checks.length} đạt
                      </Badge>
                    </Td>
                    <Td label="Trạng thái" clip={false}>
                      <Badge tone={ENTRY_STATUS_TONE[row.status]} dot>
                        {label(kind, row.status)}
                        {row.exception && " (ngoại lệ)"}
                      </Badge>
                    </Td>
                    <Td label="Xử lý" className="lg:text-right" clip={false}>
                      <Button
                        variant={row.status === "pending" ? "chinh" : "sub"}
                        small
                        onClick={() => f.open(row.id)}
                      >
                        {row.status === "pending" ? "Xem và duyệt" : "Xem"}
                        <Icon name="chevronRight" className="size-4" />
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
        <Pager {...paged} />
      </div>

      <Dialog
        open={e !== null}
        close={f.close}
        title={
          e
            ? `Yêu cầu ${exit ? "ra" : "vào"} bến - ${e.plate || "chưa đọc được biển số"}`
            : ""
        }
        desc={
          e
            ? `${e.driverName} · ${f.carrierOf.get(e.dossierId) ?? "-"} · ${showAt(e.requestedAt)}`
            : undefined
        }
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          e?.status === "pending" ? (
            f.mode ? (
              <>
                <Button variant="nhe" onClick={() => f.chooseMode(null)}>
                  Quay lại
                </Button>
                <Button
                  variant={f.mode === "reject" ? "nguy" : "ok"}
                  type="submit"
                  form="form-ly-do"
                >
                  {f.mode === "reject"
                    ? "Xác nhận từ chối"
                    : exit
                      ? "Xác nhận cho ra ngoại lệ"
                      : "Xác nhận cho vào ngoại lệ"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="sub" onClick={() => f.chooseMode("reject")}>
                  Từ chối
                </Button>
                {passed ? (
                  <Button variant="ok" onClick={f.approve}>
                    <Icon name="check" className="size-4" />
                    {exit ? "Phê duyệt cho ra" : "Phê duyệt cho vào"}
                  </Button>
                ) : (
                  <Button
                    variant="chinh"
                    onClick={() => f.chooseMode("exception")}
                  >
                    {exit ? "Cho ra ngoại lệ" : "Cho vào ngoại lệ"}
                  </Button>
                )}
              </>
            )
          ) : (
            <Button variant="sub" onClick={f.close}>
              Đóng
            </Button>
          )
        }
      >
        {e && (
          <div className="space-y-5">
            <CameraFrame plate={e.plate} gate={e.gate} at={e.requestedAt} />

            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {[
                ["Tài xế", e.driverName],
                ["Nhà xe", f.carrierOf.get(e.dossierId) ?? "-"],
                ["Mã thẻ", e.cardUid],
                ["Cổng", e.gate],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="font-semibold break-words text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                Kết quả đối chiếu
              </p>
              <ul className="space-y-2">
                {e.checks.map((c) => (
                  <li
                    key={c.key}
                    className={cx(
                      "flex items-start gap-3 rounded-[14px] border px-4 py-3",
                      c.ok
                        ? "border-ok/30 bg-ok-soft"
                        : "border-danger/30 bg-danger-soft",
                    )}
                  >
                    <Icon
                      name={c.ok ? "check" : "close"}
                      className={cx(
                        "mt-0.5 size-4 shrink-0",
                        c.ok ? "text-ok" : "text-danger",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {c.label}
                      </span>
                      <span className="tnum block text-xs break-words text-muted">
                        {c.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {e.status !== "pending" && (
              <Note tone={e.status === "approved" ? "ok" : "danger"}>
                {label(kind, e.status)}
                {e.exception && " (ngoại lệ)"} lúc {showAt(e.decidedAt)}
                {e.decidedBy ? ` · ${e.decidedBy}` : ""}
                {e.reason ? ` - ${e.reason}` : ""}
              </Note>
            )}

            {e.status === "pending" && f.mode && (
              <form
                id="form-ly-do"
                onSubmit={f.submitReason}
                noValidate
                className="hien-len border-t border-line pt-5"
              >
                <p className="mb-2 text-sm font-semibold text-ink">
                  {f.mode === "reject"
                    ? "Lý do từ chối (tài xế sẽ được báo)"
                    : exit
                      ? "Lý do cho ra ngoại lệ"
                      : "Lý do cho vào ngoại lệ"}
                </p>
                <Textarea
                  rows={3}
                  value={f.reason}
                  onChange={(ev) => f.setReason(ev.target.value)}
                  autoFocus
                />
              </form>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
