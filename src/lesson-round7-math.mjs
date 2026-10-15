// Small, finite teaching examples. These functions never draw random samples.
export const latentPresets = {
  mixed: {mu: [1, -1], logvar: [Math.log(4), Math.log(.25)], epsilon: [1, -2]},
  prior: {mu: [0, 0], logvar: [0, 0], epsilon: [1, -2]},
  zero: {mu: [1, -1], logvar: [Math.log(4), Math.log(.25)], epsilon: [0, 0]},
  empty: {mu: [], logvar: [], epsilon: []}
};
export const klPresets = {
  prior: {mu: [0, 0], logvar: [0, 0]},
  shifted: {mu: [1, 2], logvar: [0, 0]},
  wide: {mu: [0, 0], logvar: [Math.log(4), Math.log(4)]},
  narrow: {mu: [0, 0], logvar: [Math.log(.25), Math.log(.25)]},
  mixed: {mu: [1, -1], logvar: [Math.log(4), Math.log(.25)]},
  empty: {mu: [], logvar: []}
};
export const pixelPresets = {typical: [1, 3], repeated: [1, 3, 1, 3], zero: [0, 0], empty: []};
export const contributionPresets = {typical: [.5, .25], repeated: [.5, .25, .5, .25], empty: []};
export function sampleTrace(mu, logvar, epsilon) {
  const rows = mu.map((m, i) => {
    const variance = Math.exp(logvar[i]), sigma = Math.exp(.5 * logvar[i]);
    const noise = sigma * epsilon[i];
    return {i, mu: m, logvar: logvar[i], variance, sigma, epsilon: epsilon[i], noise, z: m + noise};
  });
  return {rows, output: rows.map(r => r.z)};
}
export function klTrace(mu, logvar) {
  const rows = mu.map((m, i) => {
    const variance = Math.exp(logvar[i]);
    const meanPart = .5 * m * m, variancePart = .5 * (variance - 1 - logvar[i]);
    return {i, mu: m, logvar: logvar[i], variance, meanPart, variancePart, kl: .5 * (variance + m * m - 1 - logvar[i])};
  });
  return {rows, output: rows.reduce((s, r) => s + r.kl, 0)};
}
export function betaTrace(errors, contributions, beta) {
  const reconstruction = errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : 0;
  const kl = contributions.reduce((a, b) => a + b, 0), weighted = beta * kl;
  return {errors: [...errors], contributions: [...contributions], beta, reconstruction, kl, weighted, output: reconstruction + weighted};
}
