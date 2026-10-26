"use client";

/**
 * UC4 - Biểu mẫu chuyến xe, dùng cho đăng ký và yêu cầu cập nhật.
 */
import { useState } from "react";
import { Field, O, Select } from "@/components/ui";
import type { Driver, Route, Vehicle } from "@/types";
import type { TripForm as Form } from "./trip";

/**
 * Biểu mẫu chuyến xe, dùng cho đăng ký và yêu cầu cập nhật.
 * Xe và tài xế chọn từ danh sách đã khai trong hồ sơ nhà xe.
 */
export function TripForm({
  form,
  setField,
  routes,
  vehicles,
  drivers,
  autoFocus = false,
}: {
  form: Form;
  setField: <K extends keyof Form>(key: K, value: Form[K]) => void;
  routes: Route[];
  vehicles: Vehicle[];
  drivers: Driver[];
  autoFocus?: boolean;
}) {
  const origins = [...new Set(routes.map((r) => r.from))];
  // Điểm đi suy ra từ tuyến đã chọn; chỉ có một điểm đi thì chọn sẵn
  const [pickedOrigin, setPickedOrigin] = useState("");
  const origin =
    routes.find((r) => r.id === form.routeId)?.from ??
    (pickedOrigin || (origins.length === 1 ? origins[0] : ""));
  const destinations = routes.filter((r) => r.from === origin);

  return (
    <div className="space-y-5">
      <fieldset className="space-y-4">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Hành trình
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Điểm đi" required>
            <Select
              value={origin}
              onChange={(e) => {
                setPickedOrigin(e.target.value);
                setField("routeId", "");
              }}
              autoFocus={autoFocus}
            >
              <option value="">Chọn điểm đi</option>
              {origins.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Điểm đến" required>
            <Select
              value={form.routeId}
              onChange={(e) => setField("routeId", e.target.value)}
              disabled={!origin}
            >
              <option value="">Chọn điểm đến</option>
              {destinations.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.to}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày xuất bến dự kiến" required>
            <O
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
            />
          </Field>
          <Field label="Giờ xuất bến dự kiến" required>
            <O
              type="time"
              value={form.departAt}
              onChange={(e) => setField("departAt", e.target.value)}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="mb-3 text-xs font-bold tracking-wide text-muted uppercase">
          Xe và tài xế
        </legend>
        <Field label="Xe" required>
          <Select
            value={form.vehicleId}
            onChange={(e) => setField("vehicleId", e.target.value)}
          >
            <option value="">Chọn xe trong hồ sơ</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate} · {v.seats} chỗ
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tài xế" required>
          <Select
            value={form.driverId}
            onChange={(e) => setField("driverId", e.target.value)}
          >
            <option value="">Chọn tài xế trong hồ sơ</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.phone}
              </option>
            ))}
          </Select>
        </Field>
      </fieldset>
    </div>
  );
}
