# StanNet Shield Desktop

## Objetivo
Aplicación Windows defensiva que amplía el scanner web de StanNet Shield. La web distribuye y documenta la aplicación; el análisis completo, cuarentena y limpieza se ejecutan localmente en Windows.

## Shield 0.4
- Escaneo bajo demanda de archivo o carpeta.
- SHA-256 de cada archivo procesado.
- Motor YARA-X con reglas StanNet versionadas.
- Máximo 10.000 archivos por operación.
- Cuarentena reversible con registro y comprobación de integridad.
- Cleaner de temporales del usuario: analizar → seleccionar → confirmar → limpiar.
- Historial local en `%LOCALAPPDATA%\StanNetShield`.
- Consulta de estado de Microsoft Defender.
- Quick Scan de Defender.
- Actualización de firmas de Defender.
- GUI Tauri 2.
- Instalador NSIS generado por GitHub Actions.

## Contrato de seguridad
- Nunca ejecutar el archivo analizado.
- Nunca borrar automáticamente una detección.
- Cuarentena solo tras acción explícita.
- Cleaner limitado a rutas permitidas.
- No modificar ni desactivar Microsoft Defender.
- No cambiar exclusiones de Defender.
- No implementar persistencia oculta, evasión o acceso a credenciales.
- No subir contenido de archivos por defecto.

## Build y release
`.github/workflows/shield-desktop-rust.yml` ejecuta tests, smoke tests, build del core y build Tauri/NSIS. En `main`, si todo pasa, publica una release rolling `shield-preview` con:
- `StanNet-Shield-Setup.exe`
- `StanNet-Shield-Setup.exe.sha256`

La preview está sin firma de código; SmartScreen puede advertir al usuario. Antes de la versión 1.0 se requiere firma y una matriz de pruebas Windows más amplia.

## Posicionamiento
Shield 0.4 es una capa defensiva complementaria. Microsoft Defender sigue proporcionando la protección antivirus residente principal; Shield añade YARA-X, hashing, cuarentena, mantenimiento y una interfaz StanNet unificada.
