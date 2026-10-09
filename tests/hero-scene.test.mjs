import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const output = resolve('node_modules/.cache/trendiva-hero-scene-tests.mjs');
await mkdir(resolve('node_modules/.cache'), { recursive: true });
await build({ entryPoints: ['src/components/hero-riders/scene.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', packages: 'external' });
const { mountRiderScene } = await import(output);
process.on('exit', () => { void rm(output, { force: true }); });

test('software 3D fallback renders finite geometry, pauses offscreen, resumes without catch-up and releases its loop', () => {
  const dom = new JSDOM('<div id="scene"></div>');
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  globalThis.getComputedStyle = window.getComputedStyle.bind(window);
  window.matchMedia = () => ({ matches: false });
  const host = document.getElementById('scene');
  Object.defineProperty(host, 'clientWidth', { value: 1348 }); Object.defineProperty(host, 'clientHeight', { value: 650 });
  let fills = 0, fingerprint = 0;
  const point = (x, y) => { assert.ok(Number.isFinite(x) && Number.isFinite(y), 'projected vertices remain finite'); fingerprint += x + y; };
  const ctx = { setTransform() {}, clearRect() { fingerprint = 0; }, beginPath() {}, moveTo: point, lineTo: point, stroke() {}, closePath() {}, fill() { fills++; }, fillRect() {}, createRadialGradient() { return { addColorStop() {} }; } };
  window.HTMLCanvasElement.prototype.getContext = mode => mode === '2d' ? ctx : null;
  const frames = new Map(); let frameId = 0;
  globalThis.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  const observers = [];
  globalThis.IntersectionObserver = class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() { this.disconnected = true; } };
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.MutationObserver = window.MutationObserver;
  let mode;
  const cleanup = mountRiderScene(host, value => { mode = value; }, () => assert.fail('the software scene should not lose its context'));
  assert.equal(mode, 'canvas'); assert.ok(fills > 100, 'actual bike mesh triangles were drawn'); assert.equal(frames.size, 1);
  function frame(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); }
  frame(1000); frame(1034); const beforePause = fingerprint;
  observers[0].callback([{ isIntersecting: false }]); assert.equal(frames.size, 0); assert.equal(host.querySelector('canvas').dataset.motion, 'paused');
  observers[0].callback([{ isIntersecting: true }]); frame(900000);
  assert.equal(fingerprint, beforePause, 'time spent offscreen does not advance or fast-forward the scene');
  assert.equal(host.querySelector('canvas').dataset.motion, 'playing');
  cleanup(); assert.equal(frames.size, 0); assert.equal(host.querySelector('canvas'), null); assert.equal(observers[0].disconnected, true);
  document.dispatchEvent(new window.Event('visibilitychange')); assert.equal(frames.size, 0); dom.window.close();
});
