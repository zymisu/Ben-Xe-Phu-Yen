"use client";

/**
 * UC10 - Màn hình quản lý tài khoản nhân viên: danh sách, tạo, cập nhật, xóa.
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
import { ROLE_LABEL } from "@/types";
import { useAccounts, type AccountFilter } from "./logic";
import { STAFF_ROLES } from "./rules";

const TABS: { key: AccountFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  ...STAFF_ROLES.map((r) => ({
    key: r as AccountFilter,
    label: ROLE_LABEL[r],
  })),
];

export function Accounts() {
  const f = useAccounts();
  const paged = usePaged(f.list, `${f.filter}|${f.query}`);
  const update = f.form?.mode === "update";

  return (
    <>
      <PageHeader
        branch="Quản lý tài khoản"
        title="Tài khoản nhân viên"
        desc="Tạo, cập nhật và xóa tài khoản nhân viên bến xe. Tài khoản bị tác động nhận được thông báo ngay."
        phai={
          <Button variant="chinh" small onClick={f.openCreate}>
            <Icon name="plus" className="size-4" />
            Tạo tài khoản
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
        placeholder="Họ tên, số điện thoại, mã, vai trò..."
      />

      <div className="mt-4">
        {f.list.length === 0 ? (
          <Empty
            title="Không có tài khoản nào"
            desc="Đổi bộ lọc vai trò hoặc bỏ từ khoá tìm kiếm."
          />
        ) : (
          <Table>
            <THead>
              <Th>Mã</Th>
              <Th>Họ tên</Th>
              <Th>Vai trò</Th>
              <Th>Thư điện tử</Th>
              <Th>Ngày tạo</Th>
              <Th className="text-right">Thao tác</Th>
            </THead>
            <TBody>
              {paged.rows.map((a) => (
                <Tr key={a.id}>
                  <Td label="Mã" className="tnum font-semibold text-ink">
                    {a.code}
                  </Td>
                  <Td label="Họ tên" className="text-muted">
                    <p className="font-semibold text-ink">{a.fullName}</p>
                    <p className="tnum mt-0.5 text-xs">{a.phone}</p>
                  </Td>
                  <Td label="Vai trò" clip={false}>
                    <Badge tone="info">{ROLE_LABEL[a.role]}</Badge>
                  </Td>
                  <Td label="Thư điện tử" className="text-muted">
                    {a.email || "-"}
                  </Td>
                  <Td label="Ngày tạo" className="tnum text-muted">
                    {f.describe(a)}
                  </Td>
                  <Td label="Thao tác" className="lg:text-right" clip={false}>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        variant="sub"
                        small
                        onClick={() => f.openUpdate(a)}
                      >
                        Cập nhật
                      </Button>
                      <Button
                        variant="sub"
                        small
                        onClick={() => f.askRemove(a.id)}
                      >
                        <Icon name="trash" className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
        <Pager {...paged} />
      </div>

      {/* tạo hoặc cập nhật: nhập thông tin */}
      <Dialog
        open={f.form !== null}
        close={f.closeForm}
        title={update ? "Cập nhật tài khoản" : "Tạo tài khoản nhân viên"}
        desc={
          update
            ? "Sửa được mọi thông tin trừ mật khẩu."
            : "Nhập thông tin tài khoản mới."
        }
        size="lg"
        notice={f.error ? <Note tone="danger">{f.error}</Note> : undefined}
        footer={
          <>
            <Button variant="nhe" onClick={f.closeForm}>
              Huỷ
            </Button>
            <Button variant="chinh" type="submit" form="form-tai-khoan">
              {update ? "Lưu cập nhật" : "Tạo tài khoản"}
            </Button>
          </>
        }
      >
        {f.form && (
          <form
            id="form-tai-khoan"
            onSubmit={f.submit}
            noValidate
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên" required>
                <O
                  value={f.form.values.fullName}
                  onChange={(e) => f.setField("fullName", e.target.value)}
                  autoFocus
                />
              </Field>
              <Field label="Số điện thoại (tên đăng nhập)" required>
                <O
                  type="tel"
                  inputMode="tel"
                  value={f.form.values.phone}
                  onChange={(e) => f.setField("phone", e.target.value)}
                  placeholder="0905 123 456"
                />
              </Field>
              <Field label="Vai trò" required>
                <Select
                  value={f.form.values.role}
                  onChange={(e) =>
                    f.setField(
                      "role",
                      e.target.value as (typeof STAFF_ROLES)[number],
                    )
                  }
                >
                  <option value="">Chọn vai trò</option>
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mã nhân viên" required>
                <O
                  value={f.form.values.code}
                  onChange={(e) => f.setField("code", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Thư điện tử" hint="Không bắt buộc.">
              <O
                type="email"
                inputMode="email"
                value={f.form.values.email}
                onChange={(e) => f.setField("email", e.target.value)}
              />
            </Field>
            <Field label="Địa chỉ liên hệ" hint="Không bắt buộc.">
              <Textarea
                rows={2}
                value={f.form.values.address}
                onChange={(e) => f.setField("address", e.target.value)}
              />
            </Field>
            {update ? (
              <Note tone="neutral">
                Mật khẩu không hiển thị và không đổi được tại đây.
              </Note>
            ) : (
              <Field
                label="Mật khẩu ban đầu"
                required
                hint="Tối thiểu 6 ký tự."
              >
                <O
                  type="password"
                  autoComplete="new-password"
                  value={f.form.values.password}
                  onChange={(e) => f.setField("password", e.target.value)}
                />
              </Field>
            )}
          </form>
        )}
      </Dialog>

      {/* xóa: kiểm tra liên kết */}
      <Dialog
        open={f.removing !== null}
        close={f.cancelRemove}
        title={
          f.links.length > 0
            ? "Không thể xóa tài khoản"
            : `Xóa tài khoản ${f.removing?.fullName ?? ""}?`
        }
        desc={
          f.removing ? `${f.removing.code} · ${f.removing.phone}` : undefined
        }
        size="sm"
        footer={
          f.links.length > 0 ? (
            <Button variant="sub" onClick={f.cancelRemove}>
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="nhe" onClick={f.cancelRemove}>
                Không xóa
              </Button>
              <Button variant="nguy" onClick={f.confirmRemove}>
                Xác nhận xóa
              </Button>
            </>
          )
        }
      >
        {f.links.length > 0 ? (
          <div className="space-y-3">
            <Note tone="danger">
              Tài khoản đã liên kết với các hạng mục sau nên không được xóa.
            </Note>
            <ul className="divide-y divide-line text-sm">
              {f.links.map((l) => (
                <li key={l.label} className="flex justify-between gap-3 py-2">
                  <span className="text-ink">{l.label}</span>
                  <span className="tnum font-semibold text-ink">{l.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Tài khoản chưa liên kết với hạng mục nào. Người này sẽ nhận được
            thông báo xóa tài khoản qua số điện thoại.
          </p>
        )}
      </Dialog>
    </>
  );
}
