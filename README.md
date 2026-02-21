# p7m-extractor
Simple client only (no server components) extractor for .p7m signed files.

The tool can be used completely offline (download and save .html and open locally) if you are paranoid enough :) .

## Project Structure

```
src/
├── index.html              # Source file with ES module imports from CDN
└── locales/
    ├── it.json             # Italian translations
    └── en.json             # English translations

dist/
└── index.html              # Compiled output (all dependencies inline)

build.js                     # Build script
package.json                 # Dependencies
```

## Build & Deploy

### Source Files
- `src/index.html` - Source file with ES module imports from CDN (asn1js, pkijs, Google Fonts)
- `src/locales/*.json` - Localization files (extracted from inline code)
- `build.js` - Build script that bundles all dependencies inline and generates optimized output

### Build Process
Run the build to bundle all dependencies:
```bash
npm install
npm run build
```

This generates `dist/index.html` with:
- ✅ asn1js & pkijs bundled inline
- ✅ Locale data (it.json, en.json) inlined
- ✅ Fonts replaced with system fallbacks
- ✅ No external CDN dependencies
- ✅ Self-contained single file (873KB)

### GitHub Pages Deployment
The workflow in `.github/workflows/build-deploy.yml` automatically:
1. Installs dependencies
2. Runs `npm run build`
3. Deploys `dist/index.html` to GitHub Pages on every push to `main`

The built file is served at your GitHub Pages URL (configured in repository settings).
