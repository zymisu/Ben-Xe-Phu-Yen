"use client";

/**
 * Trang chủ công khai: tra cứu lịch xe xuất bến, tuyến, dịch vụ, thông báo điều hành, giới thiệu và liên hệ.
 */
import Image from "next/image";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { CountUp, Reveal } from "@/components/Motion";
import { Pager, usePaged } from "@/components/Pager";
import {
  Badge,
  Button,
  Empty,
  Field,
  O,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  The,
  Tr,
} from "@/components/ui";
import {
  formatDate,
  formatDuration,
  matches,
  money,
  todayISO,
  weekday,
} from "@/lib/format";
import { ORG } from "@/lib/org";
import { useNow } from "@/lib/useNow";
import { isExpired } from "@/features/uc04-trips/trip";
import { useStore } from "@/lib/store";

const SERVICES = [
  [
    "Quầy điều độ",
    "Tiếp nhận đăng ký chuyến, cấp lệnh vận chuyển, giải quyết vướng mắc của nhà xe",
  ],
  [
    "Bãi đỗ xe",
    "Vị trí đỗ chờ và ô đón khách được phân công theo giờ xuất bến",
  ],
  [
    "Phòng chờ hành khách",
    "Ghế chờ, nước uống, màn hình thông tin chuyến, phục vụ 04h00 – 22h00",
  ],
  [
    "Gửi hàng hoá",
    "Nhận gửi hàng theo tuyến, giao nhận tại quầy hàng hoá trong khu nhà chờ",
  ],
  [
    "An ninh trật tự",
    "Trực 24/24, kiểm soát xe ra vào cổng, xử lý vi phạm tại bãi",
  ],
  [
    "Hỗ trợ người khuyết tật",
    "Lối lên xuống riêng, nhân viên hỗ trợ khi có yêu cầu tại quầy",
  ],
];

