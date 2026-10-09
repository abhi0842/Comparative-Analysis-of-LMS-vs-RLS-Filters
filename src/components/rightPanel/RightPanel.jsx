import { useContext, useState, useEffect } from "react";
import {
  SimulationContext,
  DATASETS,
  ARTIFACT_TYPES,
  calculateSNR,
  calculatePSNR,
  calculateCCF,
} from "../../context/SimulationContext";
import styles from "./rightPanel.module.css";

const RLS_PRESETS = {
  PLI: { filterOrder: 32, forgettingFactor: 0.995, regularization: 0.01 },
  BW: { filterOrder: 64, forgettingFactor: 0.995, regularization: 0.01 },
  EMG: { filterOrder: 8, forgettingFactor: 0.995, regularization: 0.01 },
};

export const RightPanel = () => {
  const {
    selectedDataset, setSelectedDataset,
    datasetMeta,
    generateECG, loadCleanSignal, loadingState,
    windowStart, windowLength, setWindowStart, setWindowLength,
    selectedArtifact, setSelectedArtifact,
    applyNoiseTrigger, generateArtifactAndDesired, artifactGenerated,

    cleanSignal, desiredSignal, artifactSignal, referenceSignal,

    config, setConfig,

    setMetrics,
    setFilteredECG, setApplypsdTrigger, filteredECG, setShowMetrics,
  } = useContext(SimulationContext);

  const [filterOrder, setFilterOrder] = useState(config.filterOrder ?? 32);
  const [forgettingFactor, setForgettingFactor] = useState(config.forgettingFactor ?? 0.995);
  const [regularization, setRegularization] = useState(config.regularization ?? 0.01);
  const [stepSize, setStepSize] = useState(config.stepSize ?? 0.01);

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  useEffect(() => {
    if (!applyNoiseTrigger || !artifactGenerated) return;
    const sanitizedOrder = clamp(Math.floor(Number(filterOrder) || 1), 1, 64);
    const sanitizedLambda = clamp(Number(forgettingFactor) || 0.995, 0.8, 1);
    const sanitizedDelta = clamp(Number(regularization) || 0.01, 1e-6, 100);
    const sanitizedStepSize = clamp(Number(stepSize) || 0.01, 1e-6, 0.5);
    setConfig({
      filterOrder: sanitizedOrder,
      forgettingFactor: sanitizedLambda,
      regularization: sanitizedDelta,
      stepSize: sanitizedStepSize,
    });
  }, [filterOrder, forgettingFactor, regularization, stepSize, applyNoiseTrigger, artifactGenerated, setConfig]);

  useEffect(() => {
    if (!cleanSignal?.length || !desiredSignal?.length || !artifactSignal?.length) return;
    const N = Math.min(cleanSignal.length, desiredSignal.length, artifactSignal.length);
    const s = cleanSignal.slice(0, N);
    const d = desiredSignal.slice(0, N);
    const n0 = artifactSignal.slice(0, N);
    const psnr_before = calculatePSNR(s, d);
    const snr_before = calculateSNR(s, n0);
    const ccf_before = calculateCCF(s, d);
    setMetrics((m) => ({
      ...m,
      psnr_before: psnr_before.toFixed(2),
      snr_before: snr_before.toFixed(2),
      ccf_before: ccf_before.toFixed(4),
    }));
  }, [cleanSignal, desiredSignal, artifactSignal, setMetrics]);

  const handleApplyArtifact = () => {
    generateArtifactAndDesired();
  };

  const handleArtifactChange = (artifact) => {
    setSelectedArtifact(artifact);
    const preset = RLS_PRESETS[artifact];
    setFilterOrder(preset.filterOrder);
    setForgettingFactor(preset.forgettingFactor);
    setRegularization(preset.regularization);
    setConfig({ ...preset, stepSize });
  };

  const handleRunRLS = () => {
    if (!artifactGenerated || !referenceSignal.length || !desiredSignal.length) return;
    setFilteredECG(true);
    setApplypsdTrigger(false);
  };

  const handleShowPSD = () => {
    if (filteredECG) setApplypsdTrigger(true);
  };

  const handleShowMetrics = () => {
    if (filteredECG) setShowMetrics(true);
  };

  return (
    <div className={styles.rightPanelContainer}>
      <div className={styles.right}>
        

        {/* Step 1: Dataset */}
        <div id="datasetSection" className={styles.box}>
          <h3>Step 1: Load Clean ECG Reference s[n]</h3>
          <label>Dataset</label>
          <select
            id="datasetSelector"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
          >
            {DATASETS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <div className={styles.buttonContainer}>
            <button
              type="button"
              id="loadDatasetBtn"
              disabled={loadingState === "primary"}
              onClick={() => loadCleanSignal(selectedDataset)}
            >
              {loadingState === "primary" ? "⏳ Loading dataset..." : "Load Signal"}
            </button>
            
          </div>

          {generateECG && (
            <>
             
               
               
                  <label style={{ fontSize: "0.85rem", color: "#444", minWidth: "80px" }}>Start n₀</label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, (datasetMeta.N || 0) - windowLength)}
                    step="1"
                    value={windowStart}
                    onChange={(e) => setWindowStart(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />
               

                
                  <label style={{ fontSize: "0.85rem", color: "#444", minWidth: "80px" }}>Length N</label>
                  <input
                    type="range"
                    min="1"
                    max={datasetMeta.N || 1}
                    step="1"
                    value={windowLength}
                    onChange={(e) => setWindowLength(Number(e.target.value))}
                    style={{ flex: 1 }}
                  />


             
            </>
          )}
        </div>

        {/* Step 2: Artifact */}
        <div id="artifactSection" className={styles.box}>
          <h3>Step 2: Add Artifact → d[n] = s[n] + v[n]</h3>
          
          <select
            id="artifactSelector"
            value={selectedArtifact}
            onChange={(e) => handleArtifactChange(e.target.value)}
            disabled={!generateECG}
          >
            {ARTIFACT_TYPES.map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>

          <div className={styles.buttonContainer}>
            <button
              type="button"
              id="addArtifactBtn"
              onClick={handleApplyArtifact}
              disabled={!generateECG}
            >
              Add Artifact → Build d[n] &amp; x[n]
            </button>
          </div>
        </div>

        {/* Step 3: Adaptive filter parameters */}
        <div id="filterSection" className={styles.box}>
          <h3>Step 3: LMS + RLS Parameters</h3>

          <label>Filter Order M (taps, 1–64)</label>
          <input
            type="number" min="1" max="64" step="1"
            value={filterOrder}
            onChange={(e) => setFilterOrder(Number(e.target.value))}
            onBlur={() => setFilterOrder((o) => clamp(Math.floor(Number(o) || 1), 1, 64))}
          />

          <label>Forgetting Factor λ (0.8–1.0)</label>
          <input
            type="number" min="0.8" max="1" step="0.0001"
            value={forgettingFactor}
            onChange={(e) => setForgettingFactor(Number(e.target.value))}
            onBlur={() => setForgettingFactor((v) => clamp(Number(v) || 0.995, 0.8, 1))}
          />

          <label>Initial Covariance δ (P₀ = I / δ)</label>
          <input
            type="number" min="0.000001" max="100" step="0.001"
            value={regularization}
            onChange={(e) => setRegularization(Number(e.target.value))}
            onBlur={() => setRegularization((v) => clamp(Number(v) || 0.01, 1e-6, 100))}
          />
          <label>LMS Step Size μ (0.000001–0.5)</label>
          <input
            type="number" min="0.000001" max="0.5" step="0.001"
            value={stepSize}
            onChange={(e) => setStepSize(Number(e.target.value))}
            onBlur={() => setStepSize((v) => clamp(Number(v) || 0.01, 1e-6, 0.5))}
          />
          {applyNoiseTrigger && (
            <>
              
                
             
            </>
          )}

          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleRunRLS}
              disabled={!artifactGenerated}
            >
              Run LMS + RLS
            </button>
            <button
              type="button"
              onClick={handleShowPSD}
              disabled={!filteredECG}
            >
              View PSD
            </button>
            <button
              type="button"
              onClick={handleShowMetrics}
              disabled={!filteredECG}
            >
              View Metrics
            </button>
          </div>
        </div>

        {/* Step 4: Metrics */}
      </div>
    </div>
  );
};
