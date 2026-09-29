# StanNet Radio · Stage 8 autonomous server

This bundle runs the listener stream as three isolated services:

- **Director (Node 22)**: decides what plays next from the StanNet schedule and R2 catalog.
- **Liquidsoap 2.4.5**: resolves each Director URI, decodes it, encodes the station feed and sends it to Icecast.
- **Icecast 2**: listener-facing streaming server.

## Safety / rights rule

Only audio listed in `/radio-catalog.json` with documented emission rights should be copied to `radio-server/music/`.
Do not copy files from client projects such as `sanacion/`.

## First deployment

1. Provision a Linux VPS with Docker Engine + Docker Compose.
2. Copy this `radio-server/` directory to the VPS.
3. Copy `.env.example` to `.env`.
4. Replace every `CHANGE_ME...` password with a long random secret.
5. Add only rights-cleared tracks to `music/`.
6. Run `docker compose up -d --build`.
7. Verify `http://SERVER_IP:8000/stannet.mp3`.
8. Put a TLS reverse proxy in front of Icecast and expose e.g. `https://radio.stannet.space/stannet.mp3`.
9. Set Cloudflare Worker variable `RADIO_STREAM_URL=https://radio.stannet.space/stannet.mp3`.

The website player already consumes `RADIO_STREAM_URL`.

## Stage 8 autonomous behavior

The Director asks the public StanNet APIs for the current schedule and cloud-ready R2 catalog. For bulletin slots it emits, once per slot: station jingle → generated bulletin audio → transition. It then returns to music. For music slots it rotates R2 tracks while remembering recent IDs in a persistent Docker volume. If no track is available it falls back to a station jingle instead of crashing.

Liquidsoap consumes the Director through `request.dynamic`, so no browser or desktop computer is involved in playout. The server keeps running while the owner's PC is off.

## Production notes

- Do not expose admin/source passwords in Git.
- Keep port 8000 private if a TLS reverse proxy is used.
- Back up the rights metadata together with the audio catalogue.
- Test new Liquidsoap releases in staging before changing the pinned version.


## Importar tu biblioteca Suno local

El importador está pensado para una biblioteca local como:

`C:\\CStanNetRadioMusic`

Desde la raíz del proyecto ejecuta:

```powershell
npm run radio:import
```

También puedes indicar otra carpeta:

```powershell
npm run radio:import -- "D:\\MiMusica"
```

Antes de modificar nada puedes probar:

```powershell
npm run radio:import:dry
```

El importador:

- busca MP3, WAV, M4A, FLAC, OGG y AAC de forma recursiva;
- calcula SHA-256 para evitar duplicados;
- deriva el título a partir del nombre del archivo;
- asigna `artist: StanNet`;
- marca los derechos como `owned` con origen Suno según la declaración del propietario;
- copia los archivos a `radio-server/music/` localmente;
- actualiza `radio-catalog.json`;
- genera `radio-server/liquidsoap/playlist.m3u`.

Los binarios de audio y la playlist generada están excluidos de Git. El catálogo y los metadatos sí pueden versionarse.


## What still requires infrastructure

The code is autonomous, but it must run on a machine that stays online. Deploy this folder to a Linux VPS with Docker. Cloudflare Workers/R2 host the APIs and audio objects; they do not replace the continuously running Icecast/Liquidsoap process.


## HTTPS y dominio público

El stack incluye Caddy delante de Icecast. En producción, crea un registro DNS para `radio.stannet.space` apuntando a la IP pública del VPS. Caddy obtiene y renueva TLS automáticamente y publica el mount como `https://radio.stannet.space/stannet.mp3`. El puerto 8000 de Icecast queda accesible solo dentro de la red Docker.
