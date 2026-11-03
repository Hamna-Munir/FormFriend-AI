// Copies browser assets into /public so nothing is fetched from a third-party CDN at runtime:
//   - PDF.js worker                  -> /public/pdf.worker.min.mjs
//   - Tesseract worker, WASM cores   -> /public/tesseract/
//   - English OCR language data      -> /public/tesseract/lang/
// Runs automatically after `npm install` (see "postinstall" in package.json).
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

function copy(src, dest) {
  if (!existsSync(src)) {
    console.warn(`Missing ${src}; the feature that needs it will not work until it is installed.`);
    return false;
  }
  copyFileSync(src, dest);
  return true;
}

mkdirSync("public/tesseract/core", { recursive: true });
mkdirSync("public/tesseract/lang", { recursive: true });

copy("node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs", "public/pdf.worker.min.mjs");
copy("node_modules/tesseract.js/dist/worker.min.js", "public/tesseract/worker.min.js");
copy(
  "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
  "public/tesseract/lang/eng.traineddata.gz",
);

// We only use the LSTM engine, so only the LSTM cores are needed.
const coreDir = "node_modules/tesseract.js-core";
if (existsSync(coreDir)) {
  for (const f of readdirSync(coreDir)) {
    if (/^tesseract-core.*lstm\.wasm\.js$/.test(f)) copy(`${coreDir}/${f}`, `public/tesseract/core/${f}`);
  }
}

console.log("Copied PDF.js and Tesseract assets to public/");
