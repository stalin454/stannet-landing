# StanNet.Space

Sitio oficial de StanNet.Space.

## Stack

- HTML, CSS y JavaScript estático
- Cloudflare Worker para APIs y assets
- GitHub como repositorio principal
- GitHub Actions para tests y despliegue automático

## Desarrollo local

Sirve la raíz del repositorio con un servidor estático. Para las rutas `/api/*`, usa Wrangler cuando necesites probar el Worker.

## Tests

```bash
npm test
```

Los tests de CI son offline y cubren el currículo de ciberseguridad, Music API, Nutri IA y generación de planes. El test del diccionario usa servicios externos y se ejecuta aparte:

```bash
npm run test:dictionary-live
```

## Despliegue

Cada cambio que llega a `main` se valida y se despliega automáticamente a Cloudflare Workers mediante Wrangler 4.

Secrets requeridos en GitHub Actions:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Variables/secrets de servicios externos como Azure Speech, YouTube o Replicate se configuran en Cloudflare, no en el repositorio.
