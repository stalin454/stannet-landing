# B6 · Cybersecurity Academy, cuarto piloto privado StanNet Dev

Procedencia: `pages/cybersecurity.html`, `cyber-curriculum.js`, `cyber-academy.js`, `cyber-network-lab.js`, `cyber-academy.css`. Los cuatro recursos JS/CSS educativos son copias exactas de los originales de Space; no se han modificado en Space.

Se incorpora `/apps/cybersecurity` con shell y estilos base Dev, excluyendo menú, scripts globales y fuentes de Space. Los enlaces a Sentinel, Shield, Password Security y Cyber Defense Lab que todavía no se han migrado quedan provisionalmente apuntando a secciones locales; **no se afirman disponibles en Dev**, y no se retiran de Space. Las páginas y cada recurso JS/CSS pasan una verificación nueva de sesión, rol admin y modo sandbox en servidor.

Incluye ruta SOC junior, cuestionarios, cuaderno descargable y laboratorio simulado con datos ficticios. El progreso educativo se conserva únicamente en `localStorage['stannetCyberV1']` bajo el origen Dev del navegador. **No hay importación de apuntes de Space, ni D1 por alumno ni comercialización.** Antes de retirar Space se requiere exportar y validar datos con consentimiento.

Se añaden pruebas de igualdad de fuentes, controles de acceso por recurso y navegador para escritura, recarga y retención de apuntes. CI obligatorio antes de aprobar. Cualquier error en Chrome debe corregirse en esta rama, sin tocar los originales.

No modificar `main`, `stannet.space`, `academy.stannet.dev`, StanNet AI/Polly, Radio, AWS, pagos ni D1 remoto. Los bloqueos B2 siguen impidiendo publicar autenticación remota y cursos privados.
