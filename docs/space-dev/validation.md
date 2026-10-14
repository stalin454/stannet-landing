# Validación y cambios exactos

## Ejecutado

| Comprobación | Resultado | Qué demuestra |
| --- | --- | --- |
| `npm run test:ci` sobre base sin cambios runtime | PASS, 100 comandos | Sintaxis y regresiones offline incluidas en la suite del repositorio |
| Generar inventario de base fija | PASS, 55 entradas, 540 archivos | Referencias HTML directas locales a script/estilos resolubles; fuentes Vite consideradas desde su raíz |
| Restaurar archive aislado y comparar blobs | PASS, 540 archivos; modos ejecutables | El código versionado es recuperable byte a byte |
| Control de alcance contra base | Solo adiciones en `docs/space-dev/` | No cambios a archivos previos, incluidos voz, Worker, configuración y workflows |
| Sondas GET | 18×200, 1×502 | Alcanzabilidad y metadata pública seleccionada, detalle en `live-readonly.json` |
| Status Polly | Amazon, `eu-south-2`, configurado, Auth requerida | Backend actual declara esa configuración; no prueba calidad de audio |
| Suite Polly existente | 5 pruebas PASS dentro de CI | Mapeos de Amy y otras voces, motor neural, SigV4, SSML y fragmentación con proveedores simulados |
| Suite Language Premium existente | 6 pruebas PASS dentro de CI | Login/registro verificado, cookies/logout, bloqueo anónimo/cross-origin, cuota y fallo cerrado antes de AWS, todo con Supabase/AWS simulados |
| Solicitud específica Amy, `purpose=chat` | PASS sin llamar AWS real | `VoiceId=Amy`, `Engine=neural`, SSML `<prosody rate="98%">` conservados |
| Metadatos Supabase | Proyecto comunidad activo; 13 tablas públicas con RLS | Recurso existente y RLS habilitado, no prueba todos los grants/policies |
| Advisor seguridad Supabase | Avisos documentados en `current-state.md` | Hallazgos del servicio, sin ejecutar correcciones ni modificar cuotas |

La prueba de Amy adicional se ejecutó importando `requestPolly`, reemplazando temporalmente `fetch` con una respuesta simulada y comprobando mediante `assert` el payload. No se añade ni modifica una prueba del motor. Todos los ficheros protegidos se comparan contra la base por el control de alcance y el respaldo; variables/servicios externos no se escribieron.

Advertencia preexistente no bloqueante: Node reinterpreta ciertos `.js` como ES Modules porque `package.json` no declara `type`. No se cambia a `type=module`, ya que podría afectar tests CommonJS y otras aplicaciones.

## No ejecutado / pendiente antes de lanzamiento

| Prueba obligatoria | Situación |
| --- | --- |
| Registro/login/email real, reset y sesiones end-to-end de Dev | Portal Dev de fase B aún no implementado; no crear cuentas en producción |
| Suscripción activa/inactiva y protección completa APIs/assets | Diseño definido; handler/entitlements central todavía no implementados |
| Checkout y webhooks sandbox | Cuenta, claves de prueba, destino y entorno aislado no disponibles |
| Windows, Android e iPhone reales | Sin QA de dispositivos en esta fase documental; suite offline no los sustituye |
| Responsive, teclado, scroll y accesibilidad visual | No se cambia UI; pruebas de UI de futuras fases pendientes. Las pruebas estáticas existentes no certifican dispositivos reales |
| Core Web Vitals / rendimiento usuario | No se midieron; los tiempos de red del entorno no son LCP/INP/CLS |
| Integridad y recuperación D1/Supabase/R2/VPS | Solo código restaurado; datos y snapshots externos pendientes |
| Reproducción radio, separación Vocal Lab, audio DJ real | HTML/rutas y contratos offline revisados; reproducción y hardware no probados |
| Amy/Polly síntesis autenticada y escucha real | No hay sesión premium autorizada disponible aquí; conservar test pendiente en Windows/Android/iPhone |
| Todas las rutas antiguas y subrecursos | Inventario estático completo de HTML; solo 13 páginas Space seleccionadas se sondearon por HTTP |

La suite completa contiene pruebas de múltiples apps, pero no las suites separadas `tests/community` con navegador, DJ TypeScript/Web Audio ni Shield Rust/Windows. No se instalaron dependencias ni se ejecutaron builds que pudiesen reescribir assets. Ningún estado de prueba simulada se considera pago/login real.

## Criterios futuros de no regresión de voz

Antes de cualquier integración que pueda alcanzar voz: comparar hashes/cambios de sus módulos, verificar provider/origen/región, usar una cuenta de prueba premium y una frase corta, comprobar MP3 y escuchar Amy conservando rate/purpose. Probar interrupción, micrófono, eco, memoria, adjuntos y sesión en los tres sistemas. No probar mediante el GET desactivado `/api/speech/test` ni relajar cuotas/cookies para hacer pasar el test. Si no se dispone de sesión, la prueba queda bloqueada y la integración no se declara verificada.

## Relación exacta de cambios

Todos son archivos nuevos, sin runtime ni infraestructura:

1. `docs/space-dev/README.md`: índice y límites.
2. `docs/space-dev/current-state.md`: estado, inventario agrupado y riesgos.
3. `docs/space-dev/architecture.md`: diseño de plataformas, identidad, autorización y pagos sandbox.
4. `docs/space-dev/recovery.md`: procedimiento verificado de código y checklist externo.
5. `docs/space-dev/validation.md`: pruebas y alcance.
6. `docs/space-dev/inventory.py`: inventario read-only de commit fijo.
7. `docs/space-dev/inventory.json`: inventario generado.
8. `docs/space-dev/verify-recovery.py`: ensayo aislado de restauración e integridad.
9. `docs/space-dev/recovery-evidence.json`: resultado/hash del ensayo.
10. `docs/space-dev/live-readonly.json`: respuestas seleccionadas de lectura.

Cambios Git remotos: creadas las ramas `recovery/space-dev-phase-a-20261014` y `audit/space-dev-phase-a-20261014`; el PR corresponde a esta última. No merge. No deploy. No ejecución manual de workflow, escritura SQL, modificación de DNS ni lectura de secretos.
