"use client";

/**
 * UC5 - Màn hình nhân viên điều độ trong nhà: sắp xếp giờ và vị trí đón khách.
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
  Field,
  Note,
  O,
  PageHeader,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate, hmOf } from "@/lib/format";
import {
  BOARDING_STATE_LABEL,
  BOARDING_STATE_TONE,
  type BoardingState,
} from "@/types";
import { routeName } from "../uc04-trips/trip";
import { BOARD_MINUTES } from "./rules";
import { useBoarding, type BoardingFilter } from "./logic";

const TABS: { key: BoardingFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...(["pending", "assigned", "adjusting", "conflict"] as BoardingState[]).map(
    (k) => ({ key: k, label: BOARDING_STATE_LABEL[k] }),
  ),
];

const CHIP: Record<string, string> = {
  free: "border-line bg-card text-ink hover:border-brand",
  busy: "border-warn/40 bg-warn-soft text-warn",
  unavailable: "border-danger/40 bg-danger-soft text-danger",
};

export function Boarding() {
  const f = useBoarding();
  const t = f.current;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);
  const used = f.statuses.filter((s) => s.state !== "free").length;

  return (
    <>
      <PageHeader
        branch="Phân công xe đón khách"
        title="Đón khách"
        desc="Sắp xếp thời gian và vị trí đón khách cho các chuyến đã duyệt, xử lý yêu cầu điều chỉnh giờ đón của nhà xe."
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Nhà xe, biển số, tuyến, vị trí..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Không có chuyến nào"
            desc="Đổi bộ lọc trạng thái hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Giờ trên vé</Th>
              <Th>Nhà xe</Th>
              <Th>Tuyến đường</Th>
              <Th>Đón khách</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Xử lý</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => {
                const state = f.stateOf(row);
                const slot = f.effectiveSlot(row);
                const shifted =
                  slot &&
                  row.boarding &&
                  hmOf(slot.start) !== row.boarding.startAt;
                return (
                  <Tr key={row.id}>
                    <Td label="Giờ trên vé">
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
                    <Td label="Đón khách" className="text-muted">
                      {row.boarding && slot ? (
                        <>
                          <p className="font-semibold text-ink">
                            {f.bayOf.get(row.boarding.bayId)?.code}
                          </p>
                          <p className="tnum mt-0.5 text-xs">
                            {row.boarding.startAt} -{" "}
                            {hmOfEnd(row.boarding.startAt)}
                            {shifted && ` (thực tế ${hmOf(slot.start)})`}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </Td>
                    <Td label="Trạng thái" clip={false}>
                      <Badge tone={BOARDING_STATE_TONE[state]} dot>
                        {BOARDING_STATE_LABEL[state]}
                      </Badge>
                    </Td>
                    <Td label="Xử lý" className="lg:text-right" clip={false}>
                      <Button
                        variant={state === "assigned" ? "sub" : "chinh"}
                        small
                        onClick={() => f.openTrip(row)}
                      >
                        {state === "pending"
                          ? "Phân công"
                          : state === "assigned"
                            ? "Xem"
                            : "Xử lý"}
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

      {/* chọn giờ và vị trí đón */}
      <Dialog
        open={t !== null}
        close={f.closeTrip}
        title={t ? routeName(f.routes, t.routeId) : ""}
        desc={
          t
            ? `${f.carrierOf.get(t.dossierId) ?? "-"} · ${t.plate} · giờ trên vé ${t.departAt} ngày ${formatDate(t.date)}`
            : undefined
        }
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeTrip}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-don-khach">
              {t?.boarding ? "Lưu giờ đón khách" : "Sắp xếp đón khách"}
            </Button>
          </>
        }
      >
        {t && (
          <form
            id="form-don-khach"
            onSubmit={f.submit}
            noValidate
            className="space-y-5"
          >
            {t.boarding?.request && (
              <Note tone="info" title="Nhà xe xin điều chỉnh giờ đón">
                <p>
                  Giờ đã gán:{" "}
                  <strong>
                    {f.bayOf.get(t.boarding.bayId)?.code} · {t.boarding.startAt}
                  </strong>
                  . Giờ nhà xe mong muốn:{" "}
                  <strong>{t.boarding.request.desiredStart}</strong>.
                </p>
                {t.boarding.request.note && (
                  <p className="mt-1">{t.boarding.request.note}</p>
                )}
                <p className="mt-1 text-xs opacity-80">
                  Có thể chọn đúng giờ mong muốn hoặc sắp giờ khác (trễ hơn) tuỳ
                  tình hình bến.
                </p>
              </Note>
            )}
            {t.boarding && !t.boarding.request && t.boarding.previousStart && (
              <Note tone="neutral">
                Giờ đón trước đó: {t.boarding.previousStart}.
              </Note>
            )}

            <Field
              label="Giờ bắt đầu đón khách"
              hint={`Mỗi xe đón khách ${BOARD_MINUTES} phút tại vị trí đã chọn.`}
              required
            >
              <O
                type="time"
                value={f.startAt}
                onChange={(e) => f.setStartAt(e.target.value)}
                className="sm:max-w-48"
              />
            </Field>

            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  Vị trí đón khách<span className="ml-0.5 text-danger">*</span>
                </p>
                {f.statuses.length > 0 && (
                  <p className="tnum text-xs text-muted">
                    Khung giờ này: {used}/{f.bays.length} vị trí đang dùng hoặc
                    tạm ngưng
                  </p>
                )}
              </div>
              <div
                role="radiogroup"
                aria-label="Vị trí đón khách"
                className="grid grid-cols-3 gap-2 sm:grid-cols-4"
              >
                {(f.statuses.length > 0
                  ? f.statuses
                  : f.bays.map((bay) => ({
                      bay,
                      state: "free" as const,
                      detail: "",
                    }))
                ).map((s) => (
                  <button
                    key={s.bay.id}
                    type="button"
                    role="radio"
                    aria-checked={f.bayId === s.bay.id}
                    onClick={() => f.setBayId(s.bay.id)}
                    className={cx(
                      "cham-duoc rounded-xl border px-2 py-1.5 text-left transition-colors",
                      CHIP[s.state],
                      f.bayId === s.bay.id && "ring-2 ring-brand",
                    )}
                  >
                    <span className="block text-sm font-bold">
                      {s.bay.code}
                    </span>
                    <span className="block truncate text-[11px] opacity-90">
                      {s.state === "free"
                        ? "Trống"
                        : s.state === "busy"
                          ? `Có xe ${s.detail}`
                          : "Tạm ngưng"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}

/** Giờ kết thúc cửa sổ đón khách tính từ giờ bắt đầu HH:MM */
function hmOfEnd(startAt: string): string {
  const [h, m] = startAt.split(":").map(Number);
  const total = h * 60 + m + BOARD_MINUTES;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}
