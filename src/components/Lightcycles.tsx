import { useEffect, useRef } from 'react';

type Bike = {
  name: string;
  color: string;
  glow: string;
  x: number;
  y: number;
  dir: number;
  trail: { x: number; y: number }[];
  alive: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  glow: string;
  size?: number;
  ring?: boolean;
  radius?: number;
  maxRadius?: number;
};

export const Lightcycles = ({ id = 'lc' }: { id?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fit = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      canvas.style.width = r.width + 'px';
      canvas.style.height = r.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const COLS = 48,
      ROWS = 28;
    const DX = [1, 0, -1, 0];
    const DY = [0, 1, 0, -1];

    const PALETTES = [
      { name: 'CYN', color: '#22d3ee', glow: 'rgba(34,211,238,' },
      { name: 'MAG', color: '#ff2bd6', glow: 'rgba(255,43,214,' },
      { name: 'GLD', color: '#fbbf24', glow: 'rgba(251,191,36,' },
      { name: 'LIM', color: '#a3e635', glow: 'rgba(163,230,53,' },
      { name: 'VLT', color: '#a78bfa', glow: 'rgba(167,139,250,' },
      { name: 'CRM', color: '#f97316', glow: 'rgba(249,115,22,' },
    ];

    let bikes: Bike[] = [];
    let particles: Particle[] = [];
    let resetIn = 0;
    let stepAccumulator = 0;
    let stepMs = 115;
    let trailScale = 1;
    let trailStyle: 'solid' | 'dashed' | 'double' = 'solid';
    let frameCount = 0;
    let roundEndedAt = -1;

    const spawnRound = () => {
      stepMs = 85 + Math.floor(Math.random() * 75);
      trailScale = 0.7 + Math.random() * 0.75;
      const styleRoll = Math.random();
      trailStyle = styleRoll < 0.78 ? 'solid' : 'double';

      const shuffled = [...PALETTES].sort(() => Math.random() - 0.5);
      const p1 = shuffled[0],
        p2 = shuffled[1];

      const margin = 4;
      const variance = 6;
      const corners = [
        { x: margin + Math.floor(Math.random() * variance), y: margin + Math.floor(Math.random() * variance) },
        { x: COLS - margin - Math.floor(Math.random() * variance), y: margin + Math.floor(Math.random() * variance) },
        { x: margin + Math.floor(Math.random() * variance), y: ROWS - margin - Math.floor(Math.random() * variance) },
        { x: COLS - margin - Math.floor(Math.random() * variance), y: ROWS - margin - Math.floor(Math.random() * variance) },
      ];
      const pairs = [[0, 3], [1, 2], [0, 1], [2, 3]];
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      const a = corners[pair[0]],
        b = corners[pair[1]];

      const dirToward = (sx: number, sy: number) => {
        const cx = COLS / 2,
          cy = ROWS / 2;
        const dx = cx - sx,
          dy = cy - sy;
        if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 0 : 2;
        return dy > 0 ? 1 : 3;
      };

      bikes = [
        { ...p1, x: a.x, y: a.y, dir: dirToward(a.x, a.y), trail: [{ x: a.x, y: a.y }], alive: true },
        { ...p2, x: b.x, y: b.y, dir: dirToward(b.x, b.y), trail: [{ x: b.x, y: b.y }], alive: true },
      ];
      particles = [];
      resetIn = 0;
      roundEndedAt = -1;
    };
    spawnRound();

    const cellOccupied = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
      for (const b of bikes) {
        for (const t of b.trail) {
          if (t.x === x && t.y === y) return true;
        }
      }
      return false;
    };

    const decideDir = (self: Bike, enemy: Bike) => {
      const candidates: { d: number; score: number }[] = [];
      for (let d = 0; d < 4; d++) {
        if (Math.abs(d - self.dir) === 2) continue;
        const nx = self.x + DX[d],
          ny = self.y + DY[d];
        if (cellOccupied(nx, ny)) continue;
        const dist = Math.abs(nx - enemy.x) + Math.abs(ny - enemy.y);
        let lookahead = 0;
        let lx = nx,
          ly = ny;
        for (let k = 0; k < 5; k++) {
          lx += DX[d];
          ly += DY[d];
          if (cellOccupied(lx, ly)) break;
          lookahead++;
        }
        let score = lookahead * 2.5 - dist * 0.4;
        if (d === self.dir) score += 1.8;
        score += Math.random() * 2.5;
        candidates.push({ d, score });
      }
      if (!candidates.length) return self.dir;
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].d;
    };

    const explode = (bike: Bike) => {
      const W = canvas.clientWidth,
        H = canvas.clientHeight;
      const cellW = W / COLS,
        cellH = H / ROWS;
      const cx = bike.x * cellW + cellW / 2;
      const cy = bike.y * cellH + cellH / 2;
      for (let i = 0; i < 48; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 0.5 + Math.random() * 4.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 50 + Math.random() * 40,
          color: bike.color,
          glow: bike.glow,
          size: 1 + Math.random() * 3,
        });
      }
      particles.push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        life: 30,
        ring: true,
        radius: 4,
        maxRadius: Math.max(cellW, cellH) * 4,
        color: bike.color,
        glow: bike.glow,
      });
      bike.alive = false;
    };

    const step = () => {
      if (resetIn > 0) {
        resetIn--;
        if (resetIn === 0) spawnRound();
        return;
      }
      const survivors = bikes.filter((b) => b.alive);
      if (survivors.length < 2) return;

      for (const b of bikes) {
        if (!b.alive) continue;
        const enemy = bikes.find((o) => o !== b && o.alive) || bikes.find((o) => o !== b)!;
        b.dir = decideDir(b, enemy);
      }
      const newPositions = bikes.map((b) => (b.alive ? { x: b.x + DX[b.dir], y: b.y + DY[b.dir] } : null));
      for (let i = 0; i < bikes.length; i++) {
        for (let j = i + 1; j < bikes.length; j++) {
          if (!bikes[i].alive || !bikes[j].alive) continue;
          const a = newPositions[i],
            b = newPositions[j];
          if (a && b && a.x === b.x && a.y === b.y) {
            explode(bikes[i]);
            explode(bikes[j]);
          }
        }
      }
      for (let i = 0; i < bikes.length; i++) {
        if (!bikes[i].alive) continue;
        const np = newPositions[i]!;
        if (cellOccupied(np.x, np.y)) {
          explode(bikes[i]);
        } else {
          bikes[i].x = np.x;
          bikes[i].y = np.y;
          bikes[i].trail.push({ x: np.x, y: np.y });
        }
      }
      if (bikes.some((b) => !b.alive) && resetIn === 0) {
        resetIn = 18;
        roundEndedAt = frameCount;
      }
    };

    const drawBike = (b: Bike, cellW: number, cellH: number) => {
      const cx = b.x * cellW + cellW / 2;
      const cy = b.y * cellH + cellH / 2;
      const angle = b.dir * Math.PI / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      const w = cellW * 1.1;
      const h = cellH * 0.55;

      ctx.shadowColor = b.color;
      ctx.shadowBlur = 24;
      ctx.fillStyle = b.glow + '0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.7, h * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 14;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.moveTo(w * 0.55, 0);
      ctx.lineTo(w * 0.30, h * 0.45);
      ctx.lineTo(-w * 0.30, h * 0.45);
      ctx.lineTo(-w * 0.50, 0);
      ctx.lineTo(-w * 0.30, -h * 0.45);
      ctx.lineTo(w * 0.30, -h * 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
      ctx.beginPath();
      ctx.moveTo(w * 0.30, 0);
      ctx.lineTo(w * 0.10, h * 0.28);
      ctx.lineTo(-w * 0.20, h * 0.28);
      ctx.lineTo(-w * 0.30, 0);
      ctx.lineTo(-w * 0.20, -h * 0.28);
      ctx.lineTo(w * 0.10, -h * 0.28);
      ctx.closePath();
      ctx.fill();

      const wheelOffset = h * 0.55;
      const spin = (frameCount * 0.32) % (Math.PI * 2);
      [-1, 1].forEach((side) => {
        ctx.save();
        ctx.translate(0, wheelOffset * side);
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;
        ctx.save();
        ctx.translate(w * 0.20, 0);
        ctx.rotate(spin);
        ctx.fillRect(-w * 0.10, -h * 0.04, w * 0.20, h * 0.08);
        ctx.restore();
        ctx.save();
        ctx.translate(-w * 0.20, 0);
        ctx.rotate(-spin);
        ctx.fillRect(-w * 0.10, -h * 0.04, w * 0.20, h * 0.08);
        ctx.restore();
        ctx.restore();
      });

      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(w * 0.50, 0, w * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = b.glow + '0.85)';
      ctx.beginPath();
      ctx.moveTo(-w * 0.50, -h * 0.18);
      ctx.lineTo(-w * 0.85, 0);
      ctx.lineTo(-w * 0.50, h * 0.18);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      ctx.shadowBlur = 0;
    };

    let lastT = performance.now();
    let raf = 0;
    let visible = true;

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { visible = e.isIntersecting; }),
      { threshold: 0.05 }
    );
    if (containerRef.current) io.observe(containerRef.current);

    const draw = (now: number) => {
      const dt = now - lastT;
      lastT = now;
      if (!visible) {
        raf = requestAnimationFrame(draw);
        return;
      }

      stepAccumulator += dt;
      while (stepAccumulator >= stepMs) {
        stepAccumulator -= stepMs;
        step();
      }
      frameCount++;

      const W = canvas.clientWidth,
        H = canvas.clientHeight;
      const cellW = W / COLS,
        cellH = H / ROWS;

      ctx.clearRect(0, 0, W, H);

      for (const b of bikes) {
        if (b.trail.length < 2) continue;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';

        if (trailStyle === 'dashed') ctx.setLineDash([cellW * 0.6, cellW * 0.25]);
        else ctx.setLineDash([]);
        ctx.strokeStyle = b.glow + '0.28)';
        ctx.lineWidth = cellW * 0.42 * trailScale;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x * cellW + cellW / 2, b.trail[0].y * cellH + cellH / 2);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x * cellW + cellW / 2, b.trail[i].y * cellH + cellH / 2);
        }
        ctx.stroke();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = cellW * 0.09 * trailScale;
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.setLineDash([]);
        if (trailStyle === 'double') {
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = cellW * 0.025 * trailScale;
          ctx.shadowBlur = 0;
          ctx.stroke();
          ctx.strokeStyle = b.glow + '0.85)';
          ctx.globalAlpha = 0.6;
          ctx.lineWidth = cellW * 0.05 * trailScale;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = cellW * 0.025 * trailScale;
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      for (const b of bikes) {
        if (!b.alive) continue;
        drawBike(b, cellW, cellH);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.ring) {
          p.life--;
          p.radius = p.radius! + (p.maxRadius! - p.radius!) * 0.18;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          const a = Math.max(0, p.life / 30);
          ctx.strokeStyle = p.glow + (a * 0.8).toFixed(2) + ')';
          ctx.lineWidth = 2;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius!, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.vy += 0.05;
          p.life--;
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          const a = Math.max(0, p.life / 80);
          ctx.fillStyle = p.glow + a.toFixed(2) + ')';
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size!, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'screen' }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default Lightcycles;
