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
