import * as THREE from 'three';
import { riderPose } from './choreography';

// Project the actual bike meshes through the same Three.js camera when a device
// cannot create WebGL. No video, image downloads, or extra graphics dependency.
export function createSoftwareRenderer(canvas: HTMLCanvasElement, roots: THREE.Group[], colors: THREE.Color[]) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('Canvas rendering unavailable');
  let width = 1, height = 1, ratio = 1;
  const projection = new THREE.Matrix4(), matrix = new THREE.Matrix4(), normalMatrix = new THREE.Matrix3();
  const point = new THREE.Vector3(), normal = new THREE.Vector3(), light = new THREE.Vector3(-.4, .8, .5).normalize();
  const meshes: { mesh: THREE.Mesh; points: Float32Array; faces: number[]; normal: THREE.BufferAttribute; }[] = [];
  roots.forEach(root => root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshStandardMaterial || object.material instanceof THREE.MeshBasicMaterial) || object.material.map) return;
    const geometry = object.geometry;
    const positions = geometry.getAttribute('position');
    const faces = Array.from({ length: geometry.index ? geometry.index.count : positions.count }, (_, i) => geometry.index ? geometry.index.getX(i) : i);
    meshes.push({ mesh: object, points: new Float32Array(positions.count * 3), faces, normal: geometry.getAttribute('normal') as THREE.BufferAttribute });
  }));
  const faces: { depth: number; ax: number; ay: number; bx: number; by: number; cx: number; cy: number; color: string }[] = [];
  function project(x: number, y: number, z: number) {
    point.set(x, y, z).applyMatrix4(projection);
    return { x: (point.x * .5 + .5) * width, y: (-point.y * .5 + .5) * height };
  }
  function line(a: number[], b: number[], color: string, alpha: number, size = 1) {
    const start = project(a[0], a[1], a[2]), end = project(b[0], b[1], b[2]);
    ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = size;
    ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
  }
  function render(camera: THREE.PerspectiveCamera, time: number, routeScale: number, routeOffset: number) {
    camera.updateMatrixWorld(); projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over';
    const palette = colors.map(color => '#' + color.getHexString(THREE.SRGBColorSpace));
    for (let x = -65; x <= 65; x += 2.5) line([x, 0, -65], [x, 0, 18], palette[x < 0 ? 0 : 1], .15, .6);
    for (let z = -65; z <= 18; z += 2.5) {
      const fade = Math.max(0, (z + 65) / 83);
      const pulse = Math.max(0, 1 - Math.abs(((z + time * 2 + 110) % 44) - 22) / 4);
      line([-65, 0, z], [0, 0, z], palette[0], fade * (.16 + .15 * pulse), .65);
      line([0, 0, z], [65, 0, z], palette[1], fade * (.16 + .15 * pulse), .65);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 2; index++) {
      const color = palette[index];
      for (let i = 0; i < 65; i++) {
        const age = i / 65, a = riderPose(time - .74 - (1 - age) * 7.8, index), b = riderPose(time - .74 - (1 - (i + 1) / 65) * 7.8, index);
        const ax = (a.x - routeOffset) * routeScale, bx = (b.x - routeOffset) * routeScale;
        const bottomA = project(ax, .07, a.z), topA = project(ax, .88, a.z);
        const bottomB = project(bx, .07, b.z), topB = project(bx, .88, b.z);
        ctx.globalAlpha = age * age * .19; ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(bottomA.x, bottomA.y); ctx.lineTo(topA.x, topA.y); ctx.lineTo(topB.x, topB.y); ctx.lineTo(bottomB.x, bottomB.y); ctx.closePath(); ctx.fill();
        line([ax, .04, a.z], [bx, .04, b.z], color, age * age * .1, 12);
        line([ax, .07, a.z], [bx, .07, b.z], color, age * age * .85, 1.8);
        line([ax, .88, a.z], [bx, .88, b.z], color, age * age * .35, .7);
      }
      const pose = riderPose(time, index), center = project((pose.x - routeOffset) * routeScale, .03, pose.z);
      const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, width < 600 ? 40 : 65);
      glow.addColorStop(0, color + '55'); glow.addColorStop(1, color + '00');
      ctx.globalAlpha = .6; ctx.fillStyle = glow; ctx.fillRect(center.x - 70, center.y - 70, 140, 140);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    let faceCount = 0;
    roots.forEach(root => root.updateMatrixWorld(true));
    for (const { mesh, points, faces: indices, normal: normals } of meshes) {
      const positions = mesh.geometry.getAttribute('position');
      matrix.multiplyMatrices(projection, mesh.matrixWorld); normalMatrix.getNormalMatrix(mesh.matrixWorld);
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(matrix);
        points[i * 3] = (point.x * .5 + .5) * width; points[i * 3 + 1] = (-point.y * .5 + .5) * height; points[i * 3 + 2] = point.z;
      }
      const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
      const base = material.color.clone().convertLinearToSRGB();
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
        const ax = points[a], ay = points[a + 1], bx = points[b], by = points[b + 1], cx = points[c], cy = points[c + 1];
        if ((bx - ax) * (cy - ay) - (by - ay) * (cx - ax) >= 0) continue;
        if (points[a + 2] > 1 || points[b + 2] > 1 || points[c + 2] > 1) continue;
        if (Math.max(ax, bx, cx) < 0 || Math.min(ax, bx, cx) > width || Math.max(ay, by, cy) < 0 || Math.min(ay, by, cy) > height) continue;
        const shade = material instanceof THREE.MeshBasicMaterial ? 1 : .65 + Math.max(0, normal.fromBufferAttribute(normals, indices[i]).applyMatrix3(normalMatrix).normalize().dot(light)) * .8;
        const face = faces[faceCount] ||= { depth: 0, ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0, color: '' };
        Object.assign(face, { depth: points[a + 2] + points[b + 2] + points[c + 2], ax, ay, bx, by, cx, cy,
          color: `rgb(${Math.min(255, Math.round(base.r * 255 * shade))},${Math.min(255, Math.round(base.g * 255 * shade))},${Math.min(255, Math.round(base.b * 255 * shade))})` });
        faceCount++;
      }
    }
    const visible = faces.slice(0, faceCount).sort((a, b) => b.depth - a.depth);
    for (const face of visible) {
      ctx.fillStyle = face.color; ctx.beginPath(); ctx.moveTo(face.ax, face.ay); ctx.lineTo(face.bx, face.by); ctx.lineTo(face.cx, face.cy); ctx.closePath(); ctx.fill();
    }
  }
  return { render, resize(w: number, h: number, dpr: number) { width = w; height = h; ratio = Math.min(dpr, 1.25); canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); } };
}
