"use client";

/**
 * UC3 - Biểu mẫu hồ sơ đơn vị, dùng cho đăng ký và yêu cầu cập nhật.
 */
import { Icon } from "@/components/Icon";
import { Badge, Button, Field, O, Select, Textarea } from "@/components/ui";
import { PROVINCES } from "@/lib/provinces";
import { SERVICE_TYPES } from "@/types";
import {
  emptyDriver,
  emptyVehicle,
  type Profile,
  type VehicleForm,
} from "./profile";

/** Biểu mẫu hồ sơ đơn vị, dùng cho đăng ký tài khoản và yêu cầu cập nhật */
export function ProfileForm({
  profile,
  setField,
  autoFocus = false,
  inUse,
}: {
  profile: Profile;
  setField: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  autoFocus?: boolean;
  /** Số chuyến chưa khởi hành đang dùng từng xe, tài xế: các dòng này không xóa được */
  inUse?: { vehicles: Record<string, number>; drivers: Record<string, number> };
}) {
  return (
    <div className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Thông tin đơn vị
        </legend>
        <Field label="Tên đơn vị vận tải" required>
          <O
            value={profile.companyName}
            onChange={(e) => setField("companyName", e.target.value)}
            placeholder="Công ty TNHH Vận tải…"
            autoFocus={autoFocus}
            required
          />
        </Field>
        <Field label="Mã số thuế" required>
          <O
            inputMode="numeric"
            value={profile.taxCode}
            onChange={(e) => setField("taxCode", e.target.value)}
            placeholder="4400123456"
            required
          />
        </Field>
        <Field label="Địa chỉ trụ sở" required>
          <Textarea
            rows={2}
            value={profile.address}
            onChange={(e) => setField("address", e.target.value)}
            placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Người đại diện pháp luật" required>
            <O
              value={profile.representative}
              onChange={(e) => setField("representative", e.target.value)}
              required
            />
          </Field>
          <Field label="Chức vụ">
            <O
              value={profile.position}
              onChange={(e) => setField("position", e.target.value)}
              placeholder="Giám đốc"
            />
          </Field>
        </div>
        <Field label="Thư điện tử" hint="Không bắt buộc.">
          <O
            type="email"
            inputMode="email"
            value={profile.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="lienhe@donvivantai.vn"
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Giấy tờ pháp lý
        </legend>
        <Field label="Số Giấy chứng nhận đăng ký doanh nghiệp" required>
          <O
            value={profile.bizNo}
            onChange={(e) => setField("bizNo", e.target.value)}
            required
          />
        </Field>
        <Field label="Ngày cấp Giấy chứng nhận" required>
          <O
            type="date"
            value={profile.bizDate}
            onChange={(e) => setField("bizDate", e.target.value)}
            required
          />
        </Field>
        <Field label="Số Giấy phép kinh doanh vận tải bằng xe ô tô" required>
          <O
            value={profile.transportNo}
            onChange={(e) => setField("transportNo", e.target.value)}
            placeholder="000/GPKDVT-SGTVT"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày cấp Giấy phép" required>
            <O
              type="date"
              value={profile.transportDate}
              onChange={(e) => setField("transportDate", e.target.value)}
              required
            />
          </Field>
          <Field label="Nơi cấp" required>
            <O
              value={profile.transportIssuer}
              onChange={(e) => setField("transportIssuer", e.target.value)}
              required
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Nội dung đề nghị
        </legend>
        <Field label="Loại hình kinh doanh" required>
          <Select
            value={profile.serviceType}
            onChange={(e) => setField("serviceType", e.target.value)}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tuyến đề nghị - nơi đi" required>
            <Select
              value={profile.routeFrom}
              onChange={(e) => setField("routeFrom", e.target.value)}
              required
            >
              <option value="">Chọn tỉnh, thành phố</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tuyến đề nghị - nơi đến" required>
            <Select
              value={profile.routeTo}
              onChange={(e) => setField("routeTo", e.target.value)}
              required
            >
              <option value="">Chọn tỉnh, thành phố</option>
              {PROVINCES.filter((p) => p !== profile.routeFrom).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>
      <fieldset className="space-y-3 border-t border-line pt-5">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Danh sách tài xế
        </legend>
        {profile.drivers.map((d, i) => (
          <div
            key={d.id}
            className="grid gap-3 rounded-[14px] border border-line bg-surface-2 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          >
            <Field label={`Tài xế ${i + 1} - họ tên`} required>
              <O
                value={d.name}
                onChange={(e) =>
                  setField(
                    "drivers",
                    profile.drivers.map((x) =>
                      x.id === d.id ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
            </Field>
            <Field label="Số điện thoại" required>
              <O
                type="tel"
                inputMode="tel"
                value={d.phone}
                placeholder="0905 123 456"
                onChange={(e) =>
                  setField(
                    "drivers",
                    profile.drivers.map((x) =>
                      x.id === d.id ? { ...x, phone: e.target.value } : x,
                    ),
                  )
                }
              />
            </Field>
            <Button
              type="button"
              variant="nhe"
              small
              aria-label={`Xóa tài xế ${i + 1}`}
              disabled={profile.drivers.length <= 1 || !!inUse?.drivers[d.id]}
              onClick={() =>
                setField(
                  "drivers",
                  profile.drivers.filter((x) => x.id !== d.id),
                )
              }
            >
              <Icon name="trash" className="size-4" />
              Xóa
            </Button>
            {!!inUse?.drivers[d.id] && (
              <p className="text-xs font-medium text-warn sm:col-span-3">
                Đang dùng cho {inUse.drivers[d.id]} chuyến chưa khởi hành, không
                thể xóa.
              </p>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="sub"
          small
          onClick={() =>
            setField("drivers", [...profile.drivers, emptyDriver()])
          }
        >
          <Icon name="plus" className="size-4" />
          Thêm tài xế
        </Button>
      </fieldset>

      <fieldset className="space-y-3 border-t border-line pt-5">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Danh sách xe
        </legend>
        {profile.vehicles.map((v, i) => {
          const set = (patch: Partial<VehicleForm>) =>
            setField(
              "vehicles",
              profile.vehicles.map((x) =>
                x.id === v.id ? { ...x, ...patch } : x,
              ),
            );
          return (
            <div
              key={v.id}
              className="space-y-3 rounded-[14px] border border-line bg-surface-2 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  Xe {i + 1}
                  {!!inUse?.vehicles[v.id] && (
                    <Badge tone="warn">
                      Đang dùng cho {inUse.vehicles[v.id]} chuyến, không thể xóa
                    </Badge>
                  )}
                </p>
                <Button
                  type="button"
                  variant="nhe"
                  small
                  aria-label={`Xóa xe ${i + 1}`}
                  disabled={
                    profile.vehicles.length <= 1 || !!inUse?.vehicles[v.id]
                  }
                  onClick={() =>
                    setField(
                      "vehicles",
                      profile.vehicles.filter((x) => x.id !== v.id),
                    )
                  }
                >
                  <Icon name="trash" className="size-4" />
                  Xóa
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Biển số xe" required>
                  <O
                    value={v.plate}
                    placeholder="78B-012.34"
                    className="uppercase"
                    onChange={(e) => set({ plate: e.target.value })}
                  />
                </Field>
                <Field label="Số chỗ ngồi" required>
                  <O
                    type="number"
                    inputMode="numeric"
                    min={4}
                    max={60}
                    value={v.seats}
                    placeholder="34"
                    onChange={(e) => set({ seats: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Số Giấy đăng ký xe" required>
                <O
                  value={v.registrationNo}
                  onChange={(e) => set({ registrationNo: e.target.value })}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Số Giấy chứng nhận kiểm định" required>
                  <O
                    value={v.inspectionNo}
                    onChange={(e) => set({ inspectionNo: e.target.value })}
                  />
                </Field>
                <Field label="Hạn kiểm định" required>
                  <O
                    type="date"
                    value={v.inspectionExpiry}
                    onChange={(e) => set({ inspectionExpiry: e.target.value })}
                  />
                </Field>
                <Field label="Số bảo hiểm trách nhiệm dân sự" required>
                  <O
                    value={v.insuranceNo}
                    onChange={(e) => set({ insuranceNo: e.target.value })}
                  />
                </Field>
                <Field label="Hạn bảo hiểm" required>
                  <O
                    type="date"
                    value={v.insuranceExpiry}
                    onChange={(e) => set({ insuranceExpiry: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="sub"
          small
          onClick={() =>
            setField("vehicles", [...profile.vehicles, emptyVehicle()])
          }
        >
          <Icon name="plus" className="size-4" />
          Thêm xe
        </Button>
      </fieldset>
    </div>
  );
}
