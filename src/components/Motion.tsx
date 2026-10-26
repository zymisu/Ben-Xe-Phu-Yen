"use client";

/**
 * Chuyển động khi cuộn trang: khối hiện dần khi vào khung nhìn, số đếm tăng dần.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

/** Khối nội dung trượt lên và hiện dần lần đầu xuất hiện trên màn hình */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${seen ? "reveal-hien" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** Số đếm tăng dần từ 0 tới giá trị; giá trị không phải số thì hiện nguyên */
export function CountUp({
  value,
  from = 0,
  duration = 1100,
}: {
  value: number | string;
  from?: number;
  duration?: number;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const target = typeof value === "number" ? value : NaN;
  const [shown, setShown] = useState(from);
  useEffect(() => {
    if (!seen || Number.isNaN(target)) return;
    const start = performance.now();
    const dur = duration;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setShown(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, target, from, duration]);
  return <span ref={ref}>{Number.isNaN(target) ? value : shown}</span>;
}
