export type SimInput = {
  ap: number;
  dps: number;
  impactPerSecond: number;
  stability: number;
};

export function simulateBattle(buildA: SimInput, buildB: SimInput) {
  const dt = 0.5;
  let t = 0;
  let hpA = buildA.ap;
  let hpB = buildB.ap;
  const events: string[] = [];

  while (hpA > 0 && hpB > 0 && t < 300) {
    const staggerMulA =
      buildA.impactPerSecond > buildB.stability * 0.03 ? 1.08 : 1;
    const staggerMulB =
      buildB.impactPerSecond > buildA.stability * 0.03 ? 1.08 : 1;

    hpB -= buildA.dps * staggerMulA * dt;
    hpA -= buildB.dps * staggerMulB * dt;
    t += dt;

    if (Math.floor(t) % 10 === 0 && Math.abs(t - Math.round(t)) < 1e-6) {
      events.push(
        `t=${t.toFixed(0)} A_HP=${Math.max(0, hpA).toFixed(0)} B_HP=${Math.max(
          0,
          hpB,
        ).toFixed(0)}`,
      );
    }
  }

  const winner = hpA === hpB ? null : hpA > hpB ? "A" : "B";
  return {
    winner,
    durationSec: Number(t.toFixed(2)),
    events,
    remainingAp: {
      A: Math.max(0, hpA),
      B: Math.max(0, hpB),
    },
  };
}
