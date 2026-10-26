/**
 * UC11.2 - Vẽ biểu đồ của báo cáo thành ảnh PNG (nền trắng, màu dễ in) để đưa vào tệp xuất.
 */
import type { ChartSpec } from "../reports";

const PALETTE = ["#00a862", "#f79009", "#2e90fa", "#f04438", "#667085"];
const SEMANTIC: Record<string, string> = {
  Đạt: "#00a862",
  "Không đạt": "#f04438",
  "Bị từ chối": "#f04438",
};

export async function chartImage(
  spec: ChartSpec,
  width = 900,
  height = 420,
): Promise<string> {
  const { Chart } = await import("chart.js/auto");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const round = spec.kind === "doughnut";
  const chart = new Chart(canvas, {
    type: spec.kind,
    data: {
      labels: spec.labels,
      datasets: spec.series.map((s, i) => ({
        label: s.label,
        data: s.data,
        backgroundColor: round
          ? spec.labels.map((_, k) => PALETTE[k % PALETTE.length])
          : (SEMANTIC[s.label] ?? PALETTE[i % PALETTE.length]),
        borderColor: round
          ? "#ffffff"
          : (SEMANTIC[s.label] ?? PALETTE[i % PALETTE.length]),
        borderWidth: round ? 2 : spec.kind === "line" ? 2.5 : 0,
        tension: 0.35,
        maxBarThickness: 36,
      })),
    },
    options: {
      indexAxis: spec.horizontal ? "y" : "x",
      responsive: false,
      animation: false,
      plugins: {
        legend: {
          display: spec.series.length > 1 || round,
          position: round ? "right" : "bottom",
        },
      },
      scales: round
        ? {}
        : {
            x: { stacked: spec.stacked },
            y: {
              stacked: spec.stacked,
              beginAtZero: true,
              ticks: { precision: 0 },
            },
          },
    },
    plugins: [
      {
        id: "nen-trang",
        beforeDraw(c) {
          const ctx = c.ctx;
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.restore();
        },
      },
    ],
  });
  const url = canvas.toDataURL("image/png");
  chart.destroy();
  return url;
}
