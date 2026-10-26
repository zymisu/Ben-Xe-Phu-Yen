"use client";

/**
 * UC8.1 - Màn hình kiểm tra xe xuất bến: danh sách chuyến, phiếu kiểm tra và cấp lệnh.
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
import { formatDate } from "@/lib/format";
import type { Inspection, Tone } from "@/types";
import { routeName } from "../uc04-trips/trip";
import { useInspections, type InspectionFilter } from "./logic";
import {
  cargoLimit,
  GROUPS,
  inspectionState,
  lastInspection,
  MANUAL_ITEMS,
  minutesLeft,
  STATE_LABEL,
  type InspectionState,
} from "./rules";

const TABS: { key: InspectionFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: STATE_LABEL.pending },
  { key: "failed", label: STATE_LABEL.failed },
  { key: "passed", label: STATE_LABEL.passed },
];

const TONE: Record<InspectionState, Tone> = {
  pending: "warn",
  failed: "danger",
  passed: "ok",
};

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s: string): string {
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

function countdown(min: number): string {
  if (min > 0) return `còn ${min} phút`;
  if (min === 0) return "đúng giờ";
  return `trễ ${-min} phút`;
}

/** Kết quả một lần kiểm tra, chỉ đọc */
function Result({ ins }: { ins: Inspection }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Kiểm tra lúc {showAt(ins.at)} · {ins.byName} · {ins.passengers} hành
        khách · {ins.cargoKg} kg hàng
      </p>
      {GROUPS.map((g) => {
        const rows = ins.items.filter((i) => i.group === g);
        if (rows.length === 0) return null;
        return (
          <section key={g}>
            <h3 className="text-xs font-bold tracking-wide text-muted uppercase">
              {g}
            </h3>
            <ul className="mt-2 divide-y divide-line">
              {rows.map((i) => (
                <li key={i.key} className="flex items-start gap-3 py-2">
                  <Icon
                    name={i.ok ? "check" : "close"}
                    className={cx(
                      "mt-0.5 size-4 shrink-0",
                      i.ok ? "text-ok" : "text-danger",
                    )}
                  />
                  <span className="min-w-0 text-sm">
                    <span className="font-medium text-ink">{i.label}</span>
                    {i.reason && (
                      <span className="block text-xs text-danger">
                        {i.reason}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function Inspections() {
  const f = useInspections();
  const t = f.current;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);
  const state = t ? inspectionState(t, f.now) : null;
  const last = t ? lastInspection(t) : null;

  return (
    <>
      <PageHeader
        branch="Quản lý xe rời bến"
        title="Kiểm tra xuất bến"
        desc="Kiểm tra an toàn xe, người lái, hành khách và hàng hóa cho các chuyến sắp xuất bến (trong vòng 30 phút tới), cấp lệnh xuất bến khi đạt."
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
            title="Chưa có chuyến nào cần kiểm tra"
            desc="Chuyến hiện ở đây khi xe đã vào bến và giờ xuất bến còn trong vòng 30 phút."
          />
        ) : (
          <Table>
            <THead>
              <Th>Giờ xuất bến</Th>
              <Th>Nhà xe</Th>
              <Th>Tuyến đường</Th>
              <Th>Tài xế</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Kiểm tra</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => {
                const s = inspectionState(row, f.now)!;
                return (
                  <Tr key={row.id}>
                    <Td label="Giờ xuất bến" className="tnum text-muted">
                      <p className="font-semibold text-ink">{row.departAt}</p>
                      <p className="mt-0.5 text-xs">
                        {row.departureOrder
                          ? row.departureOrder.code
                          : countdown(minutesLeft(row, f.now))}
                      </p>
                    </Td>
                    <Td label="Nhà xe" className="font-semibold text-ink">
                      {f.carrierOf.get(row.dossierId) ?? "-"}
                    </Td>
                    <Td label="Tuyến đường" className="text-muted">
                      <p>{routeName(f.routes, row.routeId)}</p>
                      <p className="tnum mt-0.5 text-xs">{row.plate}</p>
                    </Td>
                    <Td label="Tài xế" className="text-muted">
                      {row.driverName}
                    </Td>
                    <Td label="Trạng thái" clip={false}>
                      <Badge tone={TONE[s]} dot>
                        {STATE_LABEL[s]}
                      </Badge>
                    </Td>
                    <Td label="Kiểm tra" className="lg:text-right" clip={false}>
                      <Button
                        variant={s === "passed" ? "sub" : "chinh"}
                        small
                        onClick={() => f.openTrip(row)}
                      >
                        {s === "pending"
                          ? "Kiểm tra"
                          : s === "failed"
                            ? "Kiểm tra lại"
                            : "Xem"}
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

      {/* phiếu kiểm tra */}
      <Dialog
        open={t !== null}
        close={f.close}
        title={t ? `Phiếu kiểm tra - ${t.plate}` : ""}
        desc={
          t
            ? `${routeName(f.routes, t.routeId)} · xuất bến ${t.departAt} · ${t.driverName}`
            : undefined
        }
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          state === "passed" ? (
            <Button variant="sub" onClick={f.close}>
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="nhe" onClick={f.close}>
                Huỷ
              </Button>
              <Button variant="chinh" type="submit" form="form-kiem-tra">
                Yêu cầu phê duyệt
              </Button>
            </>
          )
        }
      >
        {t && state === "passed" && last && (
          <div className="space-y-4">
            <Note
              tone="ok"
              title={`Đã cấp lệnh xuất bến ${t.departureOrder?.code}`}
            >
              {t.departureOrder &&
                `${showAt(t.departureOrder.issuedAt)} · ${t.departureOrder.issuedBy}`}
            </Note>
            <Result ins={last} />
          </div>
        )}

        {t && state !== "passed" && (
          <form
            id="form-kiem-tra"
            onSubmit={f.submit}
            noValidate
            className="space-y-6"
          >
            {state === "failed" && last && (
              <Note tone="danger" title="Lần kiểm tra trước không đạt">
                {last.items
                  .filter((i) => !i.ok)
                  .map((i) => `${i.label}${i.reason ? ` (${i.reason})` : ""}`)
                  .join("; ")}
              </Note>
            )}

            {GROUPS.map((g) => {
              const manual = MANUAL_ITEMS.filter((m) => m.group === g);
              const auto = f.auto.filter((a) => a.group === g);
              return (
                <section key={g}>
                  <h3 className="text-xs font-bold tracking-wide text-muted uppercase">
                    {g}
                  </h3>
                  <ul className="mt-2 divide-y divide-line">
                    {auto.map((a) => (
                      <li key={a.key} className="flex items-start gap-3 py-2.5">
                        <Icon
                          name={a.ok ? "check" : "close"}
                          className={cx(
                            "mt-0.5 size-4 shrink-0",
                            a.ok ? "text-ok" : "text-danger",
                          )}
                        />
                        <span className="text-sm">
                          <span className="font-medium text-ink">
                            {a.label}
                          </span>
                          <span className="block text-xs text-muted">
                            {a.ok ? "Hệ thống đã đối chiếu: đạt" : a.reason}
                          </span>
                        </span>
                      </li>
                    ))}
                    {manual.map((m) => {
                      const input = f.form.items[m.key];
                      return (
                        <li key={m.key} className="py-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-medium text-ink">
                              {m.label}
                            </span>
                            <div
                              role="radiogroup"
                              aria-label={m.label}
                              className="flex gap-1.5"
                            >
                              {(
                                [
                                  [true, "Đạt"],
                                  [false, "Không đạt"],
                                ] as const
                              ).map(([val, label]) => (
                                <button
                                  key={label}
                                  type="button"
                                  role="radio"
                                  aria-checked={input.ok === val}
                                  onClick={() => f.setItem(m.key, { ok: val })}
                                  className={cx(
                                    "cham-duoc rounded-lg border px-3 text-xs font-bold transition-colors",
                                    input.ok === val
                                      ? val
                                        ? "border-ok bg-ok text-white"
                                        : "border-danger bg-danger text-white"
                                      : "border-line bg-card text-muted hover:text-ink",
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          {input.ok === false && (
                            <O
                              className="mt-2"
                              placeholder="Lý do không đạt"
                              value={input.reason}
                              onChange={(e) =>
                                f.setItem(m.key, { reason: e.target.value })
                              }
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {g === "Hành khách" && (
                    <div className="mt-3">
                      <Field
                        label="Số hành khách thực tế"
                        required
                        hint={`Tối đa ${t.seats} (số ghế của xe).`}
                      >
                        <O
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={f.form.passengers}
                          onChange={(e) =>
                            f.setField("passengers", e.target.value)
                          }
                          className="sm:max-w-48"
                        />
                      </Field>
                    </div>
                  )}
                  {g === "Hàng hóa, hành lý" && (
                    <div className="mt-3">
                      <Field
                        label="Khối lượng hàng và hành lý (kg)"
                        required
                        hint={`Tối đa ${cargoLimit(t.seats)} kg.`}
                      >
                        <O
                          type="number"
                          inputMode="decimal"
                          min={0}
                          value={f.form.cargoKg}
                          onChange={(e) =>
                            f.setField("cargoKg", e.target.value)
                          }
                          className="sm:max-w-48"
                        />
                      </Field>
                    </div>
                  )}
                </section>
              );
            })}
          </form>
        )}
      </Dialog>
    </>
  );
}
