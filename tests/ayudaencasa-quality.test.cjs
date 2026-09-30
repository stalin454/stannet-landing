const assert=require('node:assert/strict');const fs=require('node:fs');
const html=fs.readFileSync('pages/marketplace.html','utf8');
for(const x of ['class="skip"','aria-label="Navegación principal"','aria-live="polite"','role="dialog"','aria-modal="true"','prefers-reduced-motion'])assert.ok(html.includes(x),'accessibility control missing '+x);
assert.ok(!html.includes('fonts.googleapis.com'),'marketplace should not depend on Google Fonts');
assert.ok(!html.includes('fonts.gstatic.com'),'marketplace should not depend on Google Fonts CDN');
assert.equal((html.match(/href="ayudaencasa-privacidad\.html"/g)||[]).length,1,'footer privacy link should not be duplicated');
for(const page of ['ayudaencasa-aviso-legal.html','ayudaencasa-privacidad.html','ayudaencasa-cookies.html','ayudaencasa-condiciones.html'])assert.ok(html.includes(page),'legal navigation missing '+page);
console.log('PASS: AyudaEnCasa accessibility/performance/legal navigation invariants verified.');
