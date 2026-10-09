import { useContext, useMemo } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import { computePSD } from "../../utils/psd";
import { Line } from "react-chartjs-2";
import styles from "./ecgFilteredPSD.module.css";

export const EcgFilteredPSD = () => {
  const { filteredSamples, generateECG, originalFs } = useContext(SimulationContext);

  const rlsPsd = useMemo(() => {
    if (!generateECG) return null;
    const rls = filteredSamples?.map((point) => point.y) || [];
    return rls.length ? computePSD(rls, originalFs) : null;
  }, [filteredSamples, generateECG, originalFs]);

  if (!rlsPsd) return null;

  const peak = Math.max(...rlsPsd.psd) || 1;
  const rlsDb = rlsPsd.psd.map((power) => 10 * Math.log10((power + 1e-20) / peak));

  const chartData = {
    datasets: [{
      label: "RLS output",
      data: rlsPsd.freqs.map((frequency, index) => ({ x: frequency, y: rlsDb[index] })),
    borderColor: "#15803d",
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.15,
    }],
  };

  const options = {
    responsive: true,
    animation: false,
    parsing: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: "RLS Output Power Spectrum",
        font: { size: 13, weight: "bold" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const f = Number(ctx.parsed.x);
            const y = Number(ctx.parsed.y);
            return `${ctx.dataset.label} @ ${f.toFixed(1)} Hz: ${y.toFixed(1)} dB`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: originalFs / 2,
        title: {
          display: true,
          text: "Frequency f  (Hz)",
          font: { size: 12, weight: "bold" },
        },
        ticks: { font: { size: 11 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        min: -80,
        max: 0,
        title: {
          display: true,
          text: "Relative PSD (dB)",
          font: { size: 12, weight: "bold" },
        },
        ticks: { font: { size: 11 }, callback: (v) => v.toFixed(0) + " dB" },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  };

  return (
    <div className={styles.signalContainer} style={{ position: "relative", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
