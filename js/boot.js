// Loading screen driver. Downloads the 3D engine with a byte count (the module loader then takes it
// from the HTTP cache), then starts the tour: js/app.js, the bundle of all our modules built by
// scripts/build.mjs (or the source modules, js/main.js, with ?dev and in shot mode). The tour reports
// the remaining steps through window.__loadProgress(fraction 0..1, label). A query on this script's own
// URL (the version stamp the GitHub Pages build adds) is passed on to app.js, so a new deploy never
// starts with a cached older bundle.
const ENGINE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';
const ENGINE_BYTES = 680_000; // approximate size, used when the server sends no Content-Length
const fill = document.getElementById('loading-fill');
const step = document.getElementById('loading-step');
const box = document.getElementById('loading');
let shown = 0;

window.__loadProgress = (frac, label) => {
  shown = Math.max(shown, Math.min(1, frac));
  if (fill) fill.style.width = `${(shown * 100).toFixed(1)}%`;
  if (box) box.setAttribute('aria-valuenow', String(Math.round(shown * 100)));
  if (label && step) step.textContent = label;
};
window.__loadT0 = performance.now();

async function prefetchEngine() {
  try {
    const res = await fetch(ENGINE, { mode: 'cors', credentials: 'same-origin' });
    if (!res.ok || !res.body) return;
    const total = Number(res.headers.get('content-length')) || ENGINE_BYTES;
    const reader = res.body.getReader();
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      window.__loadProgress(0.04 + 0.4 * Math.min(1, got / total), `Downloading the 3D engine… ${Math.min(99, Math.round((got / total) * 100))}%`);
    }
  } catch {
    /* the module loader below fetches it anyway */
  }
}

window.__loadProgress(0.02, 'Downloading the 3D engine…');
await prefetchEngine();
window.__loadProgress(0.45, 'Starting the 3D engine…');
const q = new URLSearchParams(location.search);
const version = new URL(import.meta.url).search; // set on GitHub Pages, which has no source modules
const dev = !version && (q.has('dev') || q.has('shot') || q.has('cam'));
try {
  await import(dev ? './main.js' : `./app.js${version}`);
} catch (err) {
  if (step) step.textContent = 'The tour could not start. Reload the page to try again.';
  throw err;
}
