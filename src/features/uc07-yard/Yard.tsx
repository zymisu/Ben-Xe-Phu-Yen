"use client";

/**
 * UC7.1 - Màn hình sổ xe vào/ra bãi của nhà xe.
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
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { YARD_KIND_LABEL } from "@/types";
import { latestOf, useYard, type YardFilter } from "./logic";

const TABS: { key: YardFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "in", label: "Vào bãi" },
  { key: "out", label: "Ra bãi" },
  { key: "inside", label: "Đang ở bãi" },
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s: string): string {
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Yard() {
  const f = useYard();
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);
  const d = f.dossier;

  if (!d) return null;

  return (
    <>
      <PageHeader
        branch="Điều phối xe tại bến"
        title="Vào/ra bãi"
        desc="Ghi lại giờ xe của nhà xe vào và ra bãi. Nhà xe tự điều phối chỗ đậu, không cần đăng ký trước."
        phai={
          <Button variant="chinh" small onClick={() => f.openForm()}>
            <Icon name="plus" className="size-4" />
            Ghi nhận xe vào/ra
          </Button>
        }
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Biển số, tài xế..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có bản ghi nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Thời gian</Th>
              <Th>Loại</Th>
              <Th>Biển số</Th>
              <Th>Tài xế</Th>
              <Th>Tình trạng xe</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Thời gian" className="tnum font-semibold text-ink">
                    {showAt(row.at)}
                  </Td>
                  <Td label="Loại" clip={false}>
                    <Badge tone={row.kind === "in" ? "info" : "neutral"} dot>
                      {YARD_KIND_LABEL[row.kind]}
                    </Badge>
                  </Td>
                  <Td label="Biển số" className="tnum text-ink">
                    {row.plate}
                  </Td>
                  <Td label="Tài xế" className="text-muted">
                    {row.driverName}
                  </Td>
                  <Td label="Tình trạng xe" clip={false}>
                    {f.insideIds.has(row.id) ? (
                      <Badge tone="ok" dot>
                        Đang ở bãi
                      </Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pager {...paged} />
      </div>

      {/* nhập thông tin */}
      <Dialog
        open={f.form !== null}
        close={f.closeForm}
        title="Ghi nhận xe vào/ra bãi"
        desc="Chỉ ghi lại thời gian, không cần đăng ký trước."
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-vao-ra">
              Ghi nhận
            </Button>
          </>
        }
      >
        {f.form && (
          <form
            id="form-vao-ra"
            onSubmit={f.submit}
            noValidate
            className="space-y-4"
          >
            <div
              role="radiogroup"
              aria-label="Loại ghi nhận"
              className="grid grid-cols-2 gap-2"
            >
              {(["in", "out"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={f.form?.kind === k}
                  onClick={() => f.setField("kind", k)}
                  className={cx(
                    "cham-duoc rounded-xl border px-3 py-2 text-sm font-bold transition-colors",
                    f.form?.kind === k
                      ? "border-brand bg-brand-soft text-brand-soft-ink"
                      : "border-line bg-card text-ink",
                  )}
                >
                  {YARD_KIND_LABEL[k]}
                </button>
              ))}
            </div>

            <Field label="Xe" required>
              <Select
                value={f.form.vehicleId}
                onChange={(e) => f.setField("vehicleId", e.target.value)}
              >
                <option value="">Chọn xe</option>
                {d.vehicles.map((v) => {
                  const last = latestOf(f.mine, v.id);
                  return (
                    <option key={v.id} value={v.id}>
                      {v.plate}
                      {last?.kind === "in" ? " · đang ở bãi" : ""}
                    </option>
                  );
                })}
              </Select>
            </Field>

            <Field
              label={
                f.form.kind === "in" ? "Tài xế lái xe vào" : "Tài xế lái xe ra"
              }
              required
            >
              <Select
                value={f.form.driverId}
                onChange={(e) => f.setField("driverId", e.target.value)}
              >
                <option value="">Chọn tài xế</option>
                {d.drivers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {x.phone}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={f.form.kind === "in" ? "Giờ vào" : "Giờ ra"} required>
              <O
                type="datetime-local"
                value={f.form.at}
                onChange={(e) => f.setField("at", e.target.value)}
              />
            </Field>
          </form>
        )}
      </Dialog>
    </>
  );
}
