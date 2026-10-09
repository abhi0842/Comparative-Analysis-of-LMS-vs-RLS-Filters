import { useContext, useState, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

const EMPTY_DIAGNOSTICS = {};
const EMPTY_HISTORY = [];

export const AdaptiveWeightEvolution = () => {
  const { diagnostics } = useContext(SimulationContext);
  const [visibleCoeffs, setVisibleCoeffs] = useState(5);
  const lmsDiagnostics = diagnostics?.lms || EMPTY_DIAGNOSTICS;
  const rlsDiagnostics = diagnostics?.rls || diagnostics || EMPTY_DIAGNOSTICS;
  const lmsWeights = lmsDiagnostics.weightsHistory || EMPTY_HISTORY;
  const rlsWeights = rlsDiagnostics.weightsHistory || EMPTY_HISTORY;
  const maxCoefficients = Math.max(lmsWeights[0]?.length || 0, rlsWeights[0]?.length || 0, 1);

  const chartData = useMemo(() => {
    if (!lmsWeights.length && !rlsWeights.length) return null;
    const datasets = [];
    const algorithms = [
      { name: "LMS", history: lmsWeights, palette: ["#b45309", "#d97706", "#f59e0b", "#92400e", "#fbbf24", "#78350f"] },
      { name: "RLS", history: rlsWeights, palette: ["#166534", "#15803d", "#22c55e", "#14532d", "#4ade80", "#365314"] },
    ];

    for (const algorithm of algorithms) {
      const history = algorithm.history.filter(Array.isArray);
      const iterations = history.length;
      const count = Math.min(visibleCoeffs, history[0]?.length || 0);
      const stride = Math.max(1, Math.ceil(iterations / 1500));
      const indices = [];
      for (let n = 0; n < iterations; n += stride) indices.push(n);
      if (indices.length && indices[indices.length - 1] !== iterations - 1) indices.push(iterations - 1);

      for (let coefficient = 0; coefficient < count; coefficient++) {
        datasets.push({
          label: `${algorithm.name} w${coefficient}`,
          data: indices.map((n) => ({ x: n, y: history[n][coefficient] })),
          borderColor: algorithm.palette[coefficient % algorithm.palette.length],
          borderDash: algorithm.name === "LMS" ? [5, 3] : [],
          borderWidth: 1.5,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
        });
      }
    }

    return { datasets };
  }, [lmsWeights, rlsWeights, visibleCoeffs]);

  const lmsDiagnosticsData = useMemo(() => {
    const errorHistory = lmsDiagnostics.errorPowerHistory;
    const updateHistory = lmsDiagnostics.weightDeltaNormHistory;
    if (!Array.isArray(errorHistory) || !Array.isArray(updateHistory)) return null;
    const sampleCount = Math.min(errorHistory.length, updateHistory.length);
    if (!sampleCount) return null;
    const stride = Math.max(1, Math.ceil(sampleCount / 1500));
    const sampleIndices = [];
    for (let n = 0; n < sampleCount; n += stride) sampleIndices.push(n);
    if (sampleIndices[sampleIndices.length - 1] !== sampleCount - 1) sampleIndices.push(sampleCount - 1);
    return {
      datasets: [
        {
          label: "Smoothed squared error",
          data: sampleIndices.map((n) => ({ x: n, y: errorHistory[n] })),
          borderColor: "#b45309",
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: "y",
        },
        {
          label: "Weight update norm",
          data: sampleIndices.map((n) => ({ x: n, y: updateHistory[n] })),
          borderColor: "#d97706",
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: "y1",
        },
      ],
    };
  }, [lmsDiagnostics]);

  const rlsDiagnosticsData = useMemo(() => {
    const gainHistory = rlsDiagnostics.gainNormHistory;
    const covarianceHistory = rlsDiagnostics.covarianceTraceHistory;
    if (!Array.isArray(gainHistory) || !Array.isArray(covarianceHistory)) return null;
    const sampleCount = Math.min(gainHistory.length, covarianceHistory.length);
    if (!sampleCount) return null;
    const stride = Math.max(1, Math.ceil(sampleCount / 1500));
    const sampleIndices = [];
    for (let n = 0; n < sampleCount; n += stride) sampleIndices.push(n);
    if (sampleIndices[sampleIndices.length - 1] !== sampleCount - 1) sampleIndices.push(sampleCount - 1);
    return {
      datasets: [
        {
          label: "Gain norm ||k[n]||",
          data: sampleIndices.map((n) => ({ x: n, y: gainHistory[n] })),
          borderColor: "#15803d",
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: "y",
        },
        {
          label: "Covariance trace tr(P[n])",
          data: sampleIndices.map((n) => ({ x: n, y: covarianceHistory[n] })),
          borderColor: "#2563eb",
          borderWidth: 1.5,
          pointRadius: 0,
          yAxisID: "y1",
        },
      ],
    };
  }, [rlsDiagnostics]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: true, position: "top" },
        tooltip: {
          mode: "nearest",
          intersect: false,
          callbacks: {
            title: (items) => `Sample n = ${Number(items[0]?.parsed?.x ?? 0).toLocaleString()}`,
          },
        },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        },
      },
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: "Sample n (weights before update)" },
          ticks: { maxTicksLimit: 10 },
        },
        y: {
          title: { display: true, text: "Coefficient Value" },
        },
      },
    }),
    []
  );

  const adaptationOptions = {
    ...options,
    scales: {
      x: { type: "linear", title: { display: true, text: "Sample n" }, ticks: { maxTicksLimit: 10 } },
      y: { type: "linear", position: "left", title: { display: true, text: "Error power / gain norm" } },
      y1: { type: "linear", position: "right", title: { display: true, text: "Update norm / covariance trace" }, grid: { drawOnChartArea: false } },
    },
  };

  if (!lmsWeights.length && !rlsWeights.length) {
    return (
      <div style={{ padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", marginBottom: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>LMS + RLS Adaptive Weight Evolution</h3>
        <p style={{ margin: "0.5rem 0 0", color: "#666", fontSize: "0.95rem" }}>
          Weight history is not available yet. Run the filter to populate this view.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", marginBottom: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
          LMS + RLS Adaptive Weight Evolution
        </h3>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.9rem" }}>Show Coefficients:</label>
          <input
            type="number"
            min="1"
            max={maxCoefficients}
            value={visibleCoeffs}
            onChange={(e) => setVisibleCoeffs(Number(e.target.value))}
            style={{ width: "60px", padding: "0.25rem", borderRadius: "4px", border: "1px solid #ddd" }}
          />
        </div>
      </div>
      <div style={{ height: "300px" }}>
        {chartData && <Line data={chartData} options={options} />}
      </div>
      <h4 style={{ margin: "1rem 0 0.4rem", fontSize: "0.95rem" }}>
        LMS Adaptation State (μ={lmsDiagnostics.stepSize ?? "—"})
      </h4>
      <div style={{ height: "240px" }}>
        {lmsDiagnosticsData && <Line data={lmsDiagnosticsData} options={adaptationOptions} />}
      </div>
      <h4 style={{ margin: "1rem 0 0.4rem", fontSize: "0.95rem" }}>
        RLS Adaptation State (λ={rlsDiagnostics.forgettingFactor ?? "—"})
      </h4>
      <div style={{ height: "240px" }}>
        {rlsDiagnosticsData && <Line data={rlsDiagnosticsData} options={adaptationOptions} />}
      </div>
    </div>
  );
};
