const assert = require('node:assert/strict');
const fs = require('node:fs');
const html = fs.readFileSync('pages/callan.html', 'utf8');
const css = fs.readFileSync('callan-contrast.css', 'utf8');

// The local override must load AFTER the light global theme.
assert.ok(html.includes('href="/callan-contrast.css?v=20261009-1"'));
assert.ok(html.indexOf('/callan-contrast.css') > html.indexOf('/stannet-global-theme.css'));
assert.match(html, /class="stannet-global stannet-page-callan"/);
assert.match(css, /body\.stannet-global\.stannet-page-callan\s*\{/);
assert.match(css, /color-scheme:dark/);
assert.match(css, /--ink:#f4faff/);
assert.match(css, /--muted:#c5d1e2/);
assert.match(css, /--lesson-accent:#88eaff/);
assert.match(css, /\.stannet-page-callan main/);
assert.match(css, /\.stannet-page-callan :is\(input,textarea\)::placeholder/);
assert.doesNotMatch(css, /#stannet-ai-root/);

// WCAG AA: readable body and supporting text over every original classroom surface.
function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map(c => {
    const value = parseInt(c, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
function contrast(a, b) {
  const [min, max] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (max + .05) / (min + .05);
}
for (const bg of ['#071320', '#101126', '#080919', '#13132d']) {
  for (const fg of ['#f4faff', '#c5d1e2', '#88eaff', '#7df2d0']) {
    assert.ok(contrast(bg, fg) >= 7, `Callan text contrast too low: ${fg} on ${bg}`);
  }
}
console.log('PASS: Callan page-scoped dark theme provides WCAG AAA text contrast.');
