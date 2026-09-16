# StanNet Shield Desktop

## Objetivo
Aplicación Windows defensiva que amplía el scanner web de StanNet Shield. El sitio web distribuye y documenta la aplicación; el análisis completo, cuarentena y limpieza se ejecutan localmente en Windows.

## Contrato de seguridad V1
- Escaneo bajo demanda de archivo o carpeta.
- SHA-256 de cada archivo procesado.
- Motor YARA-X con reglas StanNet versionadas.
- Nunca ejecutar el archivo analizado.
- Nunca borrar automáticamente una detección.
- Cuarentena solo tras acción explícita del usuario.
- Restauración de cuarentena disponible.
- Cleaner en modo `analizar -> seleccionar -> confirmar -> limpiar`.
- Cleaner limitado a categorías conocidas y rutas permitidas.
- No modificar ni desactivar Microsoft Defender.
- No implementar persistencia oculta, evasión o acceso a credenciales.
- Logs locales; no subir contenido de archivos por defecto.

## Componentes previstos
- `scanner`: enumeración segura, límites, cancelación, hashing.
- `yara`: compilación y evaluación de reglas.
- `quarantine`: almacén aislado + manifiesto SHA-256 + restauración.
- `cleaner`: descubrimiento de candidatos seguros y eliminación confirmada.
- `history`: metadatos locales de análisis y acciones.
- `updater`: manifiesto HTTPS, versión e integridad/firma.
- `ui`: Tauri 2 + frontend StanNet.

## Criterio de release
No se publica instalador como antivirus hasta completar build Windows, pruebas de instalación/desinstalación, scan/quarantine/restore/cleaner, prueba sin red, prueba de archivo bloqueado, integridad del update y publicación de SHA-256 del instalador.