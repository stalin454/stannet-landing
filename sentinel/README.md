# StanNet Sentinel v0.2.0

Static local-browser defensive analysis for https://www.stannet.space/sentinel/.
Official YARA-X 1.20.0 WebAssembly runs in a dedicated Web Worker. Files are never uploaded or executed. The engine is delivered as 41 small gzip fragments and its decompressed SHA-256 is verified before initialization. Upstream binding and BSD license are in vendor/.

Features: SHA-256, bounded ASCII/UTF-16 strings, observed URL/domain/IP indicators, basic PE/ELF headers and sections, real YARA-X evidence, educational risk score, JSON report export, reviewed local rule versions, six synthetic benign fixtures, and explicit local IndexedDB history. Reports omit file bytes and full strings. Local records expire after 30 days, capped at 50 reports/25 rules.

Limits: 10 MiB per file, 64 KiB rules, 32 rules/128 patterns, 5 seconds scanner timeout, 15 seconds worker work deadline, 30 seconds initialization deadline. Limits and truncation appear in reports. A low score is not proof that a file is safe. Demo rules are educational; no malware corpus precision claims, AI diagnosis, cloud sync, sandbox execution, reputation lookup, digital signature validation or complete PE/ELF parsing.

Validation: `npm ci && npm test` (19 tests with real YARA-X, IndexedDB and UI lifecycle); `node --test ../tests/cyber-curriculum.test.cjs` preserves the academy checks. GitHub main deploys to Cloudflare Workers. Static assets are served by the Worker configuration, and Sentinel runs entirely in the browser without a Linux backend service.
