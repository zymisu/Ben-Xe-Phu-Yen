"use client";

/**
 * UC11.1 - Biểu đồ minh hoạ cho bảng báo cáo (Chart.js), theo màu giao diện hiện tại.
 */
import { useEffect, useRef } from "react";
import type { ChartSpec } from "./reports";

const COLOR_VARS = ["--brand", "--warn", "--info", "--danger", "--neutral"];

function cssVar(name: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

export function ReportChart({ spec }: { spec: ChartSpec }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let chart: import("chart.js").Chart | undefined;
    let cancelled = false;

    async function draw() {
      const { Chart } = await import("chart.js/auto");
      if (cancelled || !el) return;
      chart?.destroy();
      const colors = COLOR_VARS.map(cssVar);
      const ink = cssVar("--muted");
      const grid = cssVar("--line");
      const round = spec.kind === "doughnut";
      // Hai chuỗi đạt/không đạt dùng màu ngữ nghĩa thay vì màu thứ tự
      const semantic: Record<string, string> = {
        Đạt: cssVar("--brand"),
        "Không đạt": cssVar("--danger"),
        "Bị từ chối": cssVar("--danger"),
      };
      chart = new Chart(el, {
        type: spec.kind,
        data: {
          labels: spec.labels,
          datasets: spec.series.map((s, i) => ({
            label: s.label,
            data: s.data,
            backgroundColor: round
              ? spec.labels.map((_, k) => colors[k % colors.length])
              : (semantic[s.label] ?? colors[i % colors.length]),
            borderColor: round
              ? cssVar("--card")
              : (semantic[s.label] ?? colors[i % colors.length]),
            borderWidth: round ? 2 : spec.kind === "line" ? 2.5 : 0,
            borderRadius: spec.kind === "bar" ? 6 : 0,
            tension: 0.35,
            pointRadius: spec.kind === "line" ? 3 : 0,
            maxBarThickness: 36,
          })),
        },
        options: {
          indexAxis: spec.horizontal ? "y" : "x",
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: "easeOutQuart" },
          plugins: {
            legend: {
              display: spec.series.length > 1 || round,
              position: round ? "right" : "bottom",
              labels: { color: ink, usePointStyle: true, boxWidth: 8 },
            },
          },
          scales: round
            ? {}
            : {
                x: {
                  stacked: spec.stacked,
                  ticks: { color: ink },
                  grid: { color: spec.horizontal ? grid : "transparent" },
                },
                y: {
                  stacked: spec.stacked,
                  beginAtZero: true,
                  ticks: { color: ink, precision: 0 },
                  grid: { color: spec.horizontal ? "transparent" : grid },
                },
              },
        },
      });
    }

    draw();
    // Đổi giao diện sáng/tối thì vẽ lại theo màu mới
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      cancelled = true;
      mo.disconnect();
      chart?.destroy();
    };
  }, [spec]);

  return (
    <div className="h-72 rounded-[14px] border border-line bg-card p-4 sm:h-80">
      <canvas ref={canvas} />
    </div>
  );
}
