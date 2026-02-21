import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Create a temporary entry file that exports the libraries
const tempFile = path.join(__dirname, '_bundle-temp.js');
fs.writeFileSync(tempFile, `
import * as asn1js from 'asn1js';
import { ContentInfo, SignedData } from 'pkijs';
window.asn1js = asn1js;
window.pkijs = { ContentInfo, SignedData };
`);

// Build the bundle
const result = await esbuild.build({
  entryPoints: [tempFile],
  bundle: true,
  format: 'iife',
  write: false,
  sourcemap: false,
  minify: false,
});

// Extract the bundle code
const bundleCode = result.outputFiles[0].text;

// Clean up temp file
fs.unlinkSync(tempFile);

// Read source HTML
const srcPath = path.join(__dirname, 'src/index.html');
const distPath = path.join(__dirname, 'dist');
let html = fs.readFileSync(srcPath, 'utf-8');

// Read and load locale JSON files
const itJsonPath = path.join(__dirname, 'src/locales/it.json');
const enJsonPath = path.join(__dirname, 'src/locales/en.json');
const itJson = JSON.parse(fs.readFileSync(itJsonPath, 'utf-8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

// Remove Google Fonts import and use system fonts
html = html.replace(
  /@import url\('https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Mono:wght@300;400;500;600&family=IBM\+Plex\+Sans:wght@300;400;500&display=swap'\);?\n/,
  ''
);

// Update font families to use system fonts with fallbacks
html = html.replace(
  /font-family:'IBM Plex Mono',monospace/g,
  "font-family:'Menlo','Monaco','Courier New',monospace"
);

html = html.replace(
  /font-family:'IBM Plex Sans',sans-serif/g,
  "font-family:-apple-system,'Segoe UI','Helvetica Neue',sans-serif"
);

// Find the script section and replace it
const scriptStart = html.indexOf('<script type="module">');
const scriptEnd = html.lastIndexOf('</script>') + '</script>'.length;

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Could not find script tags!');
  process.exit(1);
}

const newScript = `<script>
// Bundled asn1js and pkijs - all dependencies inline
${bundleCode}
// Inline locale data
const localeData = {
  it: ${JSON.stringify(itJson)},
  en: ${JSON.stringify(enJson)}
};
// Inline loadLocales function
async function loadLocales() {
  T = {
    it: localeData.it,
    en: localeData.en,
  };
  lang = detectLang();
  t = T[lang];
  applyLang(lang);
}
// Application code
${extractAppCode(html.substring(scriptStart + '<script type="module">'.length, scriptEnd - '</script>'.length))}
</script>`;

html = html.substring(0, scriptStart) + newScript + html.substring(scriptEnd);

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Write the bundled HTML to dist/index.html
const outputPath = path.join(distPath, 'index.html');
fs.writeFileSync(outputPath, html);
console.log(`✓ Bundle complete! Output: ${outputPath}`);

function extractAppCode(originalScript) {
  // Remove the import statements and keep only the application code
  return originalScript
    .replace(/^import \* as asn1js from 'https:\/\/esm\.sh\/asn1js@3';\n?/m, '')
    .replace(/^import \{ ContentInfo, SignedData \} from 'https:\/\/esm\.sh\/pkijs@3';\n?/m, '')
    .trim();
}
