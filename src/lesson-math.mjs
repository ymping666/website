// Original, small numerical examples shared by the static lesson and its controls.
export function softmaxTrace(logits, temperature = 1) {
  const scaled = logits.map(x => x / temperature);
  const maximum = Math.max(...scaled);
  const shifted = scaled.map(x => x - maximum);
  const exponentials = shifted.map(Math.exp);
  const denominator = exponentials.reduce((a, b) => a + b, 0);
  const probabilities = exponentials.map(x => x / denominator);
  return { logits, temperature, scaled, maximum, shifted, exponentials, denominator, probabilities };
}

export const attentionKeys = [[1, 0], [0, 1]];
export const attentionValues = [[2, 0], [0, 4]];
export function attentionTrace(query, keys = attentionKeys, values = attentionValues) {
  const dimension = query.length;
  const dots = keys.map(key => key.reduce((sum, x, j) => sum + query[j] * x, 0));
  const scores = dots.map(x => x / Math.sqrt(dimension));
  const normalized = softmaxTrace(scores);
  const contributions = values.map((value, i) => value.map(x => x * normalized.probabilities[i]));
  const output = values[0].map((_, j) => contributions.reduce((sum, value) => sum + value[j], 0));
  return { query, keys, values, dimension, dots, scores, ...normalized, contributions, output };
}

export const formatNumber = value => Number(value.toFixed(6)).toString();
export const formatVector = values => '[' + values.map(formatNumber).join(', ') + ']';

export const convolutionImage = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
export const convolutionKernels = {
  asymmetric: [[1, 2], [0, -1]],
  sum: [[1, 1], [1, 1]],
  difference: [[1, 0], [0, -1]]
};
export function convolutionTrace(image = convolutionImage, kernel = convolutionKernels.asymmetric, row = 0, column = 0) {
  const height = image.length - kernel.length + 1, width = image[0].length - kernel[0].length + 1;
  const at = (i, j) => kernel.flatMap((weights, a) => weights.map((weight, b) => ({
    a, b, imageRow: i + a, imageColumn: j + b, input: image[i + a][j + b], weight,
    product: image[i + a][j + b] * weight
  })));
  const output = Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => at(i, j).reduce((sum, term) => sum + term.product, 0)));
  return { image, kernel, row, column, height, width, terms: at(row, column), output, value: output[row][column] };
}

export const ropeVectors = { axis: [1, 0], diagonal: [1, 1], zero: [0, 0] };
export function ropeTrace(x, y, angle) {
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  const products = [x * cosine, -y * sine, x * sine, y * cosine];
  const output = [products[0] + products[1], products[2] + products[3]];
  return { input: [x, y], angle, cosine, sine, products, output, inputNorm: Math.hypot(x, y), outputNorm: Math.hypot(...output) };
}

export const diffusionExamples = {
  orthogonal: { x0: [2, 0], noise: [0, 2] },
  opposing: { x0: [2, 0], noise: [-2, 0] },
  mixed: { x0: [2, -1], noise: [-1, 2] }
};
export function diffusionTrace(x0, noise, alphaBar) {
  const signalScale = Math.sqrt(alphaBar), noiseScale = Math.sqrt(1 - alphaBar);
  const signalPart = x0.map(x => signalScale * x), noisePart = noise.map(x => noiseScale * x);
  const output = signalPart.map((x, i) => x + noisePart[i]);
  return { x0, noise, alphaBar, signalScale, noiseScale, signalPart, noisePart, output };
}
