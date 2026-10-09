import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { riderPose } from './choreography';

const vertex = `varying vec3 vWorld; void main(){ vec4 world=modelMatrix*vec4(position,1.); vWorld=world.xyz; gl_Position=projectionMatrix*viewMatrix*world; }`;

function glowTexture() {
  const size = 64, data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const distance = Math.hypot((x + .5) / size * 2 - 1, (y + .5) / size * 2 - 1);
    const i = (y * size + x) * 4;
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(Math.pow(Math.max(0, 1 - distance), 3) * 255);
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

function modelBike(color: THREE.Color, texture: THREE.Texture) {
  const root = new THREE.Group();
  const chassis = new THREE.MeshStandardMaterial({ color: '#172334', metalness: .7, roughness: .27 });
  const suit = new THREE.MeshStandardMaterial({ color: '#263649', metalness: .35, roughness: .44 });
  const rubber = new THREE.MeshStandardMaterial({ color: '#050b13', roughness: .8 });
  const neon = new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const chrome = new THREE.MeshStandardMaterial({ color: '#9aaec1', metalness: .75, roughness: .23 });
  const tires: THREE.Group[] = [];
  function part(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }
  function box(w: number, h: number, d: number, x: number, y: number, z: number, material = chassis) {
    return part(new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * .22), material, x, y, z);
  }
  function limb(from: number[], to: number[], radius: number, material: THREE.Material) {
    const a = new THREE.Vector3(...from as [number, number, number]), b = new THREE.Vector3(...to as [number, number, number]);
    const mesh = part(new THREE.CylinderGeometry(radius, radius * .82, a.distanceTo(b), 8), material, 0, 0, 0);
    mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  }
  // Wheel axles run across the bike, which faces local -Z.
  for (const z of [-1.38, 1.38]) {
    const wheel = new THREE.Group(); wheel.position.set(0, .68, z); root.add(wheel); tires.push(wheel);
    const tire = part(new THREE.CylinderGeometry(.68, .68, .46, 32), rubber, 0, 0, 0, wheel); tire.rotation.z = Math.PI / 2;
    for (const x of [-.245, .245]) {
      const ring = part(new THREE.TorusGeometry(.54, .042, 8, 40), neon, x, 0, 0, wheel); ring.rotation.y = Math.PI / 2;
      const inner = part(new THREE.TorusGeometry(.4, .015, 6, 32), chrome, x, 0, 0, wheel); inner.rotation.y = Math.PI / 2;
      for (let i = 0; i < 5; i++) {
        const spoke = part(new THREE.BoxGeometry(.04, .055, .91), chrome, x, 0, 0, wheel); spoke.rotation.x = i * Math.PI / 5;
      }
    }
  }
  box(.9, .55, 2.65, 0, .87, .05);
  box(1.02, .47, 1.05, 0, 1.02, -.62).rotation.x = -.18;
  box(.65, .18, 1.1, 0, 1.15, .64, suit);
  box(.72, .16, .72, 0, .77, -1.62).rotation.x = -.16;
  for (const side of [-1, 1]) {
    const strip = part(new THREE.BoxGeometry(.018, .045, 2.2), neon, side * .463, 1.04, .07); strip.rotation.x = -.04;
    limb([side * .28, .74, -1.4], [side * .28, 1.29, -.83], .06, chrome);
    limb([side * .22, .69, 1.38], [side * .28, .82, .65], .065, chassis);
    limb([side * .2, 1.3, .42], [side * .51, .95, -.2], .13, suit);
    limb([side * .51, .95, -.2], [side * .48, .62, .47], .095, suit);
    box(.18, .16, .42, side * .48, .57, .32, rubber);
    limb([side * .27, 1.64, -.22], [side * .43, 1.37, -.63], .085, suit);
    limb([side * .43, 1.37, -.63], [side * .36, 1.23, -1.04], .065, suit);
    limb([side * .293, 1.56, -.18], [side * .44, 1.34, -.59], .015, neon);
  }
  // Racing posture: hips back, chest and helmet tucked over the tank.
  box(.48, .34, .43, 0, 1.33, .38, suit);
  box(.55, .65, .4, 0, 1.59, -.02, suit).rotation.x = -.5;
  const helmet = part(new THREE.SphereGeometry(.275, 24, 16), chassis, 0, 1.99, -.36); helmet.scale.set(.86, 1, 1.08);
  const visor = part(new THREE.SphereGeometry(.282, 24, 8, Math.PI, Math.PI, Math.PI * .34, Math.PI * .21), neon, 0, 1.99, -.36); visor.scale.set(.87, 1, 1.09);
  limb([0, 1.87, .09], [0, 1.32, .55], .019, neon);
  limb([-.38, 1.23, -1.04], [.38, 1.23, -1.04], .045, chrome);
  const headlight = part(new THREE.BoxGeometry(.43, .055, .025), new THREE.MeshBasicMaterial({ color: '#eaffff' }), 0, .87, -1.99);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, blending: THREE.AdditiveBlending, transparent: true, opacity: .36, depthWrite: false }));
  glow.position.copy(headlight.position); glow.scale.set(2.2, 1.2, 1); root.add(glow);
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 4.8), new THREE.MeshBasicMaterial({ map: texture, color, blending: THREE.AdditiveBlending, transparent: true, opacity: .48, depthWrite: false }));
  aura.rotation.x = -Math.PI / 2; aura.position.y = .045; root.add(aura);
  return { root, tires, color, neon, aura, glow };
}

