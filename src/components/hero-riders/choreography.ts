const TAU = Math.PI * 2;

// Mirrored circuits leave an open lane below the sun. Analytic tangents keep
// the silhouettes and light walls continuous across the loop boundary.
export function riderPose(time: number, index: number) {
  const side = index === 0 ? -1 : 1;
  const period = index === 0 ? 32 : 36;
  const phase = time * TAU / period + (index === 0 ? 0.68 : 3.5);
  const x = side * (7.5 + 3.5 * Math.sin(phase) + 0.8 * Math.sin(2 * phase));
  const z = 0.5 + 8 * Math.cos(phase);
  const dx = side * (3.5 * Math.cos(phase) + 1.6 * Math.cos(2 * phase));
  const dz = -8 * Math.sin(phase);
  const turn = side * Math.sin(phase) * 0.12;
  return { x, z, yaw: Math.atan2(-dx, -dz), bank: turn, period };
}
