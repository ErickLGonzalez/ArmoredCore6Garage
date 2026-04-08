/** Piecewise linear interpolation through breakpoints [[x,y], ...]. */
export function piecewiseLinear(
  x: number,
  breakpoints: ReadonlyArray<readonly [number, number]> | [number, number][],
): number {
  const lastPos = breakpoints.length - 1;
  if (lastPos < 0) return NaN;
  if (x < breakpoints[0]![0]) return breakpoints[0]![1];
  if (x >= breakpoints[lastPos]![0]) return breakpoints[lastPos]![1];

  for (let i = 1; i <= lastPos; i++) {
    if (x < breakpoints[i]![0]) {
      const [m, q] = lineParameters([
        breakpoints[i - 1]!,
        breakpoints[i]!,
      ] as [[number, number], [number, number]]);
      return m * x + q;
    }
  }
  return breakpoints[lastPos]![1];
}

function lineParameters([[x1, y1], [x2, y2]]: [
  [number, number],
  [number, number],
]): [number, number] {
  return [(y1 - y2) / (x1 - x2), (x2 * y1 - x1 * y2) / (x2 - x1)];
}

export function total(list: number[]): number {
  return list.reduce((a, b) => a + b, 0);
}

export function mean(list: number[]): number | undefined {
  if (list.length === 0) return undefined;
  return total(list) / list.length;
}
