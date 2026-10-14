# StanNet Dev B1 · entrega funcional aislada

Continuación del PR #149. Base: `44ee2b8fcd24f5ca04258f7d9662cc2b4cc4db1c`. Rama: `feat/stannet-dev-b1-20261014`. Recuperación: `recovery/pre-dev-b1-20261014`; también se conserva `recovery/space-dev-phase-a-20261014`.

## Resultado

Portal y backend funcionales **en entorno local aislado**, con SQLite persistente y Node 24. Registro, verificación mediante buzón local de pruebas, login, logout, recuperación, sesiones, roles, derechos Free/Premium, cuotas y Typing de programación. No se usa un login simulado, cuentas hardcoded, `localStorage` para sesión ni una variable del navegador para conceder Premium.

El catálogo público contiene las nueve categorías solicitadas. Solo Typing está conectado; las otras se identifican como próximas. Piloto: 188 ejercicios existentes, 47 lenguajes/formatos, cuatro niveles, sin voz/IA. Free permite tres ejercicios y diez inicios diarios; Premium de pruebas, 188 y cien inicios. Precios no definidos, sin Checkout, cobros ni tarjetas. Derechos Premium de prueba asignados por operador local, caducan y no equivalen a suscripciones compradas.

**Límites:** la entrega no está desplegada como SaaS completo. Hay adaptador Worker preparado que exige bindings propios y deniega operaciones privadas sin ellos. No se han creado recursos Cloudflare/D1/Supabase, ni enviado emails externos. El webhook Stripe implementa firma/idempotencia/estado de prueba, pero las pruebas suministran un estado Stripe de fixture: no son pagos efectuados en el sandbox de Stripe. La preview pública empaquetada es únicamente del catálogo y lo indica visiblemente.

## Ejecutar el entorno completo

En una copia de esta rama, con Node 24:

```sh
cd apps/dev-b1
npm test
npm run dev
```

Abrir `http://127.0.0.1:8789/`. El servidor solo escucha loopback; nunca se inicia contra Space/Dev productivos. Registrar un correo ficticio bajo `.test` y una contraseña de al menos 12 caracteres. No usar credenciales personales.

El correo se entrega a un **buzón local del operador**, no a Gmail/SMTP. Para obtener el enlace de una cuenta ficticia:

```sh
npm run admin -- mail alumno@example.test
```

Abrir el enlace de verificación, entrar y seleccionar Typing. Para probar Premium durante 24 horas:

```sh
npm run admin -- premium alumno@example.test 24
```

El CLI opera solo sobre `.state/sandbox.sqlite`; no existe un endpoint HTTP que exponga el buzón o conceda permisos. También admite `free`, `revoke` y `role correo member|admin`. Un cambio de rol revoca sesiones; rol admin no salta la autorización de Typing. Recuperar contraseña desde el formulario y consultar el enlace de reset por el mismo buzón. No se imprimen tokens de servicios reales.

## Preview y despliegue

- `dev-b1-preview/`: catálogo filtrable y presentación del portal. Registro/login deshabilitados porque el backend aislado no se despliega junto a la web Space.
- `apps/dev-b1/public/` y `private/`: interfaz completa servida por `server.mjs`; **no abrir el HTML directamente** para probar autenticación.
- `worker.mjs` / `worker.example.jsonc`: adaptador independiente, sin nombre de Worker, rutas, dominio, account ID ni ID de base inventados. Necesita `PUBLIC_ORIGIN` de sandbox, `DEV_DB`, `DEV_ASSETS` y un servicio `DEV_MAILER` verificado. `run_worker_first=true` protege también assets privados. No hay script de deploy.
- El adaptador rechaza explícitamente orígenes `stannet.space`, `www.stannet.space`, `stannet.dev` y `academy.stannet.dev` en B1; activar cualquiera requiere una revisión posterior aprobada.
- La integración Cloudflare existente publica previews automáticamente al abrir un PR. No confundir esa preview de Space con un despliegue de backend Dev. Se ha observado en #149; no se cambiaron sus reglas ni secretos.

Sin el acceso a bindings y al servicio de correo no se puede entregar una preview alojada de Auth/Typing. El catálogo alojado no sustituye la funcionalidad: el backend completo se demuestra por tests HTTP con base real, y su despliegue queda bloqueado/documentado.

## Documentos

- [Diagnóstico del dominio](diagnosis.md).
- [Arquitectura y decisiones](architecture.md).
- [Pruebas, recuperación y bloqueos](validation.md).
- `dns-evidence.json`: observaciones de DNS públicas.
- `verify-isolation.py`: compara 550 archivos previos y prueba recuperación.

No hacer merge: el workflow de `main` despliega automáticamente. Ninguna autorización para DNS, infraestructura, producción o cobros se infiere de este PR.
