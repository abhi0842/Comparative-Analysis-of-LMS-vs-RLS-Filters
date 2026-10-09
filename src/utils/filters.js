function clampNumber(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function filterSignalLMS(reference, desired, options = {}) {
  const {
    filterOrder,
    stepSize = 0.01,
    returnDiagnostics = false,
  } = options;
  if (!Array.isArray(reference) || reference.length === 0) {
    return returnDiagnostics ? { Yfiltered: [], diagnostics: {} } : [];
  }
  if (!Array.isArray(desired) || desired.length === 0) {
    return returnDiagnostics ? { Yfiltered: [], diagnostics: {} } : [];
  }

  const N = Math.min(reference.length, desired.length);
  const M = Math.max(1, Math.min(64, Math.floor(filterOrder ?? 1)));
  const mu = clampNumber(stepSize, 1e-6, 0.5);
  const weights = new Array(M).fill(0);
  const Yfiltered = new Array(N).fill(0);
  const weightsHistory = returnDiagnostics ? [] : null;
  const errorPowerHistory = returnDiagnostics ? new Array(N).fill(0) : null;
  const weightDeltaNormHistory = returnDiagnostics ? new Array(N).fill(0) : null;

  for (let n = 0; n < N; n++) {
    let estimate = 0;
    for (let k = 0; k < M; k++) {
      if (n >= k) estimate += weights[k] * reference[n - k];
    }

    const error = desired[n] - estimate;
    Yfiltered[n] = Number.isFinite(error) ? error : desired[n] || 0;
    if (returnDiagnostics) weightsHistory.push(weights.slice());

    let weightDeltaNormSquared = 0;
    for (let k = 0; k < M && n >= k; k++) {
      const nextWeight = weights[k] + mu * error * reference[n - k];
      const safeWeight = Number.isFinite(nextWeight) ? nextWeight : 0;
      weightDeltaNormSquared += (safeWeight - weights[k]) ** 2;
      weights[k] = safeWeight;
    }
    if (returnDiagnostics) {
      const squaredError = error * error;
      errorPowerHistory[n] = n === 0
        ? squaredError
        : 0.99 * errorPowerHistory[n - 1] + 0.01 * squaredError;
      weightDeltaNormHistory[n] = Math.sqrt(weightDeltaNormSquared);
    }
  }

  if (returnDiagnostics) {
    return {
      Yfiltered,
      diagnostics: {
        weightsHistory,
        errorPowerHistory,
        weightDeltaNormHistory,
        stepSize: mu,
      },
    };
  }

  return Yfiltered;
}

export function filterSignalRLS(noisy, reference, options = {}) {
  const {
    filterOrder,
    forgettingFactor = 0.995,
    regularization = 0.01,
    returnDiagnostics = false,
  } = options;
  if (!Array.isArray(noisy) || noisy.length === 0) {
    return returnDiagnostics ? { Yfiltered: [], diagnostics: {} } : [];
  }
  if (!Array.isArray(reference) || reference.length === 0) {
    return returnDiagnostics ? { Yfiltered: [], diagnostics: {} } : [];
  }

  const N = Math.min(noisy.length, reference.length);
  const M = Math.max(1, Math.min(64, Math.floor(filterOrder ?? 1)));
  const lambda = clampNumber(forgettingFactor, 0.8, 1);
  const delta = clampNumber(regularization, 1e-6, 100);
  const weights = new Array(M).fill(0);
  const covariance = Array.from({ length: M }, (_, row) =>
    Array.from({ length: M }, (_, column) => row === column ? 1 / delta : 0)
  );
  const Yfiltered = new Array(N).fill(0);
  const weightsHistory = returnDiagnostics ? [] : null;
  const gainNormHistory = returnDiagnostics ? new Array(N).fill(0) : null;
  const covarianceTraceHistory = returnDiagnostics ? new Array(N).fill(0) : null;

  for (let n = 0; n < N; n++) {
    const x = new Array(M);
    for (let k = 0; k < M; k++) x[k] = n >= k ? noisy[n - k] : 0;

    let estimate = 0;
    for (let k = 0; k < M; k++) estimate += weights[k] * x[k];
    const error = reference[n] - estimate;
    Yfiltered[n] = Number.isFinite(error) ? error : reference[n] || 0;

    if (returnDiagnostics) weightsHistory.push(weights.slice());

    const projectedCovariance = new Array(M).fill(0);
    for (let row = 0; row < M; row++) {
      let projection = 0;
      for (let column = 0; column < M; column++) {
        projection += covariance[row][column] * x[column];
      }
      projectedCovariance[row] = projection;
    }

    let denominator = lambda;
    for (let k = 0; k < M; k++) denominator += x[k] * projectedCovariance[k];
    if (!Number.isFinite(denominator) || denominator <= 1e-12) continue;

    const gain = projectedCovariance.map((value) => value / denominator);
    for (let k = 0; k < M; k++) {
      const nextWeight = weights[k] + gain[k] * Yfiltered[n];
      weights[k] = Number.isFinite(nextWeight) ? nextWeight : 0;
    }

    let gainNormSquared = 0;
    for (let k = 0; k < M; k++) gainNormSquared += gain[k] * gain[k];
    for (let row = 0; row < M; row++) {
      for (let column = row; column < M; column++) {
        const nextValue = (covariance[row][column]
          - gain[row] * projectedCovariance[column]) / lambda;
        covariance[row][column] = Number.isFinite(nextValue) ? nextValue : 0;
        covariance[column][row] = covariance[row][column];
      }
    }

    if (returnDiagnostics) {
      gainNormHistory[n] = Math.sqrt(gainNormSquared);
      let trace = 0;
      for (let k = 0; k < M; k++) trace += covariance[k][k];
      covarianceTraceHistory[n] = trace;
    }
  }

  if (returnDiagnostics) {
    return {
      Yfiltered,
      diagnostics: {
        weightsHistory,
        gainNormHistory,
        covarianceTraceHistory,
        forgettingFactor: lambda,
        regularization: delta,
      },
    };
  }

  return Yfiltered;
}
