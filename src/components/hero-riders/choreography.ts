const TAU = Math.PI * 2;

// Staggered circuits occupy the open space to the right of the desktop copy.
// Analytic tangents keep silhouettes and light walls continuous at loop edges.
export function riderPose(time: number, index: number) {
  const period = index === 0 ? 32 : 36;
  const phase = time * TAU / period + (index === 0 ? 0.68 : 3.5);
  const amplitude = index === 0 ? 2.3 : 1.4;
  const x = (index === 0 ? 7.3 : 13.4) + amplitude * Math.sin(phase) + .45 * Math.sin(2 * phase);
  const z = (index === 0 ? 2.5 : -3) + 6.8 * Math.cos(phase);
  const dx = amplitude * Math.cos(phase) + .9 * Math.cos(2 * phase);
  const dz = -6.8 * Math.sin(phase);
  const turn = Math.sin(phase) * .12;
  return { x, z, yaw: Math.atan2(-dx, -dz), bank: turn, period };
}
