/** Khung ảnh camera tại cổng: biển số xe đọc được và thời điểm chụp */
export function CameraFrame({
  plate,
  gate,
  at,
}: {
  plate: string;
  gate: string;
  /** YYYY-MM-DDTHH:MM */
  at: string;
}) {
  const time = at.split("T")[1] ?? "";
  return (
    <div
      role="img"
      aria-label={`Ảnh camera ${gate}, biển số ${plate || "không đọc được"}`}
      className="relative flex h-32 sm:h-36 items-center justify-center overflow-hidden rounded-[14px] border border-line bg-deep"
    >
      <div className="rounded-md border-2 border-black bg-white px-5 py-1.5 font-mono text-xl font-extrabold tracking-wider text-black shadow-lg sm:text-2xl">
        {plate || "- - -"}
      </div>
      <span className="absolute top-2 left-3 text-[11px] font-semibold tracking-wide text-deep-muted uppercase">
        CAM · {gate}
      </span>
      <span className="tnum absolute right-3 bottom-2 text-[11px] text-deep-muted">
        {time}
      </span>
    </div>
  );
}
