export const guideSteps = [
  {
    title: "Welcome to the Lab",
    content:
      "Would you like a guided tour of the Application and Usage of Adaptive Filters on ECG Signal simulation?",
    type: "choice",
    targetId: "guideButton",
  },
  {
    title: "Instructions",
    content:
      "Open the instruction panel to review lab objectives, adaptive filter theory, and recommended parameter ranges for LMS and RLS.",
    highlight: "instructionPanel",
    preferredPlacement: "right",
  },
  {
    title: "1. Clean ECG Dataset",
    content:
      "From Step 1, select the MIT-BIH 109 dataset and click 'Load & Plot Clean ECG (s[n])' to plot the clean waveform. You may toggle MLII / V1 leads.",
    highlight: "datasetSection",
    preferredPlacement: "right",
  },
  {
    title: "2. Generate ECG Signal",
    content:
      "Click 'Load & Plot Clean ECG (s[n])'. The clean ECG s[n] appears in the chart area on the left.",
    highlight: "loadDatasetBtn",
    requiredAction: "GENERATE_SIGNAL",
    preferredPlacement: "right",
  },
  {
    title: "3. Add One Artifact",
    content:
      "From Step 2, select ONE artifact type (Baseline Wander / PLI / EMG), adjust its amplitude/frequency, then click 'Add Artifact'. Desired signal d[n] = s[n] + artifact appears!",
    highlight: "artifactSection",
    requiredAction: "ADD_NOISE",
    preferredPlacement: "right",
  },
  {
    title: "4. Select Algorithm",
    content:
      "The simulation runs LMS and RLS together so their outputs can be compared on the same signal and artifact reference.",
    highlight: "algorithmSelector",
    preferredPlacement: "right",
    isDropdown: true,
  },
  {
    title: "5. Filter Parameters",
    content:
      "Set filter order M, LMS step size μ, and RLS forgetting factor λ and regularization δ. Then run both filters together.",
    highlight: "filterSection",
    preferredPlacement: "right",
  },
  {
    title: "6. Apply Filter",
    content:
      "Click Run LMS + RLS (Step 3). The overlay plot shows clean s[n], contaminated d[n], and both filtered outputs. The comparison metrics update for each algorithm.",
    highlight: "applyFilterBtn",
    requiredAction: "APPLY_FILTER",
    preferredPlacement: "right",
  },
  {
    title: "7. Compute PSD",
    content:
      "After applying the filter, click Compute PSD to view the unfiltered (noisy) and filtered power spectral density plots side by side.",
    highlight: "computePsdBtn",
    requiredAction: "COMPUTE_PSD",
    preferredPlacement: "right",
  },
  {
    title: "Lab Completed",
    content:
      "You have completed the guided workflow. Experiment with different artifacts and LMS vs RLS settings to compare performance via MMSE / PSNR / CCF metrics!",
    preferredPlacement: "center",
  },
];
