"use client";

/**
 * UC5 - Phần thông tin đón khách trong chi tiết chuyến, kèm yêu cầu điều chỉnh giờ đón của nhà xe.
 */
import { Button, Field, Note, O, Textarea } from "@/components/ui";
import type { Trip } from "@/types";
import { BOARD_MINUTES, canRequestAdjust } from "../rules";
import { useAdjustRequest } from "./logic";

function endOf(startAt: string): string {
  const [h, m] = startAt.split(":").map(Number);
  const total = h * 60 + m + BOARD_MINUTES;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

/** Thông tin đón khách của chuyến và nút yêu cầu điều chỉnh, đặt trong chi tiết chuyến của nhà xe */
export function BoardingSection({ trip }: { trip: Trip }) {
  const f = useAdjustRequest(trip);
  const b = trip.boarding;

  if (trip.status !== "active") return null;

  if (!b) {
    return (
      <Note tone="neutral" title="Đón khách">
        Chưa có vị trí và giờ đón khách. Nhân viên điều độ sẽ sắp xếp sau khi
        chuyến được duyệt.
      </Note>
    );
  }

  return (
    <div className="space-y-3">
      <Note tone="ok" title="Đón khách">
        {f.bayCode} · {b.startAt} - {endOf(b.startAt)}
        <span className="mt-1 block text-xs opacity-80">
          Giờ trên vé {trip.departAt} không đổi. Xe có {BOARD_MINUTES} phút đón
          khách tại vị trí này.
          {b.previousStart && ` Giờ đón trước đó: ${b.previousStart}.`}
        </span>
      </Note>

      {trip.departure && (
        <Note tone="ok" title="Xe đã xuất bến">
          Ra lúc {trip.departure.at.split("T")[1]} qua {trip.departure.gate}.
        </Note>
      )}

      {trip.arrival && (
        <Note tone="info" title="Xe đã vào bến">
          Vào lúc {trip.arrival.at.split("T")[1]} qua {trip.arrival.gate}.
        </Note>
      )}

      {b.status === "adjusting" && b.request && (
        <Note tone="info" title="Đã gửi yêu cầu điều chỉnh">
          Giờ mong muốn {b.request.desiredStart}. Đang chờ nhân viên điều độ xem
          xét, giờ chính thức do nhân viên quyết định.
        </Note>
      )}

      {canRequestAdjust(trip) && !f.open && (
        <Button variant="sub" small onClick={f.begin}>
          Yêu cầu điều chỉnh giờ đón
        </Button>
      )}

      {f.open && (
        <form
          onSubmit={f.submit}
          noValidate
          className="hien-len space-y-3 rounded-[14px] border border-line bg-surface-2 p-3"
        >
          <Field label="Giờ đón khách mong muốn" required>
            <O
              type="time"
              value={f.desired}
              onChange={(e) => f.setDesired(e.target.value)}
              className="sm:max-w-48"
            />
          </Field>
          <Field label="Ghi chú">
            <Textarea
              rows={2}
              value={f.note}
              onChange={(e) => f.setNote(e.target.value)}
              placeholder="Ví dụ: xe vào bến muộn do kẹt xe"
            />
          </Field>
          {f.error && <Note tone="danger">{f.error}</Note>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="nhe" small onClick={f.cancel}>
              Huỷ
            </Button>
            <Button type="submit" variant="chinh" small>
              Gửi yêu cầu
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
