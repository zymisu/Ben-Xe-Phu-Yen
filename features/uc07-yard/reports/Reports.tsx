"use client";

/**
 * UC7.2 - Màn hình nhà xe lập và theo dõi báo cáo gửi bến.
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
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { REPORT_STATUS_LABEL, reportStatus } from "@/types";
import { BODY_MAX, TITLE_MAX, useReports, type ReportFilter } from "./logic";

const TABS: { key: ReportFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: REPORT_STATUS_LABEL.unread },
  { key: "read", label: REPORT_STATUS_LABEL.read },
];

/** 2026-10-21T08:15 → 08:15 21/10/2026 */
function showAt(s?: string): string {
  if (!s) return "-";
  const [d, t] = s.split("T");
  return `${t} ${formatDate(d)}`;
}

export function Reports() {
  const f = useReports();
  const r = f.viewing;
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);

  if (!f.dossier) return null;

  return (
    <>
      <PageHeader
        branch="Điều phối xe tại bến"
        title="Báo cáo"
        desc="Gửi báo cáo về cơ sở vật chất, tường trình sự việc hoặc bất kỳ nội dung nào cho nhân viên điều độ trong nhà."
        phai={
          <Button variant="chinh" small onClick={f.openForm}>
            <Icon name="plus" className="size-4" />
            Lập báo cáo
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
        placeholder="Tiêu đề, nội dung, biển số..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Chưa có báo cáo nào"
            desc="Đổi bộ lọc hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Thời điểm gửi</Th>
              <Th>Tiêu đề</Th>
              <Th>Người nhận</Th>
              <Th>Xe liên quan</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Chi tiết</Th>
            </THead>
            <TBody>
              {paged.rows.map((row) => (
                <Tr key={row.id}>
                  <Td label="Thời điểm gửi" className="tnum text-muted">
                    {showAt(row.createdAt)}
                  </Td>
                  <Td label="Tiêu đề" className="font-semibold text-ink">
                    {row.title}
                  </Td>
                  <Td label="Người nhận" className="text-muted">
                    {row.recipientIds.map(f.nameOf).join(", ")}
                  </Td>
                  <Td label="Xe liên quan" className="tnum text-muted">
                    {row.plate ?? "-"}
                  </Td>
                  <Td label="Trạng thái" clip={false}>
                    <Badge
                      tone={reportStatus(row) === "read" ? "ok" : "warn"}
                      dot
                    >
                      {REPORT_STATUS_LABEL[reportStatus(row)]}
                    </Badge>
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

      {/* nhập nội dung */}
      <Dialog
        open={f.form !== null}
        close={f.closeForm}
        title="Lập báo cáo"
        desc="Chọn nhân viên điều độ trong nhà sẽ nhận báo cáo."
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-bao-cao">
              Gửi báo cáo
            </Button>
          </>
        }
      >
        {f.form && (
          <form
            id="form-bao-cao"
            onSubmit={f.submit}
            noValidate
            className="space-y-4"
          >
            <div>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  Người nhận<span className="ml-0.5 text-danger">*</span>
                  <span className="tnum ml-2 text-xs font-normal text-muted">
                    đã chọn {f.form.recipientIds.length}/{f.staff.length}
                  </span>
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => f.setAllRecipients(true)}
                    className="text-xs font-semibold text-brand hover:opacity-75"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => f.setAllRecipients(false)}
                    className="text-xs font-semibold text-muted hover:text-ink"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
              <div
                role="group"
                aria-label="Người nhận"
                className="grid gap-2 sm:grid-cols-2"
              >
                {f.staff.map((a) => {
                  const on = f.form?.recipientIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => f.toggleRecipient(a.id)}
                      className={cx(
                        "cham-duoc rounded-xl border px-3 py-2 text-left transition-colors",
                        on
                          ? "border-brand bg-brand-soft text-brand-soft-ink"
                          : "border-line bg-card text-ink hover:border-brand",
                      )}
                    >
                      <span className="block text-sm font-bold">
                        {a.fullName}
                      </span>
                      <span className="block text-[11px] opacity-80">
                        Nhân viên điều độ trong nhà
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Tiêu đề" required>
              <O
                value={f.form.title}
                maxLength={TITLE_MAX + 20}
                onChange={(e) => f.setField("title", e.target.value)}
                autoFocus
              />
            </Field>
            <Field label="Xe liên quan" hint="Không bắt buộc.">
              <Select
                value={f.form.plate}
                onChange={(e) => f.setField("plate", e.target.value)}
              >
                <option value="">Không có</option>
                {f.dossier?.vehicles.map((v) => (
                  <option key={v.id} value={v.plate}>
                    {v.plate}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Nội dung"
              required
              hint={`${f.form.body.trim().length}/${BODY_MAX} ký tự`}
            >
              <Textarea
                rows={7}
                value={f.form.body}
                onChange={(e) => f.setField("body", e.target.value)}
              />
            </Field>
          </form>
        )}
      </Dialog>

      {/* xem báo cáo */}
      <Dialog
        open={r !== null}
        close={f.closeView}
        title={r?.title ?? ""}
        desc={r ? `Gửi lúc ${showAt(r.createdAt)}` : undefined}
        size="lg"
        footer={
          <Button variant="sub" onClick={f.closeView}>
            Đóng
          </Button>
        }
      >
        {r && (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                Người nhận
              </p>
              <ul className="divide-y divide-line rounded-[14px] border border-line">
                {r.recipientIds.map((id) => {
                  const read = r.reads.find((x) => x.accountId === id);
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="font-medium text-ink">
                        {f.nameOf(id)}
                      </span>
                      {read ? (
                        <Badge tone="ok" dot>
                          Đã đọc lúc {showAt(read.at)}
                        </Badge>
                      ) : (
                        <Badge tone="warn" dot>
                          Chưa đọc
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            {r.plate && (
              <p className="text-sm text-muted">
                Xe liên quan:{" "}
                <strong className="tnum text-ink">{r.plate}</strong>
              </p>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink">
              {r.body}
            </p>
          </div>
        )}
      </Dialog>
    </>
  );
}
