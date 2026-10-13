# StanNet AI Context Bridge — 2026-10-13

Branch: `feat/stannet-ai-context-bridge-20261013`.
Recovery: `recovery/context-bridge-20261013-86779b0`, commit `86779b09f8c5534b9fe3e1561a68d39aaf98a9c7`.
Production is unchanged. The Cloudflare deployment workflow runs on main or explicit manual dispatch; neither was used.

## Behavior

The widget displays its current application, lesson, language and activity. Programming controllers publish exact lesson/exercise identifiers and public task descriptions. Every model request obtains a fresh, allowlisted snapshot. Short questions such as `¿Dónde estoy?` receive a deterministic response from this same context, without relying on provider availability or historical guesses. Other teaching requests carry the snapshot into the existing Worker/model flow.

Adapters cover Web Lab, Python, Computer Science, Full Stack Lab and Full Stack Course. Callan publishes selected book/lesson metadata; Danish publishes its active chapter; PDF Tutor publishes the page number and mode without document title/content; Radio and DJ Studio expose their application/activity. Unknown pages retain only title/path/activity, with no invented lesson.

Applications can register an adapter on `window.StanNetAIContextBridge` after `stannet:bridge-ready`. `register({match,read,editor?})` returns an unregister function. `read` must return public educational metadata only. `sanitizeContext` applies the same field/length policy in the browser and Worker. `snapshot()` reads current state, so initialization after lesson rendering is supported. A controller may publish `window.StanNetLearningContext` with its exact pathname and dispatch `stannet:learning-context` on each transition. The route match prevents previous-page state from leaking into another application.

## Privacy and compatibility

No bulk DOM extraction, private storage reads, authentication fields, URL queries, student answers, editor values or PDF text enter automatic context. Code is read only after selecting Compartir código and confirming permission at send time. Each file requires the same per-send permission; cancellation leaves the material local. The Worker rejects material without its explicit consent flag. This flag enforces the client protocol, not a cryptographic proof of human interaction.

Shared material and the resulting answer are not added to persistent chat history, so subsequent turns do not automatically resend them. Ordinary history, opt-in memory, modes, attachments and the existing voice implementation remain. New metadata is not persisted. A bounded heuristic redacts common API keys, bearer tokens, JWTs, credential assignments and private-key blocks before text/code transmission and again in the Worker. It is not a detector for all possible secrets, and images require user review.

Existing direct API clients sending attachments must now include `consent.attachment: true`; old cached widget builds must refresh. Loader references and widget assets use the new release version. No secrets or server environment variables were copied into the preview.

The mobile panel retains VisualViewport geometry and background-scroll restoration. At viewport heights below 440px, secondary controls collapse; header and composer stay small enough to preserve conversation space. Wrapping prevents tool/memory buttons from forcing horizontal overflow. New responses follow the bottom only while the visitor is already near it, preserving manual reading position.

A pre-existing stray quote in the Full Stack Course engine prevented JavaScript parsing. It was removed to permit that application's real lesson transitions to be tested.

## Verification and limits

`npm run test:ci` passes, including existing voice/core/Worker regressions and five new behavioral tests. `node --test tests/stannet-ai-context.test.mjs` executes the real curriculum files and lesson controllers with a minimal DOM test double. It switches lessons, validates identifiers and task text, checks the AgentCore response and outgoing payload, tests phase changes/late initialization/route changes, and runs the real Worker handler with a captured provider request.

The provider is mocked in these tests; this demonstrates delivery of current context into its prompt, not a live Groq inference. The deterministic recognition response is executed by the real AgentCore, not a mock. Browser QA and physical mobile keyboards have not been exercised in this environment because the prescribed browser-control capability is unavailable.

`qa/context-bridge/index.html` is an interactive verification surface using the actual Programming pages and widget. Click **Demostrar reconocimiento** after changing a lesson to assert the actual widget answer against the current snapshot. The separate `qa/stannet-ai/index.html` matrix exercises desktop/mobile dimensions, simulated keyboard/rotation, scroll, memory, modes and persistence when run in a browser; its availability does not mean it was executed here.

The isolated owner-private preview has no generative, authentication or TTS backend. Recognition works locally. Code/file analysis and server voice require a future authorized backend deployment; this change does not deploy production.
