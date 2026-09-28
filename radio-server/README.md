# StanNet Radio · Stage 7 server

This bundle runs the listener stream as two isolated services:

- **Liquidsoap 2.4.5**: continuous playout/encoding.
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

## Current Stage 7 behavior

The server is intentionally **music-continuous first**. The Cloudflare app already produces the Stage 6 playout manifest, spoken bulletins and jingles. Stage 8 will make Liquidsoap consume those scheduled inserts automatically without relying on a visitor's browser.

## Production notes

- Do not expose admin/source passwords in Git.
- Keep port 8000 private if a TLS reverse proxy is used.
- Back up the rights metadata together with the audio catalogue.
- Test new Liquidsoap releases in staging before changing the pinned version.
