"use client";

/**
 * UC5 - Màn hình nhân viên điều độ ngoài trời: tình hình, điều chỉnh, thêm và xóa vị trí đón khách.
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
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useBays, type AdjustFilter } from "./logic";

const TABS: { key: AdjustFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang hiệu lực" },
  { key: "ended", label: "Đã kết thúc" },
];

/** 2026-10-19T14:30 → 14:30 19/10/2026 */
function showDateTime(s?: string): string {
  if (!s) return "chưa rõ";
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Bays() {
  const f = useBays();
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Cập nhật vị trí đón khách"
        title="Vị trí đón khách"
        desc="Cập nhật tình trạng thực tế của từng vị trí để nhân viên điều độ trong nhà xếp xe đúng với thực tế ngoài sân."
        phai={
          <>
            <Button variant="sub" small onClick={f.openAdd}>
              <Icon name="plus" className="size-4" />
              Thêm ô
            </Button>
            <Button variant="chinh" small onClick={() => f.openForm()}>
              <Icon name="pin" className="size-4" />
              Cập nhật vị trí
            </Button>
          </>
        }
      />

      {/* tình hình hiện tại */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {f.tiles.map(({ bay, blocked, delay, occupant }) => {
          const n = f.usage[bay.id] ?? 0;
          return (
            <div key={bay.id} className="relative">
              <button
                onClick={() => f.openForm(bay.id)}
                className={cx(
                  "cham-duoc w-full rounded-[14px] border px-3 py-2.5 pr-9 text-left transition-colors",
                  blocked
                    ? "border-danger/40 bg-danger-soft text-danger"
                    : occupant
                      ? "border-warn/40 bg-warn-soft text-warn"
                      : "border-line bg-card text-ink hover:border-brand",
                )}
              >
                <span className="block text-sm font-bold">{bay.code}</span>
                <span className="block truncate text-[11px] opacity-90">
                  {blocked
                    ? "Tạm ngưng"
                    : occupant
                      ? `Đang đón ${occupant.plate}`
                      : "Trống"}
                  {delay > 0 && ` · lệch +${delay}'`}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Xóa ${bay.code}`}
                title={
                  n > 0
                    ? `${bay.code} đang có ${n} chuyến được gán, không thể xóa`
                    : `Xóa ${bay.code}`
                }
                disabled={n > 0}
                onClick={() => f.setRemoving(bay.id)}
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-danger disabled:pointer-events-none disabled:opacity-30"
              >
                <Icon name="trash" className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <FilterBar
          tabs={TABS}
          value={f.filter}
          counts={f.counts}
          onChange={f.setFilter}
          query={f.query}
          onQuery={f.setQuery}
          placeholder="Vị trí, lý do, người cập nhật..."
        />
      </div>

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có điều chỉnh nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Vị trí</Th>
              <Th>Điều chỉnh</Th>
              <Th>Hiệu lực</Th>
              <Th>Lý do</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Xử lý</Th>
            </THead>
            <TBody>
              {paged.rows.map((a) => {
                const state = f.stateOf(a);
                return (
                  <Tr key={a.id}>
                    <Td label="Vị trí" className="font-semibold text-ink">
                      {f.bayOf.get(a.bayId)?.code}
                    </Td>
                    <Td label="Điều chỉnh" className="text-muted">
                      {a.kind === "unavailable"
                        ? "Tạm ngưng"
                        : `Lệch trễ ${a.minutes} phút`}
                      <p className="mt-0.5 text-xs">{a.byName}</p>
                    </Td>
                    <Td label="Hiệu lực" className="tnum text-muted">
                      <p>{showDateTime(a.from)}</p>
                      <p className="mt-0.5 text-xs">
                        đến {showDateTime(a.endedAt ?? a.until)}
                      </p>
                    </Td>
                    <Td label="Lý do" className="text-muted">
                      {a.reason}
                    </Td>
                    <Td label="Trạng thái" clip={false}>
                      <Badge tone={state === "active" ? "warn" : "neutral"} dot>
                        {state === "active" ? "Đang hiệu lực" : "Đã kết thúc"}
                      </Badge>
                    </Td>
                    <Td label="Xử lý" className="lg:text-right" clip={false}>
                      {state === "active" ? (
                        <Button variant="sub" small onClick={() => f.end(a.id)}>
                          Kết thúc
                        </Button>
                      ) : (
                        "-"
                      )}
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
        open={f.form !== null}
        close={f.closeForm}
        title="Cập nhật vị trí đón khách"
        desc="Báo tình trạng thực tế ngoài sân để hệ thống xếp xe đúng."
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-vi-tri">
              Lưu cập nhật
            </Button>
          </>
        }
      >
        {f.form && (
          <form
            id="form-vi-tri"
            onSubmit={f.submit}
            noValidate
            className="space-y-4"
          >
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  Vị trí<span className="ml-0.5 text-danger">*</span>
                  <span className="tnum ml-2 text-xs font-normal text-muted">
                    đã chọn {f.form.bayIds.length}/{f.bays.length}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => f.setAllBays(true)}
                    className="text-xs font-semibold text-brand hover:opacity-75"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => f.setAllBays(false)}
                    className="text-xs font-semibold text-muted hover:text-ink"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
              <div
                role="group"
                aria-label="Chọn vị trí"
                className="grid grid-cols-4 gap-2 sm:grid-cols-6"
              >
                {f.bays.map((b) => {
                  const on = f.form?.bayIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => f.toggleBay(b.id)}
                      className={cx(
                        "cham-duoc rounded-xl border px-2 py-1.5 text-sm font-bold transition-colors",
                        on
                          ? "border-brand bg-brand-soft text-brand-soft-ink"
                          : "border-line bg-card text-ink hover:border-brand",
                      )}
                    >
                      {b.code}
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label="Loại điều chỉnh"
              className="grid grid-cols-2 gap-2"
            >
              {(
                [
                  [
                    "unavailable",
                    "Tạm ngưng",
                    "Xe hỏng, rào chắn, chưa dời đi",
                  ],
                  ["delay", "Lệch giờ", "Các khung giờ sau bị dời trễ"],
                ] as const
              ).map(([k, label, hint]) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={f.form?.kind === k}
                  onClick={() => f.setField("kind", k)}
                  className={cx(
                    "cham-duoc rounded-xl border px-3 py-2 text-left transition-colors",
                    f.form?.kind === k
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-card",
                  )}
                >
                  <span className="block text-sm font-bold text-ink">
                    {label}
                  </span>
                  <span className="block text-[11px] text-muted">{hint}</span>
                </button>
              ))}
            </div>

            {f.form.kind === "delay" && (
              <Field label="Số phút lệch trễ" required>
                <O
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  value={f.form.minutes}
                  onChange={(e) => f.setField("minutes", e.target.value)}
                  className="sm:max-w-40"
                />
              </Field>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Từ lúc" required>
                <O
                  type="datetime-local"
                  value={f.form.from}
                  onChange={(e) => f.setField("from", e.target.value)}
                />
              </Field>
              <Field label="Đến lúc" hint="Bỏ trống nếu chưa rõ.">
                <O
                  type="datetime-local"
                  value={f.form.until}
                  onChange={(e) => f.setField("until", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Lý do" required>
              <Textarea
                rows={2}
                value={f.form.reason}
                onChange={(e) => f.setField("reason", e.target.value)}
                placeholder="Ví dụ: xe hư chờ cẩu, xe trước ra bến chậm"
              />
            </Field>
          </form>
        )}
      </Dialog>
      {/* thêm ô */}
      <Dialog
        open={f.newCode !== null}
        close={f.closeAdd}
        title="Thêm ô đón khách"
        size="sm"
        notice={
          f.codeError ? <Note tone="danger">{f.codeError}</Note> : undefined
        }
        footer={
          <>
            <Button variant="nhe" onClick={f.closeAdd}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-them-o">
              Thêm ô
            </Button>
          </>
        }
      >
        <form id="form-them-o" onSubmit={f.submitAdd} noValidate>
          <Field label="Mã ô" required>
            <O
              value={f.newCode ?? ""}
              onChange={(e) => f.setNewCode(e.target.value)}
              autoFocus
            />
          </Field>
        </form>
      </Dialog>

      {/* xóa ô */}
      <Dialog
        open={f.removing !== null}
        close={() => f.setRemoving(null)}
        title={`Xóa ${f.bayOf.get(f.removing ?? "")?.code ?? "ô"}?`}
        desc="Ô chưa có chuyến nào được gán. Các điều chỉnh của ô này cũng bị xóa theo."
        size="sm"
        footer={
          <>
            <Button variant="nhe" onClick={() => f.setRemoving(null)}>
              Không xóa
            </Button>
            <Button variant="nguy" onClick={f.confirmRemove}>
              Xác nhận xóa
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Chỉ xóa được ô khi không có chuyến nào đang hoặc từng được gán vào ô.
        </p>
      </Dialog>
    </>
  );
}