function lightWake(color: THREE.Color, index: number) {
  const count = 100;
  function ribbon(width: number, height: number, opacity: number, wall: boolean) {
    const positions = new Float32Array(count * 2 * 3), uvs = new Float32Array(count * 2 * 2), indices: number[] = [];
    for (let i = 0; i < count; i++) {
      uvs.set([i / (count - 1), 0, i / (count - 1), 1], i * 4);
      if (i < count - 1) { const p = i * 2; indices.push(p, p + 1, p + 2, p + 2, p + 1, p + 3); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2)); geometry.setIndex(indices);
    const material = new THREE.ShaderMaterial({ uniforms: { color: { value: color }, strength: { value: opacity } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform vec3 color; uniform float strength; varying vec2 vUv; void main(){ float age=pow(vUv.x,1.6); float band=${wall ? 'mix(.7,.06,vUv.y)' : 'pow(1.-abs(vUv.y*2.-1.),2.)'}; gl_FragColor=vec4(color,age*band*strength); }`,
      transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false;
    return { mesh, positions, width, height, wall };
  }
  const ribbons = [ribbon(0, .88, .43, true), ribbon(.085, .07, .95, false), ribbon(1.65, .025, .23, false)];
  function update(time: number) {
    for (let i = 0; i < count; i++) {
      const pose = riderPose(time - .74 - (1 - i / (count - 1)) * 7.8, index);
      const nx = Math.cos(pose.yaw), nz = -Math.sin(pose.yaw);
      for (const ribbon of ribbons) {
        const { positions, width, height, wall } = ribbon, p = i * 6;
        positions[p] = pose.x - nx * width / 2; positions[p + 1] = wall ? .065 : height; positions[p + 2] = pose.z - nz * width / 2;
        positions[p + 3] = pose.x + nx * width / 2; positions[p + 4] = wall ? height : height; positions[p + 5] = pose.z + nz * width / 2;
      }
    }
    for (const ribbon of ribbons) ribbon.mesh.geometry.attributes.position.needsUpdate = true;
  }
  return { ribbons, update };
}

export function mountRiderScene(host: HTMLElement, onReady: () => void, onLost: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;'; host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 180);
  camera.position.set(0, 10.5, 25); camera.lookAt(0, .2, -5);
  const ambient = new THREE.HemisphereLight('#cceeff', '#261b45', 2.3); scene.add(ambient);
  const key = new THREE.DirectionalLight('#e0eeff', 4.2); key.position.set(-5, 9, 6); scene.add(key);
  const rim = new THREE.DirectionalLight('#ff9edc', 2.5); rim.position.set(7, 5, -9); scene.add(rim);
  const texture = glowTexture();
  const colors = [new THREE.Color('#00e5d4'), new THREE.Color('#ff0080')];
  const bikes = colors.map(color => modelBike(color, texture));
  const wakes = colors.map((color, index) => lightWake(color, index));
  bikes.forEach(bike => scene.add(bike.root)); wakes.forEach(wake => wake.ribbons.forEach(ribbon => scene.add(ribbon.mesh)));
  const grid = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, cyan: { value: colors[0] }, pink: { value: colors[1] }, strength: { value: .28 } }, vertexShader: vertex,
    fragmentShader: `varying vec3 vWorld; uniform float time; uniform vec3 cyan; uniform vec3 pink; uniform float strength;
      void main(){ vec2 p=vWorld.xz/2.5; vec2 fw=max(fwidth(p),vec2(.0001)); vec2 edges=abs(fract(p-.5)-.5)/fw;
      float lines=1.-min(min(edges.x,edges.y),1.); float fade=smoothstep(-72.,5.,vWorld.z)*(1.-smoothstep(28.,68.,length(vWorld.xz)));
      float pulse=pow(max(0.,1.-abs(mod(vWorld.z+time*2.+55.,44.)-22.)/4.),2.);
      vec3 c=mix(cyan,pink,smoothstep(-16.,16.,vWorld.x)); gl_FragColor=vec4(c,lines*fade*strength*(.72+.28*pulse)); }`,
    transparent: true, depthWrite: false, toneMapped: false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), grid); floor.rotation.x = -Math.PI / 2; floor.position.z = -26; scene.add(floor);
  let disposed = false, visible = true, lost = false, first = true, last = 0, time = 0, lastDraw = 0;
  let pointerX = 0, cameraX = 0;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  function paint() {
    if (disposed || lost) return;
    bikes.forEach((bike, index) => {
      const pose = riderPose(time, index);
      bike.root.position.set(pose.x, 0, pose.z); bike.root.rotation.set(0, pose.yaw, pose.bank, 'YXZ');
      bike.tires.forEach(wheel => { wheel.rotation.x = -time * 3.3; }); wakes[index].update(time);
    });
    grid.uniforms.time.value = time;
    cameraX += (pointerX - cameraX) * .035; camera.position.x = cameraX; camera.lookAt(cameraX * .15, .2, -5);
    renderer.render(scene, camera);
    if (first) { first = false; onReady(); }
  }
  function frame(now: number) {
    if (last) time += Math.min((now - last) / 1000, .05); last = now;
    // Coarse-pointer devices get a lower frame rate without changing speed.
    if (now - lastDraw < (finePointer.matches ? 16 : 32)) return;
    lastDraw = now; paint();
  }
  function run() {
    last = 0; lastDraw = 0;
    renderer.setAnimationLoop(!disposed && !lost && visible && !document.hidden ? frame : null);
  }
  function resize() {
    if (disposed) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, finePointer.matches ? 1.5 : 1.25, Math.sqrt(2_000_000 / (width * height))));
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.fov = width < 600 ? 56 : 38; camera.position.z = width < 600 ? 37 : 25; camera.updateProjectionMatrix(); paint();
  }
  function theme() {
    const style = getComputedStyle(document.documentElement);
    colors[0].set(style.getPropertyValue('--accent').trim() || '#00e5d4'); colors[1].set(style.getPropertyValue('--accent-2').trim() || '#ff0080');
    bikes.forEach((bike, index) => { bike.neon.color.copy(colors[index]); (bike.aura.material as THREE.MeshBasicMaterial).color.copy(colors[index]); bike.glow.material.color.copy(colors[index]); });
    grid.uniforms.strength.value = document.documentElement.dataset.theme === 'light' ? .22 : .28; paint();
  }
  function move(event: PointerEvent) { if (finePointer.matches) pointerX = (event.clientX / window.innerWidth - .5) * 1.4; }
  function resetPointer() { pointerX = 0; }
  function contextLost(event: Event) { event.preventDefault(); lost = true; renderer.setAnimationLoop(null); onLost(); }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? false; run(); }, { threshold: 0 }); visibilityObserver.observe(host);
  const themeObserver = new MutationObserver(theme); themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('visibilitychange', run); window.addEventListener('pointermove', move, { passive: true }); document.addEventListener('pointerleave', resetPointer);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  theme(); resize(); run();
  return () => {
    disposed = true; renderer.setAnimationLoop(null);
    resizeObserver.disconnect(); visibilityObserver.disconnect(); themeObserver.disconnect();
    document.removeEventListener('visibilitychange', run); window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', resetPointer);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
    scene.traverse(object => { if (object instanceof THREE.Mesh) geometries.add(object.geometry); if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) { const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(material => materials.add(material)); } });
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  };
}
