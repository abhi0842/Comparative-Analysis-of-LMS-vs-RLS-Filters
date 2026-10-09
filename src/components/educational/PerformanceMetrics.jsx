import { useContext } from "react";
import { SimulationContext } from "../../context/SimulationContext";
import styles from "../rightPanel/rightPanel.module.css";

export const PerformanceMetrics = () => {
  const {
    artifactGenerated,
    metrics,
  } = useContext(SimulationContext);

  if (!artifactGenerated) return null;

  const metricDefs = [
    { key: "mmse", label: "MSE", unit: "lower is better", before: metrics.mmse_before, lms: metrics.lms?.mmse, rls: metrics.rls?.mmse },
    { key: "psnr", label: "PSNR", unit: "dB · higher is better", before: metrics.psnr_before, lms: metrics.lms?.psnr, rls: metrics.rls?.psnr },
    { key: "snr", label: "SNR", unit: "dB · higher is better", before: metrics.snr_before, lms: metrics.lms?.snr, rls: metrics.rls?.snr },
    { key: "ccf", label: "Correlation", unit: "higher is better", before: metrics.ccf_before, lms: metrics.lms?.ccf, rls: metrics.rls?.ccf },
  ];
  const formatMetric = (value, key) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return number.toFixed(key === "ccf" ? 4 : key === "mmse" ? 6 : 2);
  };

  return (
    <section className={styles.box} style={{ backgroundColor: "#f8fafb" }}>
      <h3>Algorithm Comparison</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "420px", textAlign: "right" }}>
          <thead>
            <tr style={{ color: "#687684", fontSize: "0.8rem" }}>
              <th style={{ padding: "0.55rem", textAlign: "left" }}>Metric</th>
              <th style={{ padding: "0.55rem" }}>Before</th>
              <th style={{ padding: "0.55rem", color: "#b45309" }}>LMS</th>
              <th style={{ padding: "0.55rem", color: "#15803d" }}>RLS</th>
            </tr>
          </thead>
          <tbody>
        {metricDefs.map((metric) => {
          const lowerIsBetter = metric.key === "mmse";
          const isImproved = (value) => lowerIsBetter ? value < Number(metric.before) : value > Number(metric.before);
          return (
            <tr key={metric.key} style={{ borderTop: "1px solid #dfe5ea" }}>
              <th style={{ padding: "0.65rem 0.55rem", textAlign: "left", color: "#263746" }}>
                {metric.label}<div style={{ color: "#687684", fontSize: "0.68rem", fontWeight: "normal" }}>{metric.unit}</div>
              </th>
              <td style={{ padding: "0.65rem 0.55rem" }}>{formatMetric(metric.before, metric.key)}</td>
              <td style={{ padding: "0.65rem 0.55rem", color: isImproved(Number(metric.lms)) ? "#16803c" : "#b42318", fontWeight: 600 }}>{formatMetric(metric.lms, metric.key)}</td>
              <td style={{ padding: "0.65rem 0.55rem", color: isImproved(Number(metric.rls)) ? "#16803c" : "#b42318", fontWeight: 600 }}>{formatMetric(metric.rls, metric.key)}</td>
            </tr>
          );
        })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
