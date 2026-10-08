import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const output = resolve('node_modules/.cache/trendiva-ui-tests.mjs');
await mkdir(resolve('node_modules/.cache'), { recursive: true });
await build({ stdin: { contents: `export { AppRoutes } from './src/App'; export { Builds } from './src/components/Builds'; export { OrderModal } from './src/components/OrderModal'; export { ContactModal, WaitlistModal } from './src/components/Footer'; export { BUILDS } from './src/config/builds'; export { TIER_CONFIGS } from './src/lib/tier-configs';`, resolveDir: process.cwd(), loader: 'tsx' }, outfile: output, bundle: true, format: 'esm', platform: 'node', packages: 'external', jsx: 'automatic', define: { 'import.meta.env': '{}' }, plugins: [{ name: 'markdown', setup(api) {
  api.onResolve({ filter: /\.md\?raw$/ }, args => ({ path: resolve(args.resolveDir, args.path.replace('?raw', '')), namespace: 'raw' }));
  api.onLoad({ filter: /.*/, namespace: 'raw' }, async args => ({ contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))};` }));
} }] });
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://trendivalux.com/' });
globalThis.window = dom.window; globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.localStorage = window.localStorage;
globalThis.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
window.scrollTo = () => {}; window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.setPointerCapture = () => {};
window.HTMLElement.prototype.getBoundingClientRect = () => ({ top: 0, bottom: 500, left: 0, right: 1000, width: 1000, height: 500 });
globalThis.requestAnimationFrame = callback => window.setTimeout(callback, 0);
globalThis.cancelAnimationFrame = id => window.clearTimeout(id);
const { createRoot } = await import('react-dom/client');
const { MemoryRouter } = await import('react-router-dom');
const ui = await import(output);
let root;
async function mount(node, route = '/') {
  globalThis.fetch = async () => Response.json({ remaining: 4 });
  root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(HelmetProvider, null, React.createElement(MemoryRouter, { initialEntries: [route] }, node))); });
}
async function click(element) { assert.ok(element, 'control exists'); await act(async () => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))); }
function button(text) { return [...document.querySelectorAll('button')].find(node => node.textContent.includes(text)); }
async function fill(selector, value) {
  const element = document.querySelector(selector); assert.ok(element, selector);
  const prototype = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  await act(async () => { Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true })); element.dispatchEvent(new window.Event('change', { bubbles: true })); });
}
afterEach(async () => { if (root) await act(async () => root.unmount()); root = null; delete window.openContactModal; delete window.openOrderModal; document.getElementById('root').innerHTML = ''; });
process.on('exit', () => { void rm(output, { force: true }); });

test('all five tier routes render the correct package and working portfolio and home links', async () => {
  for (const [slug, config] of Object.entries(ui.TIER_CONFIGS)) {
    await mount(React.createElement(ui.AppRoutes), `/tiers/${slug}`);
    assert.ok(document.querySelector('h1').textContent.includes(config.name.toUpperCase()));
    for (const example of config.examples) assert.ok(document.querySelector(`a[href="${example.url}"]`), `${slug}: ${example.name}`);
    assert.ok(document.querySelector('a[href="/#process"]')); assert.ok(document.querySelector('a[href="/#faq"]'));
    await act(async () => root.unmount()); root = null; document.getElementById('root').innerHTML = '';
  }
});
test('all legal routes render document content and German/English controls', async () => {
  for (const path of ['/impressum', '/datenschutz', '/agb', '/agb-b2c', '/widerrufsbelehrung']) {
    await mount(React.createElement(ui.AppRoutes), path);
    assert.ok(document.querySelector('h1'), path); assert.ok(document.body.textContent.length > 1000, path);
    assert.ok(document.querySelector('a[href="/"]'), path);
    await act(async () => root.unmount()); root = null; document.getElementById('root').innerHTML = '';
  }
});
test('gallery previews use the exact canonical URL and horizontal wheel changes selection', async () => {
  await mount(React.createElement(ui.Builds));
  for (const build of ui.BUILDS) assert.ok(document.querySelector(`a[href="${build.url}"]`), build.id);
  assert.equal(document.querySelectorAll('iframe').length, 0);
  const stage = document.querySelector('[aria-label="Portfolio gallery"]');
  const current = () => document.querySelector('[aria-pressed="true"]')?.textContent;
  const first = current();
  await act(async () => stage.dispatchEvent(new window.WheelEvent('wheel', { deltaX: 100, bubbles: true, cancelable: true })));
  assert.notEqual(current(), first);
  const second = current();
  await act(async () => stage.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 100, bubbles: true, cancelable: true })));
  assert.equal(current(), second, 'vertical page scrolling is preserved');
});
test('gallery keyboard works only when focus is inside its region', async () => {
  await mount(React.createElement(ui.Builds));
  const current = () => document.querySelector('[aria-pressed="true"]')?.textContent;
  const initial = current();
  await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  assert.equal(current(), initial);
  document.querySelector('[aria-label="Portfolio gallery"]').focus();
  await act(async () => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  assert.notEqual(current(), initial);
});
test('gallery ordinary clicks retain native link navigation and dragging suppresses accidental navigation', async () => {
  await mount(React.createElement(ui.Builds));
  const anchor = document.querySelector('a[aria-label="Open KNZN"]');
  const stage = document.querySelector('[aria-label="Portfolio gallery"]');
  const pointer = (type, x) => { const event = new window.MouseEvent(type, { bubbles: true, clientX: x, clientY: 10, button: 0 }); Object.defineProperty(event, 'pointerId', { value: 1 }); return event; };
  await act(async () => { anchor.dispatchEvent(pointer('pointerdown', 10)); anchor.dispatchEvent(pointer('pointerup', 10)); });
  const normal = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  anchor.addEventListener('click', event => event.preventDefault(), { once: true });
  let reachedAnchor = false; anchor.addEventListener('click', () => { reachedAnchor = true; }, { once: true });
  await act(async () => anchor.dispatchEvent(normal)); assert.equal(reachedAnchor, true);
  await act(async () => { anchor.dispatchEvent(pointer('pointerdown', 10)); stage.dispatchEvent(pointer('pointermove', 120)); });
  await act(async () => stage.dispatchEvent(pointer('pointerup', 120)));
  const dragClick = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  await act(async () => anchor.dispatchEvent(dragClick)); assert.equal(dragClick.defaultPrevented, true);
});
test('agreement form validates missing customer data before making requests', async () => {
  await mount(React.createElement(ui.OrderModal, { open: true, onClose() {}, initialTier: 'store' }));
  await click(button('LUX')); await click(button('In full')); await click(button('Continue')); let requests = 0;
  globalThis.fetch = async () => { requests++; return new Response('Unavailable', { status: 503 }); };
  await click(button('Send My Offer')); assert.equal(requests, 0);
  assert.ok(document.body.textContent.includes('name') || document.body.textContent.includes('Kundentyp'));
});
test('contact delivery failure preserves customer inputs and never displays false success', async () => {
  await mount(React.createElement(ui.ContactModal, { open: true, onClose() {} }));
  await fill('input[aria-label="Your name"]', 'Client'); await fill('input[aria-label="Your email"]', 'client@example.com'); await fill('textarea', 'Project details');
  globalThis.fetch = async () => new Response('Delivery unavailable', { status: 503 });
  await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
  assert.ok(document.querySelector('[role="alert"]')); assert.equal(document.querySelector('textarea').value, 'Project details');
  assert.equal(document.body.textContent.includes('Message sent'), false);
});
test('invalid checkout and confirmation URLs do not claim payment or expose onboarding', async () => {
  for (const route of ['/checkout/invalid', '/success', '/scoping/invalid']) {
    await mount(React.createElement(ui.AppRoutes), route);
    assert.equal(document.body.textContent.includes('ORDER CONFIRMED'), false);
    assert.equal(document.body.textContent.includes('Complete Your Project Brief →'), false);
    assert.equal(document.querySelector('form'), null);
    await act(async () => root.unmount()); root = null; document.getElementById('root').innerHTML = '';
  }
});


test('successful order shows inbox guidance and offers a signing link before any payment or brief', async () => {
  await mount(React.createElement(ui.OrderModal, { open: true, onClose() {}, initialTier: 'landing' }));
  await click(button('LUX')); await click(button('4 monthly payments')); await click(button('Continue'));
  await click(button('Unternehmen')); await fill('input[aria-label="Jane Doe"]', 'Client'); await fill('input[aria-label="jane@business.com"]', 'client@example.com');
  let sent;
  globalThis.fetch = async (url, options) => { sent=JSON.parse(options.body); return Response.json({signingUrl:'https://sign.example/s/order'}); };
  await click(button('Send My Offer'));
  assert.equal(sent.serviceLevel,'lux'); assert.equal(sent.paymentPlan,'monthly4');
  assert.match(document.body.textContent,/CHECK YOUR EMAIL/); assert.ok(document.querySelector('a[href="https://sign.example/s/order"]'));
  assert.equal(document.querySelector('a[href*="/scoping/"]'),null);
});
