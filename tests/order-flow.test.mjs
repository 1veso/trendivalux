import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { build } from 'esbuild';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Execute the real Pages handlers with isolated, in-memory provider doubles.
// No test creates an agreement, sends email, or charges a payment provider.
const directory = await mkdtemp(join(tmpdir(), 'trendiva-flow-'));
const handlers = {};
for (const endpoint of ['create-docuseal-contract', 'create-checkout-session', 'docuseal-webhook', 'stripe-webhook', 'order-status', 'scoping-context', 'save-scoping', 'contact', 'capture-lead', 'availability', 'review-offer', 'request-balance', 'health', 'project-file']) {
  const outfile = join(directory, `${endpoint}.mjs`);
  await build({ entryPoints: [`functions/api/${endpoint}.ts`], outfile, bundle: true, platform: 'node', format: 'esm', plugins: [{
    name: 'providers', setup(api) {
      api.onResolve({ filter: /supabase-admin|stripe-client|^resend$/ }, args => ({ path: args.path, namespace: 'provider' }));
      api.onLoad({ filter: /.*/, namespace: 'provider' }, args => ({ contents:
        args.path.includes('supabase') ? 'export const createAdminClient = () => globalThis.flow.db;' :
        args.path.includes('stripe') ? 'export const createStripeClient = () => globalThis.flow.stripe;' :
        'export class Resend { constructor() { this.emails = {send: async (payload, options) => globalThis.flow.send(payload, options)}; } }',
      }));
    },
  }] });
  handlers[endpoint] = await import(outfile);
}
process.on('exit', () => { void rm(directory, { recursive: true, force: true }); });
const id = '11111111-1111-4111-8111-111111111111';
const token = '22222222-2222-4222-8222-222222222222';
const sessionId = '33333333-3333-4333-8333-333333333333';
const env = { SITE_URL: 'https://trendivalux.com', DOCUSEAL_API_URL: 'https://sign.example/api', DOCUSEAL_API_KEY: 'test-only', DOCUSEAL_TEMPLATE_ID_B2B: '10', DOCUSEAL_TEMPLATE_ID_B2C: '20', DOCUSEAL_SIGNER_ROLE: 'Client', DOCUSEAL_WEBHOOK_SECRET: 'test-hmac', FOUNDER_EMAIL: 'founder@example.com', RESEND_API_KEY: 'test-only', STRIPE_SECRET_KEY: 'sk_live_mock_only', STRIPE_WEBHOOK_SECRET: 'test-only' };
const offerFields = ['customer_name', 'tier_name', 'total_price_eur', 'deposit_paid_eur', 'final_payment_eur', 'deliverables_list', 'delivery_timeline', 'order_id'];
let flow;
class Query {
  constructor(table) { this.table = table; this.filters = []; this.action = 'read'; }
  select(_columns, options) { this.options = options; return this; }
  eq(key, value) { this.filters.push(row => row[key] === value); return this; }
  is(key, value) { this.filters.push(row => value === null ? row[key] == null : row[key] === value); return this; }
  limit() { return this; }
  in(key, values) { this.filters.push(row => values.includes(row[key])); return this; }
  gte(key, value) { this.filters.push(row => row[key] >= value); return this; }
  update(values) { this.action = 'update'; this.values = values; return this; }
  insert(values) { this.action = 'insert'; this.values = values; return this; }
  upsert(values) { this.action = 'upsert'; this.values = values; return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.one = true; return this; }
  then(resolve, reject) {
    return Promise.resolve().then(() => {
      if (flow.dbError) return { data: null, error: { message: 'Database failure' } };
      const rows = flow.tables[this.table] ||= [];
      let selected = rows.filter(row => this.filters.every(predicate => predicate(row)));
      if (this.action === 'insert') {
        const row = { id, ...this.values }; rows.push(row); selected = [row];
      } else if (this.action === 'upsert') {
        let row = rows.find(row => row.session_id === this.values.session_id);
        if (!row) { row = {}; rows.push(row); } Object.assign(row, this.values); selected = [row];
      } else if (this.action === 'update') { selected.forEach(row => Object.assign(row, this.values)); }
      return { data: this.one ? (selected[0] ? structuredClone(selected[0]) : null) : structuredClone(selected), error: null, count: selected.length };
    }).then(resolve, reject);
  }
}
beforeEach(() => {
  flow = globalThis.flow = {
    tables: { orders: [{ id, checkout_token: token, tier: 'landing', status: 'contract_sent', contract_status: 'sent', contract_docuseal_id: '100', deposit_amount_cents: 99500, total_price_cents: 199000, customer_name: 'Test Client', customer_email: 'client@example.com', stripe_session_id: null, service_level: 'lux', payment_plan: 'split', payment_schedule: [99500, 99500], paid_amount_cents: 0, quote_review_token: sessionId }], questionnaires: [{ session_id: sessionId, converted_to_order_id: id, answers: {} }] },
    db: { from: table => new Query(table), storage: {from: () => ({upload: async (path, bytes) => { flow.pdfs[path]=bytes; return {data:{path},error:null}; },createSignedUrl:async(path)=>({data:{signedUrl:'https://storage.example/signed-file'},error:null}),download: async path => ({data:new Blob([flow.pdfs[path]]),error:null})})}, rpc: async (_name, input) => {
      if(flow.dbError) return {error:{message:'Database failure'}};
      if(flow.ledger.has(input.p_reference)) return {data:false,error:null};
      const order=flow.tables.orders.find(row=>row.id===input.p_order_id);
      if(order.paid_amount_cents+input.p_amount>order.total_price_cents) return {error:{message:'Overpayment'}};
      flow.ledger.add(input.p_reference); order.paid_amount_cents+=input.p_amount; order.status='contract_signed_deposit_paid'; return {data:true,error:null};
    }}, pdfs:{}, ledger:new Set(), created: [], emails: [], docuseal: [], schedules: [],
    send: async (payload, options) => { flow.emails.push({ payload, options }); return flow.emailError ? { error: { message: 'Delivery failure' } } : { data: { id: 'email-1' }, error: null }; },
    stripe: { taxRates: {create:async()=>({id:'txr_mock'})}, products:{create:async()=>({id:'prod_mock'})}, paymentIntents:{retrieve:async()=>({payment_method:'pm_mock'})}, subscriptionSchedules:{list:async()=>({data:[]}),create:async(payload,options)=>{flow.schedules.push({payload,options});return {id:'sub_sched_mock'};},cancel:async()=>({})}, checkout: { sessions: {
      create: async (payload, options) => { flow.created.push({ payload, options }); return { id: 'cs_test', url: 'https://checkout.stripe.com/mock-only', livemode: flow.testCheckout ? false : true }; },
      retrieve: async () => ({livemode:true,...(flow.existingSession || { status: 'expired' })}),
    } }, webhooks: { constructEventAsync: async () => { if (flow.badStripeSignature) throw new Error('Bad signature'); return {livemode:true,...flow.event}; } } },
  };
  globalThis.fetch = async (url, options) => {
    const path=String(url).split('trendivalux.com/')[1];
    if(path?.startsWith('offer-fonts/') || path?.startsWith('portfolio/')) return new Response(await readFile(`public/${path}`));
    flow.docuseal.push({ url, options });
    if(String(url).includes('/submitters?')) return Response.json({data:[]});
    if (String(url).includes('/templates/')) return Response.json(flow.template || { submitters: [{ name: 'Client', uuid: 'client' }], fields: [...offerFields.map(name => ({ name, type: 'text', submitter_uuid: 'client' })), { name: 'Signature', type: 'signature', submitter_uuid: 'client' }] });
    if (options?.method === 'POST') return Response.json([{ submission_id: 100, embed_src: 'https://sign.example/s/test-only' }]);
    return Response.json({ submitters: [{ external_id: id, status: flow.signatureCompleted ? 'completed' : 'sent', completed_at: '2026-10-08T10:00:00Z' }] });
  };
});
async function post(endpoint, body, headers = {}) {
  return handlers[endpoint].onRequestPost({ env, request: new Request(`https://trendivalux.com/api/${endpoint}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': crypto.randomUUID(), ...headers } }) });
}
async function get(endpoint, query) {
  return handlers[endpoint].onRequestGet({ env, request: new Request(`https://trendivalux.com/api/${endpoint}?${new URLSearchParams(query)}`, { headers: { 'CF-Connecting-IP': crypto.randomUUID() } }) });
}
function signedBody(event, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(event);
  return `${timestamp}.${createHmac('sha256', env.DOCUSEAL_WEBHOOK_SECRET).update(`${timestamp}.${raw}`).digest('hex')}`;
}
const contractInput = { sessionId, tier: 'landing', customerName: 'Test Client', customerEmail: 'client@example.com', customerType: 'b2b', serviceLevel:'lux', paymentPlan:'split' };
const signatureEvent = { event_type: 'form.completed', data: { external_id: id, submission_id: 100, completed_at: '2026-10-08T10:00:00Z' } };
const paymentSession = { id: 'cs_test', metadata: { order_id: id }, payment_status: 'paid', currency: 'eur', amount_total: 99500, payment_intent: 'pi_test' };

test('B2B and B2C offers contain a three-page immutable PDF, with email and automatic checkout redirect', async () => {
  for (const customerType of ['b2b', 'b2c']) {
    flow.tables.orders=[];
    const response=await post('create-docuseal-contract',{...contractInput,customerType,depositAmount:1});
    assert.equal(response.status,200);
    const submission=JSON.parse(flow.docuseal.findLast(call=>call.options?.method==='POST').options.body);
    assert.equal(submission.send_email,false); assert.match(submission.completed_redirect_url,/\/checkout\/.+\?token=/);
    assert.ok(submission.documents[0].file.startsWith('JVBER')); assert.equal(submission.documents[0].fields.filter(field=>field.type==='signature').length,1);
    assert.ok(submission.documents[0].fields.every(field=>field.type!=='payment'));
    assert.equal(flow.tables.orders[0].total_price_cents,236810); assert.equal(flow.tables.orders[0].deposit_amount_cents,118405);
    assert.ok(flow.emails.find(email=>email.payload.attachments?.[0]?.filename.endsWith('.pdf')));
    assert.equal(flow.created.length,0);
  }
});
test('agreement delivery retries reuse the same order and signing link', async () => {
  flow.tables.orders=[];flow.emailError=true;
  assert.equal((await post('create-docuseal-contract',contractInput)).status,503);
  flow.emailError=false;
  assert.equal((await post('create-docuseal-contract',contractInput)).status,200);
  assert.equal(flow.tables.orders.length,1);assert.equal(flow.docuseal.filter(call=>call.options?.method==='POST').length,1);
});
test('DELUXE requests wait for a reviewed scope and price, without opening Stripe', async () => {
  flow.tables.orders=[];
  assert.equal((await post('create-docuseal-contract',{...contractInput,serviceLevel:'deluxe'})).status,200);
  const order=flow.tables.orders[0]; assert.equal(order.status,'quote_requested'); assert.equal(flow.created.length,0);assert.equal(flow.docuseal.length,0);
  assert.equal((await post('review-offer',{orderId:order.id,token:order.quote_review_token,netCents:329000,scope:['Ten content pages','Three correction rounds'],timeline:'21 Tage'})).status,200);
  assert.equal(order.total_price_cents,391510); assert.equal(order.status,'contract_sent');
});
test('unsigned agreements cannot create checkout', async () => {
  const response = await post('create-checkout-session', { orderId: id, token });
  assert.equal(response.status, 409); assert.equal((await response.json()).pendingSignature, true); assert.equal(flow.created.length, 0);
});
test('delayed signing webhook is reconciled through authenticated DocuSeal API and stored deposit', async () => {
  flow.signatureCompleted = true;
  const response = await post('create-checkout-session', { orderId: id, token, amount: 1, tier: 'webapp' });
  assert.equal(response.status, 200);
  assert.equal(flow.created[0].payload.line_items[0].price_data.unit_amount, 99500);
  assert.equal(flow.tables.orders[0].status, 'contract_signed');
  assert.match(flow.created[0].payload.cancel_url, /cancelled=true/);
  assert.match(flow.created[0].options.idempotencyKey, /^signed-order-/);
  assert.equal(flow.tables.orders.length, 1);
});
test('returning customers reuse open Stripe sessions without a second order or charge', async () => {
  Object.assign(flow.tables.orders[0], { contract_status: 'signed', stripe_session_id: 'cs_test' });
  flow.existingSession = { status: 'open', url: 'https://checkout.stripe.com/existing' };
  assert.equal((await (await post('create-checkout-session', { orderId: id, token })).json()).checkoutUrl, flow.existingSession.url);
  assert.equal(flow.created.length, 0);
});
test('incorrect tokens, cancelled orders, and refunded orders cannot enter checkout', async () => {
  assert.equal((await post('create-checkout-session', { orderId: id, token: sessionId })).status, 404);
  for (const status of ['cancelled', 'refunded']) { flow.tables.orders[0].status = status; assert.equal((await post('create-checkout-session', { orderId: id, token })).status, 409); }
});
test('DocuSeal timestamped HMAC accepts authentic signatures without granting onboarding', async () => {
  const response = await post('docuseal-webhook', signatureEvent, { 'X-Docuseal-Signature': signedBody(signatureEvent) });
  assert.equal(response.status, 200); assert.equal(flow.tables.orders[0].status, 'contract_signed');
  assert.match(flow.emails[0].payload.html, /checkout/);
  assert.equal((await get('scoping-context', { order_id: id, token })).status, 404);
});
test('DocuSeal rejects tampered, stale, and legacy un-timestamped signatures', async () => {
  for (const signature of [signedBody({ ...signatureEvent, event_type: 'other' }), signedBody(signatureEvent, Math.floor(Date.now() / 1000) - 301), createHmac('sha256', env.DOCUSEAL_WEBHOOK_SECRET).update(JSON.stringify(signatureEvent)).digest('hex')]) {
    assert.equal((await post('docuseal-webhook', signatureEvent, { 'X-Docuseal-Signature': signature })).status, 401);
  }
  assert.equal(flow.tables.orders[0].status, 'contract_sent');
});
test('completion for a different DocuSeal submission cannot sign an order', async () => {
  const event = { ...signatureEvent, data: { ...signatureEvent.data, submission_id: 999 } };
  assert.equal((await post('docuseal-webhook', event, { 'X-Docuseal-Signature': signedBody(event) })).status, 400);
});
test('failed checkout emails are retried and acknowledged only after successful delivery', async () => {
  flow.emailError = true;
  assert.equal((await post('docuseal-webhook', signatureEvent, { 'X-Docuseal-Signature': signedBody(signatureEvent) })).status, 500);
  assert.equal(flow.tables.orders[0].checkout_invite_sent_at, undefined);
  flow.emailError = false;
  assert.equal((await post('docuseal-webhook', signatureEvent, { 'X-Docuseal-Signature': signedBody(signatureEvent) })).status, 200);
  assert.ok(flow.tables.orders[0].checkout_invite_sent_at);
  const sent = flow.emails.length;
  await post('docuseal-webhook', signatureEvent, { 'X-Docuseal-Signature': signedBody(signatureEvent) });
  assert.equal(flow.emails.length, sent);
});
test('only matching cleared Stripe payment unlocks onboarding; duplicate delivery sends once', async () => {
  Object.assign(flow.tables.orders[0], { contract_status: 'signed', stripe_session_id: 'cs_test' });
  flow.event = { id: 'evt_test', type: 'checkout.session.completed', data: { object: paymentSession } };
  assert.equal((await post('stripe-webhook', {}, { 'stripe-signature': 'test' })).status, 200);
  assert.equal(flow.tables.orders[0].status, 'contract_signed_deposit_paid');
  assert.equal(flow.emails.length, 2);
  assert.match(flow.emails[0].payload.html, /\/scoping\/.+\?token=/);
  assert.equal((await (await get('order-status', { order_id: id, token })).json()).confirmed, true);
  assert.equal((await (await get('scoping-context', { order_id: id, token })).json()).ready, true);
  await post('stripe-webhook', {}, { 'stripe-signature': 'test' }); assert.equal(flow.emails.length, 2);
});
test('unpaid SEPA completion does not unlock onboarding or send payment confirmation', async () => {
  flow.event = { type: 'checkout.session.completed', data: { object: { ...paymentSession, payment_status: 'unpaid' } } };
  await post('stripe-webhook', {}, { 'stripe-signature': 'test' });
  assert.equal(flow.tables.orders[0].status, 'contract_sent'); assert.equal(flow.emails.length, 0);
});
test('Stripe mismatched amount, session, or currency never count as payment', async () => {
  Object.assign(flow.tables.orders[0], { contract_status: 'signed', stripe_session_id: 'cs_test' });
  for (const changed of [{ amount_total: 1 }, { id: 'cs_other' }, { currency: 'usd' }]) {
    flow.event = { type: 'checkout.session.completed', data: { object: { ...paymentSession, ...changed } } };
    assert.equal((await post('stripe-webhook', {}, { 'stripe-signature': 'test' })).status, 500);
  }
  assert.equal(flow.tables.orders[0].status, 'contract_sent'); assert.equal(flow.emails.length, 0);
});
test('Stripe email failure retries after payment has already been recorded', async () => {
  Object.assign(flow.tables.orders[0], { contract_status: 'signed', stripe_session_id: 'cs_test' });
  flow.event = { type: 'checkout.session.async_payment_succeeded', data: { object: paymentSession } }; flow.emailError = true;
  assert.equal((await post('stripe-webhook', {}, { 'stripe-signature': 'test' })).status, 500);
  assert.equal(flow.tables.orders[0].status, 'contract_signed_deposit_paid');
  flow.emailError = false;
  assert.equal((await post('stripe-webhook', {}, { 'stripe-signature': 'test' })).status, 200);
  assert.ok(flow.tables.orders[0].deposit_confirmation_sent_at); assert.ok(flow.tables.orders[0].founder_kickoff_sent_at);
});
test('failed bank payments allow a new checkout with the same signed amount', async () => {
  Object.assign(flow.tables.orders[0], { contract_status: 'signed', stripe_session_id: 'cs_test' });
  flow.event = { type: 'checkout.session.async_payment_failed', data: { object: paymentSession } };
  await post('stripe-webhook', {}, { 'stripe-signature': 'test' }); assert.equal(flow.tables.orders[0].status, 'payment_failed');
  flow.existingSession = { status: 'complete', payment_status: 'unpaid' };
  assert.equal((await post('create-checkout-session', { orderId: id, token })).status, 200); assert.equal(flow.created.length, 1);
});
test('direct onboarding reads and writes require cleared payment and matching token', async () => {
  assert.equal((await post('save-scoping', { orderId: id, token, scoping: {} })).status, 403);
  flow.tables.orders[0].status = 'contract_signed_deposit_paid';
  assert.equal((await get('scoping-context', { order_id: id, token: sessionId })).status, 404);
  assert.equal((await post('save-scoping', { orderId: id, token: sessionId, scoping: {} })).status, 404);
});
test('contact reports delivery errors and accepts multiline messages as plain text', async () => {
  const message = { name: 'Client', email: 'client@example.com', message: 'A project\nwith details <and content>' };
  assert.equal((await post('contact', message)).status, 200); assert.equal(flow.emails[0].payload.replyTo, message.email);
  flow.emailError = true; assert.equal((await post('contact', message)).status, 503);
  assert.equal((await post('contact', { ...message, email: 'invalid' })).status, 400);
});
test('availability counts cleared orders only and returns unknown during database failures', async () => {
  flow.tables.orders[0].created_at = new Date().toISOString();
  assert.equal((await (await get('availability', {})).json()).remaining, 4);
  flow.tables.orders[0].status = 'contract_signed_deposit_paid';
  assert.equal((await (await get('availability', {})).json()).remaining, 3);
  flow.dbError = true; assert.equal((await get('availability', {})).status, 503);
});

test('production refuses test keys, sessions and webhook events',async()=>{
  flow.tables.orders[0].contract_status='signed';
  flow.testCheckout=true;assert.equal((await post('create-checkout-session',{orderId:id,token})).status,500);
  flow.event={livemode:false,type:'checkout.session.completed',data:{object:paymentSession}};
  assert.equal((await post('stripe-webhook',{}, {'stripe-signature':'mock'})).status,400);
  const secret=env.STRIPE_SECRET_KEY;env.STRIPE_SECRET_KEY='sk_test_mock';
  assert.equal((await post('create-checkout-session',{orderId:id,token})).status,500);env.STRIPE_SECRET_KEY=secret;
});
test('full and monthly plans use their signed gross amount, never a hardcoded deposit',async()=>{
  const order=flow.tables.orders[0];order.contract_status='signed';
  for(const plan of ['full','monthly4']){
    order.payment_plan=plan;order.payment_schedule=plan==='full'?[199000]:[49750,49750,49750,49750];order.deposit_amount_cents=order.payment_schedule[0];order.stripe_session_id=null;
    assert.equal((await post('create-checkout-session',{orderId:id,token})).status,200);
    const payload=flow.created.at(-1).payload;assert.equal(payload.line_items[0].price_data.unit_amount,order.deposit_amount_cents);assert.equal(payload.line_items[0].price_data.tax_behavior,'inclusive');
    if(plan==='monthly4'){assert.equal(payload.payment_intent_data.setup_future_usage,'off_session');assert.match(payload.custom_text.submit.message,/ends automatically/);}
  }
});
test('four-payment plan schedules exactly three future charges and never repeats on webhook retry',async()=>{
  const order=flow.tables.orders[0];Object.assign(order,{contract_status:'signed',payment_plan:'monthly4',payment_schedule:[99500,99500,99500,99500],total_price_cents:398000,stripe_session_id:'cs_test'});
  flow.event={type:'checkout.session.completed',data:{object:{...paymentSession,customer:'cus_mock',created:1791453600}}};
  assert.equal((await post('stripe-webhook',{}, {'stripe-signature':'mock'})).status,200);
  assert.equal(flow.schedules.length,1);assert.equal(flow.schedules[0].payload.end_behavior,'cancel');assert.deepEqual(flow.schedules[0].payload.phases.map(phase=>phase.duration.interval_count),[2,1]);
  await post('stripe-webhook',{}, {'stripe-signature':'mock'});assert.equal(flow.schedules.length,1);assert.equal(order.paid_amount_cents,99500);
  for(let i=0;i<3;i++){
    flow.event={type:'invoice.payment_succeeded',data:{object:{id:`in_${i}`,status:'paid',currency:'eur',amount_paid:99500,customer:'cus_mock',parent:{subscription_details:{metadata:{order_id:id}}}}}};
    assert.equal((await post('stripe-webhook',{}, {'stripe-signature':'mock'})).status,200);
    await post('stripe-webhook',{}, {'stripe-signature':'mock'});
  }
  assert.equal(order.paid_amount_cents,398000);assert.equal(flow.emails.length,2);
});
test('50/50 balance email and checkout require private links and a confirmed first payment',async()=>{
  const order=flow.tables.orders[0];Object.assign(order,{contract_status:'signed',status:'contract_signed_deposit_paid',paid_amount_cents:99500});
  assert.equal((await post('request-balance',{orderId:id,token})).status,404);
  assert.equal((await post('request-balance',{orderId:id,token:sessionId})).status,200);assert.match(flow.emails[0].payload.text,/stage=balance/);
  assert.equal((await post('create-checkout-session',{orderId:id,token,stage:'balance'})).status,200);
  flow.event={type:'checkout.session.completed',data:{object:{...paymentSession,metadata:{order_id:id,stage:'balance'}}}};
  assert.equal((await post('stripe-webhook',{}, {'stripe-signature':'mock'})).status,200);assert.equal(order.paid_amount_cents,199000);
  assert.equal((await (await get('order-status',{order_id:id,token,stage:'balance'})).json()).confirmed,true);
});


test('project files require an order token and use short-lived private URLs',async()=>{
  const query={order_id:id,token,path:`orders/${id}/brand/logo.png`};
  assert.equal((await get('project-file',{...query,token:crypto.randomUUID()})).status,404);
  const response=await get('project-file',query);assert.equal(response.status,302);assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal((await get('project-file',{...query,path:`orders/${sessionId}/brand/logo.png`})).status,400);
});

async function health(settings = {}) {
  flow.stripe.accounts = { retrieve: async () => ({ charges_enabled: true }) };
  flow.stripe.balance = { retrieve: async () => ({ livemode: true }) };
  return handlers.health.onRequestGet({ env: { ...env, ...settings }, request: new Request('https://trendivalux.com/api/health', { headers: { 'CF-Connecting-IP': crypto.randomUUID() } }) });
}
test('commissioning identifies each missing webhook separately and never returns secret values', async () => {
  const response = await health({ STRIPE_WEBHOOK_SECRET: '' });
  const status = await response.json();
  assert.equal(response.status, 503); assert.equal(status.ready, false);
  assert.deepEqual(status.webhooks, { stripeConfigured: false, docusealConfigured: true });
  assert.equal(status.agreementApiConnected, true); assert.equal(status.stripe.verified, true);
  for (const secret of [env.STRIPE_SECRET_KEY, env.DOCUSEAL_API_KEY, env.DOCUSEAL_WEBHOOK_SECRET]) assert.equal(JSON.stringify(status).includes(secret), false);
});
test('commissioning distinguishes DocuSeal missing configuration, authentication errors and unreachable service', async () => {
  let status = await (await health({ DOCUSEAL_API_KEY: '' })).json();
  assert.equal(status.agreement.status, 'missing_configuration'); assert.equal(status.agreement.keyConfigured, false); assert.equal(status.ready, false);
  globalThis.fetch = async () => new Response('Sensitive provider detail', { status: 403 });
  status = await (await health()).json();
  assert.equal(status.agreement.status, 'authentication_or_permission_error'); assert.equal(status.agreementApiConnected, false); assert.equal(status.ready, false);
  assert.equal(JSON.stringify(status).includes('Sensitive provider detail'), false);
  globalThis.fetch = async () => { throw new Error('Sensitive provider detail'); };
  status = await (await health()).json();
  assert.equal(status.agreement.status, 'unreachable_or_timeout'); assert.equal(status.ready, false);
});
test('commissioning refuses test keys even with all other settings present', async () => {
  const response = await health({ STRIPE_SECRET_KEY: 'sk_test_mock_only' });
  const status = await response.json();
  assert.equal(response.status, 503); assert.equal(status.stripe.keyMode, 'test'); assert.equal(status.stripe.verified, false); assert.equal(status.ready, false);
});
