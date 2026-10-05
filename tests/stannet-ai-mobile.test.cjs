const assert = require('node:assert/strict');
const fs = require('node:fs');

const widget = fs.readFileSync('stannet-ai.js', 'utf8');
const loader = fs.readFileSync('script.js', 'utf8');

assert.ok(widget.includes('#stannet-ai-root.panel-open::before'), 'Mobile modal must block background interaction without locking body/html');
assert.ok(widget.includes("root.classList.toggle('panel-open',mobileOpen)"), 'Mobile open state must be explicit on the widget root');
assert.ok(widget.includes("root.style.setProperty('--snai-vh'"), 'Visual viewport height must drive the mobile panel');
assert.ok(widget.includes("root.style.setProperty('--snai-vtop'"), 'Visual viewport offset must drive the mobile panel');
assert.ok(widget.includes("window.visualViewport.addEventListener('resize'"), 'Keyboard/viewport resize must resync the panel');
assert.ok(widget.includes("window.visualViewport.addEventListener('scroll'"), 'Visual viewport panning must resync the panel');
assert.ok(widget.includes("if(panel.classList.contains('open')&&!isCompactViewport())input.focus"), 'Mobile must not force-focus the input after responses');
assert.ok(widget.includes("reopen.classList.toggle('visible',hidden)"), 'Hiding the agent must reveal the IA reopen tab');
assert.ok(widget.includes("background:transparent!important"), 'Agent launcher background must remain transparent');
assert.ok(loader.includes("/stannet-ai.js?v=20261005-mobile4"), 'Loader must bust cache for the rebuilt mobile widget');

console.log('PASS: StanNet AI mobile viewport, keyboard, hide/reopen and transparency safeguards are present.');
