"use client";

/**
 * UC6, UC8.2 - Giao diện trạm cổng: tài xế quẹt thẻ, xem kết quả đối chiếu và quyết định của nhân viên.
 */
import { Icon, Logo } from "@/components/Icon";
import { Button, cx, Select } from "@/components/ui";
import { ORG } from "@/lib/org";
import { CameraFrame } from "../CameraFrame";
import { GATES } from "../rules";
import { UNKNOWN_CARD, useKiosk } from "./logic";

/** Trạm cổng: màn hình đầu đọc thẻ NFC và camera đặt tại cổng bến */
export function Kiosk() {
  const k = useKiosk();
  const e = k.entry;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-4 py-5 sm:py-8">
      <header className="flex items-center gap-3">
        <Logo className="size-10 shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-base font-bold text-ink">
            {ORG.shortName}
          </p>
          <p className="text-[11px] tracking-wide text-muted uppercase">
            Trạm kiểm soát cổng
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Cổng"
          className="ml-auto flex rounded-xl border border-line bg-card p-0.5"
        >
          {GATES.map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={k.gate === g}
              onClick={() => k.setGate(g)}
              className={cx(
                "cham-duoc rounded-[10px] px-3 text-sm font-semibold transition-colors",
                k.gate === g
                  ? "bg-brand text-brand-ink"
                  : "text-muted hover:text-ink",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </header>

      <div
        role="radiogroup"
        aria-label="Hướng"
        className="mt-5 grid grid-cols-2 gap-1 rounded-xl border border-line bg-card p-1"
      >
        {(
          [
            ["entry", "Vào bến"],
            ["exit", "Ra bến"],
          ] as const
        ).map(([mode, label]) => (
          <button
            key={mode}
            role="radio"
            aria-checked={k.kind === mode}
            onClick={() => k.setKind(mode)}
            className={cx(
              "cham-duoc rounded-[10px] text-sm font-bold transition-colors",
              k.kind === mode
                ? "bg-brand text-brand-ink"
                : "text-muted hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex-1" aria-live="polite">
        {/* chờ quẹt thẻ */}
        {!e && !k.invalid && (
          <section className="hien-len">
            <div className="rounded-[20px] border border-line bg-card p-6 text-center sm:p-8">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Icon name="bus" className="size-8" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
                {k.kind === "exit"
                  ? "Quẹt thẻ NFC để ra bến"
                  : "Quẹt thẻ NFC để vào bến"}
              </h1>
              <p className="mt-1.5 text-sm text-muted">{k.gate}</p>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                Thẻ
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {k.cards.map((c) => (
                  <button
                    key={c.uid}
                    onClick={() => k.swipe(c.uid, c.trip.plate)}
                    className="cham-duoc rounded-[14px] border border-line bg-card px-4 py-3 text-left transition-colors hover:border-brand"
                  >
                    <span className="block truncate text-sm font-semibold text-ink">
                      {c.driver.name}
                    </span>
                    <span className="tnum block truncate text-xs text-muted">
                      {c.uid}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => k.swipe(UNKNOWN_CARD)}
                  className="cham-duoc rounded-[14px] border border-dashed border-line bg-card px-4 py-3 text-left transition-colors hover:border-brand"
                >
                  <span className="block text-sm font-semibold text-ink">
                    Thẻ chưa đăng ký
                  </span>
                  <span className="tnum block text-xs text-muted">
                    {UNKNOWN_CARD}
                  </span>
                </button>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-bold tracking-wide text-muted uppercase">
                Xe tại cổng (camera)
              </span>
              <Select
                value={k.cameraPlate}
                onChange={(ev) => k.setCameraPlate(ev.target.value)}
              >
                <option value="">Xe của tài xế quẹt thẻ</option>
                {k.plates.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </label>
          </section>
        )}

        {/* thẻ không hợp lệ */}
        {k.invalid && (
          <Result
            tone="danger"
            title="Thẻ không hợp lệ"
            text="Không đọc được thẻ hoặc thẻ chưa đăng ký. Vui lòng liên hệ nhân viên bến xe."
            onReset={k.reset}
          />
        )}

        {/* chờ nhân viên */}
        {e?.status === "pending" && (
          <Result
            tone="warn"
            title="Đang chờ nhân viên xác nhận"
            text={`${e.driverName} · ${e.plate}`}
            camera={
              <CameraFrame plate={e.plate} gate={e.gate} at={e.requestedAt} />
            }
            onReset={k.reset}
          />
        )}

        {/* được cho vào */}
        {e?.status === "approved" && (
          <Result
            tone="ok"
            title={
              k.kind === "exit"
                ? "Cổng mở, chúc xe thượng lộ bình an"
                : "Cổng mở, mời xe vào bến"
            }
            text={
              k.kind === "exit"
                ? `Lệnh xuất bến ${k.trip?.departureOrder?.code ?? ""}`
                : k.bayCode && k.trip?.boarding
                  ? `Đến ${k.bayCode}, đón khách lúc ${k.trip.boarding.startAt}`
                  : "Chưa có vị trí đón khách, xe vào bãi chờ"
            }
            onReset={k.reset}
          />
        )}

        {/* bị từ chối */}
        {e?.status === "rejected" && (
          <Result
            tone="danger"
            title={
              k.kind === "exit"
                ? "Xe không được ra bến"
                : "Xe không được vào bến"
            }
            text={e.reason ?? ""}
            onReset={k.reset}
          />
        )}
      </div>

      <footer className="mt-8 text-center text-[11px] leading-relaxed text-muted">
        {ORG.name} · MST {ORG.taxCode}
        <br />
        Cơ quan chủ quản: {ORG.authority}
      </footer>
    </div>
  );
}

function Result({
  tone,
  title,
  text,
  camera,
  onReset,
}: {
  tone: "ok" | "warn" | "danger";
  title: string;
  text: string;
  camera?: React.ReactNode;
  onReset?: () => void;
}) {
  const palette = {
    ok: "border-ok/30 bg-ok-soft text-ok",
    warn: "border-warn/30 bg-warn-soft text-warn",
    danger: "border-danger/30 bg-danger-soft text-danger",
  }[tone];
  return (
    <section className="hien-len space-y-4">
      <div
        className={cx("rounded-[20px] border p-6 text-center sm:p-8", palette)}
      >
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        {text && <p className="mt-2 text-sm text-ink">{text}</p>}
      </div>
      {camera}
      {onReset && (
        <Button variant="sub" className="w-full" onClick={onReset}>
          Quẹt thẻ khác
        </Button>
      )}
    </section>
  );
}
