"use client";

/**
 * UC9.1 - Thông tin cá nhân: xem và chỉnh sửa thông tin liên hệ.
 */
import { Icon } from "@/components/Icon";
import {
  Button,
  CardTitle,
  Field,
  Note,
  O,
  PageHeader,
  Textarea,
  The,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/types";
import { ADDRESS_MAX, useEditProfile } from "./logic";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line py-3 last:border-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-xs text-muted sm:w-48 sm:pt-0.5">{label}</dt>
      <dd className="text-sm font-medium break-words text-ink">
        {value || <span className="font-normal text-muted">Chưa cập nhật</span>}
      </dd>
    </div>
  );
}

export function EditProfile() {
  const f = useEditProfile();
  const u = f.user;
  if (!u) return null;
  const carrier = u.role === "carrier";

  return (
    <>
      <PageHeader
        branch="Quản lý thông tin cá nhân"
        title="Thông tin cá nhân"
        desc="Các thông tin đã được bến xe phê duyệt không thể thay đổi tại đây."
      />

      <The>
        <CardTitle desc="Đã được phê duyệt, chỉ xem.">
          Thông tin tài khoản
        </CardTitle>
        <dl>
          <Row label="Họ và tên" value={u.fullName} />
          <Row label="Số điện thoại (tên đăng nhập)" value={u.phone} />
          <Row label="Vai trò" value={ROLE_LABEL[u.role]} />
          <Row label={carrier ? "Mã hồ sơ" : "Mã nhân viên"} value={u.code} />
          <Row label="Ngày tạo tài khoản" value={formatDate(u.createdAt)} />
          {carrier && f.dossier && (
            <>
              <Row label="Tên đơn vị vận tải" value={f.dossier.companyName} />
              <Row label="Mã số thuế" value={f.dossier.taxCode} />
            </>
          )}
        </dl>
        {carrier && (
          <p className="mt-3 text-xs text-muted">
            Thông tin đơn vị vận tải thay đổi bằng yêu cầu cập nhật hồ sơ tại
            trang Hồ sơ đơn vị.
          </p>
        )}
      </The>

      <The className="mt-4">
        <CardTitle
          desc="Bạn có thể tự chỉnh sửa."
          phai={
            !f.form && (
              <Button variant="sub" small onClick={f.begin}>
                <Icon name="file" className="size-4" />
                Chỉnh sửa
              </Button>
            )
          }
        >
          Thông tin liên hệ
        </CardTitle>

        {f.form ? (
          <form onSubmit={f.submit} noValidate className="space-y-4">
            <Field label="Thư điện tử" hint="Không bắt buộc.">
              <O
                type="email"
                inputMode="email"
                value={f.form.email}
                onChange={(e) => f.setField("email", e.target.value)}
                placeholder="ten@example.vn"
                autoFocus
              />
            </Field>
            <Field
              label="Địa chỉ liên hệ"
              hint={`${f.form.address.trim().length}/${ADDRESS_MAX} ký tự`}
            >
              <Textarea
                rows={2}
                value={f.form.address}
                onChange={(e) => f.setField("address", e.target.value)}
              />
            </Field>
            {f.error && <Note tone="danger">{f.error}</Note>}
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="nhe" onClick={f.cancel}>
                Huỷ
              </Button>
              <Button type="submit" variant="chinh">
                Lưu thay đổi
              </Button>
            </div>
          </form>
        ) : (
          <dl>
            <Row label="Thư điện tử" value={u.email} />
            <Row label="Địa chỉ liên hệ" value={u.address} />
          </dl>
        )}
      </The>
    </>
  );
}
