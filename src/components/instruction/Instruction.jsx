import React from "react";
import styles from "./instruction.module.css";

export const Instruction = () => {
  return (
    <div className={styles.box}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>LMS and RLS Adaptive Filter Comparison</h1>

          <section style={{ margin: "1rem 0 1.25rem", padding: "1rem", background: "#eef7f4", borderLeft: "4px solid #16805a", borderRadius: "6px" }}>
            <h2 style={{ fontSize: "1.1rem", color: "#175b45", marginBottom: "0.5rem" }}>
              Simulation: Follow These Steps
            </h2>
            <ol style={{ margin: "0 0 0 1.25rem", lineHeight: 1.65 }}>
              <li><b>Load the clean signal.</b> In Step 1, click <b>Load Clean ECG</b> to load Dataset 109. This is the clean reference signal <i>s[n]</i>.</li>
              <li><b>Select an artifact.</b> In Step 2, choose PLI, baseline wander, or EMG from the dropdown. Noise frequency and amplitude are fixed to the simulation's standard settings.</li>
              <li><b>Create the noisy input and reference.</b> Click <b>Add Artifact → Build d[n] &amp; x[n]</b>. The simulation forms <i>d[n] = s[n] + v[n]</i> and a correlated sensor reference <i>x[n]</i>. Inspect the displayed desired and reference signals.</li>
              <li><b>Set both algorithms' parameters.</b> Adjust filter order <i>M</i>, LMS step size <i>μ</i>, and RLS forgetting factor <i>λ</i> and covariance initialization <i>δ</i> in Step 3. A λ closer to 1 gives RLS longer memory; LMS μ controls how quickly its weights adapt.</li>
              <li><b>Run the comparison.</b> Click <b>Run LMS + RLS</b>. The time-domain chart overlays the clean ECG, artifact-contaminated input, LMS output, and RLS output on the same sample window.</li>
              <li><b>Inspect the frequency-domain result.</b> Click <b>View PSD</b> to compare the clean, contaminated, LMS, and RLS spectra on a shared scale.</li>
              <li><b>Check quantitative performance.</b> Click <b>View Metrics</b> to compare contaminated input, LMS, and RLS using MSE, PSNR, SNR, and correlation.</li>
              <li><b>Inspect adaptation.</b> Review the RLS weight, gain norm, and covariance trace plots below the time-domain comparison to see how its solution evolves over sample index <i>n</i>.</li>
            </ol>
          </section>

          <section style={{ margin: "1rem 0 1.25rem", padding: "1rem", background: "#f7f8fa", borderLeft: "4px solid #b08968", borderRadius: "6px" }}>
            <h2 style={{ fontSize: "1.1rem", color: "#344454", margin: "0 0 0.4rem" }}>
              Recommended Parameters to Try
            </h2>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: "620px", borderCollapse: "collapse", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr style={{ background: "#eceff2", color: "#344454" }}>
                    <th style={{ padding: "0.55rem", textAlign: "left" }}>Artifact</th>
                    <th style={{ padding: "0.55rem" }}>Shared order M</th>
                    <th style={{ padding: "0.55rem" }}>LMS step μ</th>
                    <th style={{ padding: "0.55rem" }}>RLS λ</th>
                    <th style={{ padding: "0.55rem" }}>RLS δ</th>
                   
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["PLI", "8", "0.5", "1.0", "0.1",],
                    ["Baseline wander", "48", "0.001", "1.0", "10",],
                    ["EMG", "4", "0.35", "1.0", "0.1",],
                  ].map(([artifact, order, stepSize, forgettingFactor, regularization, reduction]) => (
                    <tr key={artifact} style={{ borderTop: "1px solid #dfe5ea" }}>
                      <th style={{ padding: "0.55rem", textAlign: "left", color: "#263746" }}>{artifact}</th>
                      <td style={{ padding: "0.55rem" }}>{order}</td>
                      <td style={{ padding: "0.55rem" }}>{stepSize}</td>
                      <td style={{ padding: "0.55rem" }}>{forgettingFactor}</td>
                      <td style={{ padding: "0.55rem" }}>{regularization}</td>
                      <td style={{ padding: "0.55rem" }}>{reduction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