export function Home() {
  const { data, ready } = useStore();

  const [to, setTo] = useState("");
  // Ngày mặc định là hôm nay theo giờ máy, chỉ biết sau khi gắn vào trình duyệt
  const [picked, setPicked] = useState<string | null>(null);
  const date = picked ?? (ready ? todayISO() : "");
  const setDate = (d: string) => setPicked(d);
  const now = useNow();
  const [routeId, setRouteId] = useState("");

  const routeOf = useMemo(
    () => new Map(data.routes.map((r) => [r.id, r])),
    [data.routes],
  );

  const carrierOf = useMemo(
    () => new Map(data.dossiers.map((d) => [d.id, d.companyName])),
    [data.dossiers],
  );

  /** Lịch công bố chỉ gồm các chuyến đã được duyệt */
  const schedule = useMemo(() => {
    return data.trips
      .filter((t) => t.status === "active" && !isExpired(t, now))
      .filter((t) => t.date === date)
      .filter((t) => (routeId ? t.routeId === routeId : true))
      .filter((t) => {
        if (!to.trim()) return true;
        const r = routeOf.get(t.routeId);
        return r ? matches(`${r.to} ${r.from} ${r.code}`, to) : false;
      })
      .sort((a, b) => a.departAt.localeCompare(b.departAt));
  }, [data.trips, date, routeId, to, routeOf, now]);

  const paged = usePaged(schedule, `${date}|${routeId}|${to}`);

  return (
    <>
      {/* HERO */}
      <section className="border-b border-line bg-brand-soft">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="vao-trang tre-1 text-xs font-semibold tracking-wide text-brand-soft-ink uppercase">
            {ORG.authority}
          </p>
          <h1 className="vao-trang tre-2 mt-2.5 font-display text-[28px] leading-[1.12] font-extrabold text-balance text-brand-soft-ink sm:text-[44px]">
            {ORG.name}
          </h1>
          <p className="vao-trang tre-3 mx-auto mt-3 max-w-3xl text-sm text-balance text-ink sm:text-base">
            {ORG.routeScope}.
          </p>

          <dl className="vao-trang tre-4 mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
            {[
              ["Tuyến khai thác", data.routes.length],
              [
                "Chuyến mỗi ngày",
                ready
                  ? data.trips.filter(
                      (t) =>
                        t.status === "active" &&
                        t.date === todayISO() &&
                        !isExpired(t, now),
                    ).length
                  : "-",
              ],
              ["Năm thành lập", ORG.founded],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="nang-len rounded-xl border border-line bg-card px-2 py-4 shadow-sm"
              >
                <dd className="tnum font-display text-2xl font-extrabold text-brand-soft-ink sm:text-3xl">
                  <CountUp
                    value={value as number | string}
                    from={label === "Năm thành lập" ? 1990 : 0}
                    duration={label === "Năm thành lập" ? 2600 : 1100}
                  />
                </dd>
                <dt className="mt-0.5 text-[11px] tracking-wide text-muted uppercase sm:text-xs">
                  {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* TRA CỨU LỊCH XE */}
      <section
        id="lich-xe"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      >
        <Reveal>
          <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
            Lịch xe xuất bến
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            {date ? `${weekday(date)}, ngày ${formatDate(date)}` : " "}
          </p>

          <The className="mt-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_200px]">
              <Field label="Nơi đến">
                <div className="relative">
                  <Icon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                  />
                  <O
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="Đà Nẵng, Nha Trang…"
                    className="pl-9"
                  />
                </div>
              </Field>
              <Field label="Tuyến">
                <Select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                >
                  <option value="">Tất cả tuyến</option>
                  {data.routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.from} – {r.to}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Ngày đi">
                <O
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
          </The>

          <div className="mt-5">
            {!ready ? null : schedule.length === 0 ? (
              <Empty
                title="Không có chuyến phù hợp"
                desc="Thử đổi ngày đi hoặc bỏ bớt điều kiện lọc."
              >
                <Button
                  variant="sub"
                  onClick={() => {
                    setTo("");
                    setRouteId("");
                    setPicked(null);
                  }}
                >
                  Đặt lại
                </Button>
              </Empty>
            ) : (
              <Table>
                <THead>
                  <Th>Giờ xuất bến</Th>
                  <Th>Tuyến</Th>
                  <Th>Đơn vị vận tải</Th>
                  <Th>Biển số</Th>
                  <Th className="text-right">Giá vé niêm yết</Th>
                </THead>
                <TBody>
                  {paged.rows.map((t) => {
                    const r = routeOf.get(t.routeId);
                    return (
                      <Tr key={t.id}>
                        <Td label="Giờ xuất bến">
                          <span className="tnum font-display text-lg font-extrabold text-brand">
                            {t.departAt}
                          </span>
                        </Td>
                        <Td label="Tuyến">
                          <p className="font-semibold text-ink">
                            {r?.from} → {r?.to}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {r?.km} km · {r && formatDuration(r.minutes)}
                          </p>
                        </Td>
                        <Td label="Đơn vị vận tải" className="text-muted">
                          {carrierOf.get(t.dossierId) ?? "-"}
                        </Td>
                        <Td
                          label="Biển số"
                          className="tnum font-semibold text-ink"
                        >
                          {t.plate}
                        </Td>
                        <Td
                          label="Giá vé niêm yết"
                          className="tnum text-right font-semibold text-ink"
                        >
                          {money(r?.fare)}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
            <Pager {...paged} />
          </div>
        </Reveal>
      </section>

      {/* TUYẾN VẬN TẢI */}
      <section id="tuyen" className="border-y border-line bg-surface-2">
        <Reveal>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
              Tuyến vận tải đang khai thác
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.routes.map((r) => (
                <The key={r.id}>
                  <span className="rounded-lg bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-bold text-brand-soft-ink">
                    {r.code}
                  </span>
                  <p className="mt-3 font-display text-lg font-bold text-ink">
                    {r.to}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    từ {r.from} · {r.km} km · {formatDuration(r.minutes)}
                  </p>
                  <p className="tnum mt-3 border-t border-line pt-3 text-sm font-semibold text-ink">
                    {money(r.fare)}
                  </p>
                </The>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* DỊCH VỤ TẠI BẾN */}
      <section
        id="dich-vu"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      >
        <Reveal>
          <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
            Dịch vụ tại bến
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(([name, desc]) => (
              <The key={name}>
                <p className="font-semibold text-ink">{name}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {desc}
                </p>
              </The>
            ))}
          </div>
        </Reveal>
      </section>

      {/* THÔNG BÁO */}
      <section id="thong-bao" className="border-y border-line bg-surface-2">
        <Reveal>
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
              Thông báo điều hành
            </h2>

            <The className="mt-5" pad={false}>
              <ul className="divide-y divide-line">
                {data.notices.map((n) => (
                  <li key={n.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="warn">Điều hành</Badge>
                      <span className="tnum text-xs text-muted">
                        {formatDate(n.date)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-ink">{n.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {n.text}
                    </p>
                  </li>
                ))}
              </ul>
            </The>
          </div>
        </Reveal>
      </section>

      {/* GIỚI THIỆU */}
      <section
        id="gioi-thieu"
        className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      >
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink sm:text-[28px]">
                Giới thiệu
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {ORG.name} là {ORG.type.toLowerCase()} trực thuộc{" "}
                {ORG.authority}, thành lập năm {ORG.founded}. Bến là đầu mối vận
                tải hành khách liên tỉnh của tỉnh Phú Yên, tổ chức tiếp nhận
                đăng ký chuyến, điều độ xe ra vào bến và xác nhận lệnh xuất bến
                cho các đơn vị vận tải.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Người đại diện pháp luật: {ORG.representative} - {ORG.position}.
              </p>
            </div>

            <Image
              src="/ben-xe-phu-yen.png"
              alt="Bến xe Liên tỉnh Phú Yên"
              width={1024}
              height={572}
              className="w-full rounded-2xl border border-line"
            />
          </div>
        </Reveal>
      </section>
    </>
  );
}
