import React, { useContext, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { SimulationContext, calculateSNR, calculatePSNR, calculateMMSE, calculateCCF } from "../../context/SimulationContext";
import { filterSignalLMS, filterSignalRLS } from "../../utils/filters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  zoomPlugin
);

const downsampleByIndexOffset = (arr, offset, maxPoints = 25000) => {
  if (!arr?.length) return [];
  if (arr.length <= maxPoints) {
    return arr.map((v, i) => ({ x: i + offset, y: v }));
  }
  const step = Math.ceil(arr.length / maxPoints);
  const pts = [];
  for (let i = 0; i < arr.length; i += step) pts.push({ x: i + offset, y: arr[i] });
  if (pts[pts.length - 1]?.x !== arr.length - 1 + offset)
    pts.push({ x: arr.length - 1 + offset, y: arr[arr.length - 1] });
  return pts;
};

export const EcgFilter = () => {
  const {
    config,
    referenceSignal, desiredSignal, cleanSignal, artifactSignal,
    setDiagnostics, setMetrics, originalFs, setFilteredSamples,
    setLmsFilteredSamples,
    datasetMeta, selectedLead,
    windowStart, windowLength,
  } = useContext(SimulationContext);

  const result = useMemo(() => {
    if (!referenceSignal?.length || !desiredSignal?.length) return null;

    const N = Math.min(referenceSignal.length, desiredSignal.length);
    if (N < 1) return null;

    const xn = referenceSignal.slice(0, N);
    const dn = desiredSignal.slice(0, N);

    try {
      const rlsOut = filterSignalRLS(xn, dn, {
        filterOrder: config.filterOrder,
        forgettingFactor: config.forgettingFactor,
        regularization: config.regularization,
        returnDiagnostics: true,
      });
      const lmsOut = filterSignalLMS(xn, dn, {
        filterOrder: config.filterOrder,
        stepSize: config.stepSize,
        returnDiagnostics: true,
      });

      return {
        rlsOutput: rlsOut.Yfiltered,
        lmsOutput: lmsOut.Yfiltered,
        rlsDiagnostics: rlsOut?.diagnostics || {},
        lmsDiagnostics: lmsOut?.diagnostics || {},
      };
    } catch (err) {
      console.error("Adaptive filter comparison crashed:", err);
      return null;
    }
  }, [referenceSignal, desiredSignal, config.filterOrder, config.forgettingFactor, config.regularization, config.stepSize]);

  useEffect(() => {
    if (!result || !cleanSignal?.length) return;
    const N = Math.min(cleanSignal.length, result.rlsOutput.length, result.lmsOutput.length);
    const s = cleanSignal.slice(0, N);
    const rlsOutput = result.rlsOutput.slice(0, N);
    const lmsOutput = result.lmsOutput.slice(0, N);
    const n0 = artifactSignal?.slice(0, N);

    const rlsResidual = s.map((v, i) => v - rlsOutput[i]);
    const lmsResidual = s.map((v, i) => v - lmsOutput[i]);

    const d = desiredSignal?.slice(0, N) || [];
    const mmseBefore = d.length ? calculateMMSE(s, d) : 0;
    const psnrBefore = d.length ? calculatePSNR(s, d) : 0;
    const snrBefore = n0?.length ? calculateSNR(s, n0) : 0;
    const ccfBefore = d.length ? calculateCCF(s, d) : 0;

    const calculateAlgorithmMetrics = (output, residual) => ({
      mmse: calculateMMSE(s, output),
      psnr: calculatePSNR(s, output),
      snr: calculateSNR(s, residual),
      ccf: calculateCCF(s, output),
    });
    const rlsMetrics = calculateAlgorithmMetrics(rlsOutput, rlsResidual);
    const lmsMetrics = calculateAlgorithmMetrics(lmsOutput, lmsResidual);

    setMetrics({
      algorithm: "RLS & LMS",
      order: config.filterOrder,
      mmse: rlsMetrics.mmse.toFixed(6),
      mmse_before: mmseBefore.toFixed(6),
      psnr_before: psnrBefore.toFixed(2),
      psnr_after: rlsMetrics.psnr.toFixed(2),
      psnr_improvement: (rlsMetrics.psnr - psnrBefore).toFixed(2),
      snr_before: snrBefore.toFixed(2),
      snr_after: rlsMetrics.snr.toFixed(2),
      snr_improvement: (rlsMetrics.snr - snrBefore).toFixed(2),
      ccf_before: ccfBefore.toFixed(4),
      ccf_after: rlsMetrics.ccf.toFixed(4),
      ccf_improvement: (rlsMetrics.ccf - ccfBefore).toFixed(4),
      rls: Object.fromEntries(Object.entries(rlsMetrics).map(([key, value]) => [key, value.toFixed(6)])),
      lms: Object.fromEntries(Object.entries(lmsMetrics).map(([key, value]) => [key, value.toFixed(6)])),
      lmsStepSize: config.stepSize,
    });

    setDiagnostics({
      algorithm: "LMS & RLS",
      lms: {
        weightsHistory: result.lmsDiagnostics.weightsHistory || [],
        errorPowerHistory: result.lmsDiagnostics.errorPowerHistory || [],
        weightDeltaNormHistory: result.lmsDiagnostics.weightDeltaNormHistory || [],
        stepSize: result.lmsDiagnostics.stepSize ?? config.stepSize,
      },
      rls: {
        weightsHistory: result.rlsDiagnostics.weightsHistory || [],
        forgettingFactor: result.rlsDiagnostics.forgettingFactor ?? config.forgettingFactor,
        regularization: result.rlsDiagnostics.regularization ?? config.regularization,
        gainNormHistory: result.rlsDiagnostics.gainNormHistory || [],
        covarianceTraceHistory: result.rlsDiagnostics.covarianceTraceHistory || [],
      },
      weightsHistory: result.rlsDiagnostics.weightsHistory || [],
      forgettingFactor: result.rlsDiagnostics.forgettingFactor ?? config.forgettingFactor,
      regularization: result.rlsDiagnostics.regularization ?? config.regularization,
      gainNormHistory: result.rlsDiagnostics.gainNormHistory || [],
      covarianceTraceHistory: result.rlsDiagnostics.covarianceTraceHistory || [],
    });

    setFilteredSamples(result.rlsOutput.map((y, i) => ({ x: i / originalFs, y })));
    setLmsFilteredSamples(result.lmsOutput.map((y, i) => ({ x: i / originalFs, y })));
  }, [result, cleanSignal, artifactSignal, desiredSignal, config.filterOrder, config.forgettingFactor, config.regularization, config.stepSize, originalFs, setMetrics, setDiagnostics, setFilteredSamples, setLmsFilteredSamples]);

  if (!result) return null;

  const Ntotal = result.rlsOutput.length || 0;
  const startIdx = Math.max(0, Math.min(Ntotal - 1, Math.floor(windowStart) || 0));
  const lengthIdx = Math.max(1, Math.min(Ntotal - startIdx, Math.floor(windowLength) || 1));
  const endIdx = startIdx + lengthIdx;
  const sSlice = cleanSignal?.slice(startIdx, endIdx) || [];
  const rlsSlice = result.rlsOutput.slice(startIdx, endIdx);
  const lmsSlice = result.lmsOutput.slice(startIdx, endIdx);

  const leadName = selectedLead === "A" ? datasetMeta.leadNameA : datasetMeta.leadNameB;
  const algoLine = `M=${config.filterOrder}  ·  LMS μ=${config.stepSize}  ·  RLS λ=${config.forgettingFactor}  ·  δ=${config.regularization}`;

  const mainChartData = {
    datasets: [
      {
        label: `Clean Reference s[n] — ${leadName || "MLII"}`,
        data: downsampleByIndexOffset(sSlice, startIdx, 20000),
        borderColor: "#2563eb",
        borderWidth: 1.8,
        borderDash: [6, 4],
        pointRadius: 0,
        tension: 0.05,
      },
      {
        label: "LMS Output e[n] = d[n] − ŷ[n]",
        data: downsampleByIndexOffset(lmsSlice, startIdx, 20000),
        borderColor: "#d97706",
        borderWidth: 1.8,
        pointRadius: 0,
        tension: 0.05,
      },
      {
        label: "RLS Output e[n] = d[n] − ŷ[n]",
        data: downsampleByIndexOffset(rlsSlice, startIdx, 20000),
        borderColor: "#16a34a",
        borderWidth: 2.2,
        pointRadius: 0,
        tension: 0.05,
      },
    ],
  };

  const mainOptions = {
    responsive: true,
    animation: false,
    parsing: false,
    interaction: { mode: "nearest", intersect: false, axis: "x" },
    plugins: {
      legend: { display: true, position: "bottom", labels: { boxWidth: 16, font: { size: 12 } } },
      title: {
        display: true,
        text: `LMS vs RLS: Clean Signal Recovery  ${algoLine}`,
        font: { size: 14, weight: "bold" },
        color: "#111",
        padding: { bottom: 14 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}   @ n=${ctx.parsed.x?.toLocaleString()}   :  ${Number(ctx.parsed.y).toFixed(4)} mV`,
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
        title: { display: true, text: "Sample Index n", font: { weight: "bold" } },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
      y: {
        type: "linear",
        title: { display: true, text: "Amplitude (mV)", font: { weight: "bold" } },
        grid: { color: "rgba(0,0,0,0.06)" },
      },
    },
  };

  return (
    <div
      id="ecg-filter-container"
      style={{
        background: "white", borderRadius: "8px",
        padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        marginTop: "1rem",
      }}
    >
      <Line data={mainChartData} options={mainOptions} height={190} />
    </div>
  );
};
