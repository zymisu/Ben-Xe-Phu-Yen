"use client";

/**
 * UC6 - Màn hình biên bản vi phạm: danh sách, lập và xem biên bản.
 */
import { FilterBar } from "@/components/FilterBar";
import { Icon } from "@/components/Icon";
import { Pager, usePaged } from "@/components/Pager";
import {
  Badge,
  Button,
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
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { VIOLATION_TYPES } from "@/types";
import { SHORT_TYPE, useViolations } from "./logic";

const TABS = [
  { key: "all", label: "Tất cả" },
  ...VIOLATION_TYPES.map((t) => ({ key: t as string, label: SHORT_TYPE[t] })),
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s: string): string {
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Violations() {
  const f = useViolations();
  const v = f.viewing;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  return (
    <>
      <PageHeader
        branch="Kiểm soát xe vào bến"
        title="Biên bản vi phạm"
        desc="Lập và tra cứu biên bản các trường hợp vi phạm nội quy bến xe tại bãi."
        phai={
          <Button variant="chinh" small onClick={f.openForm}>
            <Icon name="plus" className="size-4" />
            Lập biên bản vi phạm
          </Button>
        }
      />

      <FilterBar
        tabs={TABS}
        value={f.filter}
        counts={f.counts as Record<string, number>}
        onChange={f.setFilter}
        query={f.query}
        onQuery={f.setQuery}
        placeholder="Số biên bản, biển số, nhà xe, tài xế..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có biên bản nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Số biên bản</Th>
              <Th>Lỗi vi phạm</Th>
              <Th>Nhà xe</Th>
              <Th>Vị trí</Th>
              <Th>Người lập</Th>
              <Th className="text-right">Chi tiết</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Số biên bản" className="tnum text-muted">
                    <p className="font-semibold text-ink">{row.code}</p>
                    <p className="mt-0.5 text-xs">{showAt(row.occurredAt)}</p>
                  </Td>
                  <Td label="Lỗi vi phạm" clip={false}>
                    <Badge tone="danger">
                      {SHORT_TYPE[row.type] ?? row.type}
                    </Badge>
                  </Td>
                  <Td label="Nhà xe" className="text-muted">
                    <p className="font-semibold text-ink">
                      {f.carrierOf.get(row.dossierId) ?? "-"}
                    </p>
                    <p className="tnum mt-0.5 text-xs">
                      {row.plate}
                      {row.driverName && ` · ${row.driverName}`}
                    </p>
                  </Td>
                  <Td label="Vị trí" className="text-muted">
                    {row.location}
                  </Td>
                  <Td label="Người lập" className="text-muted">
                    {row.createdBy}
                  </Td>
                  <Td label="Chi tiết" className="lg:text-right" clip={false}>
                    <Button
                      variant="sub"
                      small
                      onClick={() => f.openView(row.id)}
                    >
                      Xem
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

      {/* nhập lỗi vi phạm */}
      <Dialog
        open={f.form !== null}
        close={f.closeForm}
        title="Lập biên bản vi phạm"
        desc="Nhập thông tin lỗi vi phạm tại bãi."
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-bien-ban">
              Lập biên bản
            </Button>
          </>
        }
      >
        {f.form && (
          <form
            id="form-bien-ban"
            onSubmit={f.submit}
            noValidate
            className="space-y-4"
          >
            <Field label="Lỗi vi phạm" required>
              <Select
                value={f.form.type}
                onChange={(e) => f.setField("type", e.target.value)}
                autoFocus
              >
                <option value="">Chọn lỗi vi phạm</option>
                {VIOLATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Nhà xe" required>
              <Select
                value={f.form.dossierId}
                onChange={(e) => f.setField("dossierId", e.target.value)}
              >
                <option value="">Chọn nhà xe</option>
                {f.approved.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.companyName}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Biển số xe" required>
                <Select
                  value={f.form.plate}
                  disabled={!f.dossier}
                  onChange={(e) => f.setField("plate", e.target.value)}
                >
                  <option value="">Chọn biển số</option>
                  {f.dossier?.vehicles.map((x) => (
                    <option key={x.id} value={x.plate}>
                      {x.plate}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tài xế" hint="Bỏ trống nếu chưa xác định.">
                <Select
                  value={f.form.driverName}
                  disabled={!f.dossier}
                  onChange={(e) => f.setField("driverName", e.target.value)}
                >
                  <option value="">Chưa xác định</option>
                  {f.dossier?.drivers.map((x) => (
                    <option key={x.id} value={x.name}>
                      {x.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Thời điểm vi phạm" required>
                <O
                  type="datetime-local"
                  value={f.form.occurredAt}
                  onChange={(e) => f.setField("occurredAt", e.target.value)}
                />
              </Field>
              <Field label="Vị trí" required>
                <Select
                  value={f.form.location}
                  onChange={(e) => f.setField("location", e.target.value)}
                >
                  <option value="">Chọn vị trí</option>
                  {f.locations.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Mô tả vi phạm" required>
              <Textarea
                rows={3}
                value={f.form.description}
                onChange={(e) => f.setField("description", e.target.value)}
                placeholder="Diễn biến, thời gian dừng, ghi nhận tại hiện trường..."
              />
            </Field>
          </form>
        )}
      </Dialog>

      {/* xem biên bản */}
      <Dialog
        open={v !== null}
        close={f.closeView}
        title={v ? `Biên bản ${v.code}` : ""}
        desc={
          v ? `Lập bởi ${v.createdBy} lúc ${showAt(v.createdAt)}` : undefined
        }
        footer={
          <Button variant="sub" onClick={f.closeView}>
            Đóng
          </Button>
        }
      >
        {v && (
          <dl className="space-y-3 text-sm">
            {[
              ["Lỗi vi phạm", v.type],
              ["Nhà xe", f.carrierOf.get(v.dossierId) ?? "-"],
              ["Biển số xe", v.plate],
              ["Tài xế", v.driverName ?? "Chưa xác định"],
              ["Thời điểm vi phạm", showAt(v.occurredAt)],
              ["Vị trí", v.location],
              ["Mô tả", v.description],
            ].map(([k, val]) => (
              <div
                key={k}
                className="flex flex-col gap-0.5 sm:flex-row sm:gap-4"
              >
                <dt className="shrink-0 text-xs text-muted sm:w-36 sm:pt-0.5">
                  {k}
                </dt>
                <dd className="font-medium break-words text-ink">{val}</dd>
              </div>
            ))}
          </dl>
        )}
      </Dialog>
    </>
  );
}
