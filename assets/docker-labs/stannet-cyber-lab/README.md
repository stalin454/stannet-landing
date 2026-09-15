# StanNet Cyber Lab - Bloque 2

Laboratorio local y educativo para practicar pentesting web basico, lectura de logs y redaccion de informes.

## Alcance autorizado

Ataca solo este laboratorio en tu equipo. No uses estas tecnicas contra terceros sin permiso escrito.

## Requisitos

- Docker
- Docker Compose
- Navegador
- Terminal

## Inicio

```bash
docker compose up --build
```

Abre:

- Aplicacion vulnerable: http://localhost:8080
- Logs generados: `logs/access.log`

## Misiones

1. Identifica cabeceras HTTP y rutas disponibles.
2. Prueba autenticacion con usuarios de laboratorio.
3. Revisa el endpoint `/search?q=`.
4. Detecta un IDOR educativo en `/invoice/<id>`.
5. Analiza `logs/access.log` y redacta un informe.

## Credenciales de laboratorio

- ana / academy123
- luis / stannet2026

## Entrega

Usa `report-template.md` para documentar:

- objetivo
- entorno
- procedimiento
- evidencia
- impacto
- recomendacion
- executive summary
