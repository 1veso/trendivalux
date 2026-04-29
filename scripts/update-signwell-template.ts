/**
 * Generates a clean PDF from src/content/legal/WERKVERTRAG_TEMPLATE.md, ready
 * to upload as the new template body for SignWell template
 * `f85af17f-7a91-46c7-a676-6016272ce6dd`.
 *
 * Background — Approach A vs Approach B:
 *
 *   Approach A (programmatic template body update via SignWell API) was
 *   investigated and discarded. SignWell's public REST API exposes
 *   /document_templates/documents/ for *creating* documents from a template,
 *   but does not document a "replace the template's source PDF" endpoint.
 *   Anything we could try via undocumented API surface would be brittle and
 *   would still require re-placing the 10 merge fields and signature field
 *   on the new document — work that has to be done in the SignWell visual
 *   editor regardless. Skipping Approach A.
 *
 *   Approach B (this script) — generate the PDF locally and have the
 *   operator upload it via the SignWell template editor. Reliable, one-time
 *   manual step, and the field placement work has to happen anyway.
 *
 * Run with:
 *   pnpm dlx md-to-pdf src/content/legal/WERKVERTRAG_TEMPLATE.md
 *
 * Or, with this script (uses md-to-pdf under the hood with Trendiva styling):
 *   pnpm tsx scripts/update-signwell-template.ts
 *
 * Output: src/content/legal/WERKVERTRAG_TEMPLATE.pdf
 *
 * After generation, follow MANUAL_UPLOAD_STEPS at the end of this file.
 */

import { mdToPdf } from 'md-to-pdf';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceMd = path.join(projectRoot, 'src/content/legal/WERKVERTRAG_TEMPLATE.md');
const outputPdf = path.join(projectRoot, 'src/content/legal/WERKVERTRAG_TEMPLATE.pdf');

// Print-oriented styling. Black-on-white only — SignWell's editor and the
// final signed PDF must remain legible when faxed/printed by counterparty.
const cssOverrides = `
  @page {
    margin: 24mm 22mm 28mm 22mm;
  }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #111;
    background: #fff;
  }
  h1 {
    font-size: 18pt;
    margin-top: 0;
    margin-bottom: 6mm;
    border-bottom: 1px solid #000;
    padding-bottom: 3mm;
  }
  h2 {
    font-size: 13pt;
    margin-top: 9mm;
    margin-bottom: 3mm;
  }
  h3 {
    font-size: 11pt;
    margin-top: 6mm;
    margin-bottom: 2mm;
  }
  p { margin: 0 0 3mm 0; }
  ul, ol { margin: 0 0 4mm 5mm; padding: 0; }
  li { margin-bottom: 1.5mm; }
  table { width: 100%; border-collapse: collapse; margin: 4mm 0; font-size: 10pt; }
  th, td { border: 1px solid #444; padding: 2mm 3mm; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  hr { border: none; border-top: 1px solid #888; margin: 8mm 0; }
  code, pre { font-family: 'JetBrains Mono', Consolas, monospace; font-size: 9.5pt; }
`;

async function generate() {
  console.log(`Generating PDF from: ${sourceMd}`);

  const result = await mdToPdf(
    { path: sourceMd },
    {
      dest: outputPdf,
      pdf_options: {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      },
      css: cssOverrides,
      stylesheet_encoding: 'utf-8',
    },
  );

  if (!result) {
    console.error('md-to-pdf returned no result. PDF was not generated.');
    process.exit(1);
  }

  console.log(`✓ PDF written to: ${outputPdf}`);
  console.log('');
  console.log('Next: open the PDF and verify rendering before upload.');
  console.log('');
  printManualUploadSteps();
}

function printManualUploadSteps() {
  const steps = [
    '────────────────────────────────────────',
    'MANUAL UPLOAD STEPS (SignWell template f85af17f-7a91-46c7-a676-6016272ce6dd)',
    '────────────────────────────────────────',
    '1. Open https://www.signwell.com/templates',
    '2. Find the template "Trendiva Lux Service Agreement" (id: f85af17f-...)',
    '3. Edit → Replace document → upload:',
    '     src/content/legal/WERKVERTRAG_TEMPLATE.pdf',
    '4. Re-place the 10 merge fields (api_id values must match exactly):',
    '     customer_name',
    '     customer_address',
    '     tier_name',
    '     total_price_eur',
    '     deposit_paid_eur',
    '     final_payment_eur',
    '     delivery_timeline',
    '     deliverables_list',
    '     order_id',
    '     contract_date',
    '5. Re-place the signature field for the customer recipient',
    '   (placeholder name "Client" — must match RECIPIENT_PLACEHOLDER_NAME',
    '   in functions/_shared/signwell.ts)',
    '6. Save template',
    '7. Smoke test: send a test envelope to yourself by triggering an order',
    '   in test mode — confirm all merge fields populate and rendering is clean',
    '────────────────────────────────────────',
  ];
  steps.forEach((line) => console.log(line));
}

generate().catch((err) => {
  console.error('PDF generation failed:', err);
  console.error('');
  console.error('Fallback: try Pandoc directly:');
  console.error(
    '  pandoc src/content/legal/WERKVERTRAG_TEMPLATE.md -o src/content/legal/WERKVERTRAG_TEMPLATE.pdf --pdf-engine=xelatex',
  );
  process.exit(1);
});
