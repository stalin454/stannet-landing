# Comunidad Dinamarca

Desarrollo aislado en `feature/ruta-dinamarca-comunidad`. Integración preparada en
`/pages/ruta-dinamarca.html#comunidad` y en el desplegable Ruta Dinamarca.
No debe fusionarse en producción antes de activar y comprobar el almacenamiento.

## Alcance implementado

- Registro por correo y contraseña; confirmación por correo con PKCE.
- Inicio/cierre de sesión, renovación de sesión y recuperación de contraseña.
- Cuenta de acceso gestionada por Supabase Auth, reutilizando la infraestructura
  existente. No se copian contraseñas a las tablas de comunidad.
- Cookies HttpOnly/Secure/SameSite, propias de `/api/community`.
- Perfil con nombre, ciudad, presentación y foto. La foto es obligatoria para
  publicar/responder. El navegador recorta a 320 × 320, elimina metadatos al
  convertir a JPEG y limita el archivo; el servidor valida tipo/firma/tamaño.
- Publicaciones por tema y ciudad, búsqueda por título, paginación y respuestas.
- Edición/eliminación de publicaciones propias; eliminación de respuestas propias.
- Denuncias privadas y retirada de publicaciones por moderadores.
- Eliminación de datos de comunidad con contraseña, sin eliminar la cuenta compartida.
- Formularios accesibles, texto de usuarios renderizado con `textContent`, diálogo
  adaptable al móvil y mensajes de error dentro del diálogo.

Los perfiles, fotos y contenido solo son consultables por usuarios con correo
confirmado. El correo no está en las tablas de perfiles ni en las respuestas públicas.
No se afirma verificar documentalmente la identidad: una foto y un correo confirmado
no constituyen una verificación de identidad.

## Activación pendiente antes de integrar

1. Conectar Supabase al proyecto `beaiuamtvijimwislzeo` (el configurado en `worker.js`),
   o configurar un proyecto independiente mediante las variables
   `COMMUNITY_SUPABASE_URL` y `COMMUNITY_SUPABASE_KEY` del Worker.
2. Aplicar una vez `supabase/community/001_community.sql` como migración administrativa.
   Crea únicamente `dk_profiles`, `dk_posts`, `dk_replies`, `dk_reports`, índices,
   políticas RLS, funciones `dk_*` y triggers propios. No modifica tablas de otras áreas.
   La migración es transaccional. No repetirla como script suelto: registra su versión.
3. En Auth > URL Configuration permitir exactamente:
   - `https://stannet.space/pages/ruta-dinamarca.html#comunidad`
   - `https://www.stannet.space/pages/ruta-dinamarca.html#comunidad`
   - `https://stannet.space/pages/ruta-dinamarca.html?community_recovery=1#comunidad`
   - `https://www.stannet.space/pages/ruta-dinamarca.html?community_recovery=1#comunidad`
     Configurar las URLs equivalentes del entorno de pruebas si se usa un staging.
     Mantener activada la confirmación de correo. PKCE requiere abrir el enlace en el
     navegador que solicitó el registro o la recuperación (verifier dura 15 minutos).
4. Comprobar SMTP para usuarios reales. Supabase puede limitar el servicio de correo
   por defecto; las pruebas locales simulan el proveedor y no validan entrega real.
5. Designar un moderador mediante `app_metadata.community_admin=true` usando acceso
   administrativo de Auth. Nunca usar `user_metadata` para otorgar permisos.
6. Probar en staging con dos cuentas autorizadas: confirmación, recuperación, foto,
   publicación, respuesta, edición/borrado, denuncia y moderación. Asegurar que el
   correo llega y que los enlaces vuelven al dominio correcto.
7. Fusionar la rama conservando cambios posteriores de main, desplegar Cloudflare
   y verificar la comunidad en escritorio y móvil.

La clave publishable de Supabase ya es pública en el proyecto. No se requiere ni se
incluye una clave service-role en el frontend o repositorio. Los controles de propiedad,
correo confirmado y foto obligatoria también se aplican en PostgreSQL mediante RLS,
incluso si alguien evita el Worker y llama directamente a REST.

## Datos y límites

Cada perfil referencia `auth.users`; cada publicación/respuesta referencia al perfil.
Eliminar el perfil elimina su contenido por cascada y conserva `auth.users`.
El backend no acepta un `author_id` enviado por el cliente: toma el de la sesión.
Las fechas y autorías no se pueden modificar con el rol authenticated.

Temas: vivienda, trabajo, trámites, estudios, ciudades, comunidad.
Ciudades: Copenhague, Aarhus, Odense, Aalborg, Vejle, Kolding, Fredericia, Horsens,
otra ciudad y todavía fuera de Dinamarca.

Títulos 5–140 caracteres; publicaciones 10–5000; respuestas 2–2000; bio hasta 500.
Foto hasta 180 KB (contenido binario). Se almacena como dato en el perfil; el feed
no incluye la foto completa y la carga por una ruta autenticada independiente.

Anti-spam de publicaciones/respuestas en PostgreSQL con bloqueo transaccional por
autor: una publicación cada 30 segundos, máximo 20/día; una respuesta cada 10 segundos,
máximo 100/día. El registro/login/email tiene los límites del proveedor Auth.
Una denuncia por miembro y publicación. Las denuncias se eliminan al retirar el post.

## Pruebas reproducibles

```sh
cd tests/community
npm ci
npx playwright install chromium
npm test
```

La suite usa PostgreSQL real ejecutado con PGlite: aplica la migración y ejercita RLS,
roles, constraints, triggers, límites y cascadas. Simula solamente Supabase Auth y
su transporte REST; no envía correo ni crea cuentas reales. Después prueba el Worker
y la interfaz real con Chromium y dos miembros. No demuestra que el SMTP o la
configuración de redirecciones del proyecto remoto estén activos.

Resoluciones: 1920, 1600, 1440, 1366, 1280, 1024, 768, 430, 390, 375 y 360 px.

El workflow `Comunidad Dinamarca` ejecuta esta suite sin depender de los workflows
antiguos del repositorio. Los assets y lógica de IA, academias, home y logo no se cambian.

Referencias: https://supabase.com/docs/guides/auth/passwords,
https://supabase.com/docs/guides/auth/sessions/pkce-flow,
https://supabase.com/docs/guides/database/postgres/row-level-security.
