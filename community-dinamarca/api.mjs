const PREFIX = "/api/community";
const ACCESS = "sn_dk_access",
  REFRESH = "sn_dk_refresh",
  VERIFIER = "sn_dk_pkce";
const TOPICS = [
  "vivienda",
  "trabajo",
  "tramites",
  "estudios",
  "ciudades",
  "comunidad",
];
const CITIES = [
  "Copenhague",
  "Aarhus",
  "Odense",
  "Aalborg",
  "Vejle",
  "Kolding",
  "Fredericia",
  "Horsens",
  "Otra ciudad",
  "Todavía fuera de Dinamarca",
];
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PUBLIC_PROFILE = "id,display_name,city,bio,has_avatar,created_at";
function reply(data, status = 200, cookies = []) {
  const h = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(JSON.stringify(data), { status, headers: h });
}
function cookie(name, value, age) {
  return `${name}=${encodeURIComponent(value)}; Path=${PREFIX}; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
}
function cookiesOf(req) {
  const out = {};
  for (const part of (req.headers.get("Cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(
        part.slice(i + 1).trim(),
      );
    } catch {}
  }
  return out;
}
const clear = () => [
  cookie(ACCESS, "", 0),
  cookie(REFRESH, "", 0),
  cookie(VERIFIER, "", 0),
];
const sessionCookies = (data) => [
  cookie(
    ACCESS,
    data.access_token,
    Math.min(Number(data.expires_in) || 3600, 3600),
  ),
  cookie(REFRESH, data.refresh_token, 2592000),
];
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
function text(value, min, max, label) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw fail(`${label}: entre ${min} y ${max} caracteres.`);
  return value.trim();
}
function choice(value, values, label) {
  if (!values.includes(value)) throw fail(`${label} no válido.`);
  return value;
}
async function body(req) {
  if (Number(req.headers.get("Content-Length")) > 400000)
    throw fail("Solicitud demasiado grande.", 413);
  const raw = await req.text();
  if (raw.length > 400000) throw fail("Solicitud demasiado grande.", 413);
  try {
    const b = JSON.parse(raw);
    if (!b || Array.isArray(b) || typeof b !== "object") throw Error();
    return b;
  } catch {
    throw fail("Solicitud no válida.");
  }
}
function encode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
async function pkce() {
  const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = encode(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );
  return { verifier, challenge };
}
function image(value) {
  if (
    typeof value !== "string" ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(value)
  )
    throw fail("Usa una foto JPEG, PNG o WebP.");
  const [head, encoded] = value.split(",");
  let raw;
  try {
    raw = atob(encoded);
  } catch {
    throw fail("Foto no válida.");
  }
  if (raw.length > 180000 || raw.length < 12)
    throw fail("La foto debe ocupar menos de 180 KB.");
  const a = Uint8Array.from(raw, (c) => c.charCodeAt(0));
  const mime = head.slice(5, head.indexOf(";"));
  const valid =
    mime === "image/jpeg"
      ? a[0] === 255 && a[1] === 216 && a[2] === 255
      : mime === "image/png"
        ? [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => a[i] === n)
        : raw.slice(0, 4) === "RIFF" && raw.slice(8, 12) === "WEBP";
  if (!valid) throw fail("El contenido no coincide con el formato de la foto.");
  return { value, bytes: a, mime };
}

export async function handleCommunity(request, env, config) {
  const url = new URL(request.url),
    path = url.pathname.slice(PREFIX.length),
    method = request.method;
  if (!["GET", "POST", "PATCH", "DELETE"].includes(method))
    return reply({ error: "Método no permitido." }, 405);
  if (method !== "GET" && request.headers.get("Origin") !== url.origin)
    return reply({ error: "Origen no permitido." }, 403);
  const settings = {
    url: env.COMMUNITY_SUPABASE_URL || config.url,
    key: env.COMMUNITY_SUPABASE_KEY || config.key,
  };
  const provider = async (target, init = {}) => {
    const h = new Headers(init.headers);
    h.set("apikey", settings.key);
    if (init.body) h.set("Content-Type", "application/json");
    let res;
    try {
      res = await fetch(settings.url + target, {
        ...init,
        headers: h,
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw fail(
        "La comunidad no está disponible temporalmente. Inténtalo de nuevo.",
        503,
      );
    }
    return res;
  };
  const authFetch = (target, init = {}) => provider("/auth/v1" + target, init);
  let pending = [];
  const rest = async (target, token, init = {}) => {
    const res = await provider("/rest/v1/" + target, {
      ...init,
      headers: {
        Authorization: "Bearer " + token,
        Prefer: "return=representation",
        ...init.headers,
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (["42P01", "PGRST205", "PGRST200"].includes(data?.code))
        throw fail("La comunidad está pendiente de activación.", 503);
      if (data?.message?.includes("community_rate_limit"))
        throw fail("Espera antes de publicar de nuevo.", 429);
      if (res.status === 409) throw fail("El registro ya existe.", 409);
      if (res.status === 401 || res.status === 403)
        throw fail("No tienes permiso para esta acción.", 403);
      throw fail("No se pudo guardar o consultar la información.", 502);
    }
    return data;
  };
  const auth = async () => {
    const c = cookiesOf(request);
    let token = c[ACCESS],
      user = null;
    const read = async (t) => {
      if (!t) return null;
      const r = await authFetch("/user", {
        headers: { Authorization: "Bearer " + t },
      });
      return r.ok ? r.json() : null;
    };
    user = await read(token);
    if (!user && c[REFRESH]) {
      const r = await authFetch("/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: c[REFRESH] }),
      });
      if (r.ok) {
        const d = await r.json();
        token = d.access_token;
        user = await read(token);
        pending = sessionCookies(d);
      }
    }
    if (!user) {
      pending = clear();
      throw fail("Inicia sesión para entrar en la comunidad.", 401);
    }
    if (!user.email_confirmed_at)
      throw fail("Confirma tu correo antes de entrar.", 403);
    return { user, token };
  };
  const ensureProfile = async (a) => {
    const found = await rest(
      "dk_profiles?id=eq." + a.user.id + "&select=" + PUBLIC_PROFILE,
      a.token,
    );
    if (found.length) return found[0];
    const meta = a.user.user_metadata || {};
    const name =
      typeof meta.community_name === "string"
        ? meta.community_name.trim().slice(0, 70)
        : "";
    return (
      await rest("dk_profiles?select=" + PUBLIC_PROFILE, a.token, {
        method: "POST",
        body: JSON.stringify({
          id: a.user.id,
          display_name: name.length >= 2 ? name : "Nuevo miembro",
          city: CITIES.includes(meta.community_city)
            ? meta.community_city
            : CITIES.at(-1),
          bio: "",
        }),
      })
    )[0];
  };
  const profileReady = async (a) => {
    const p = await ensureProfile(a);
    if (!p.has_avatar)
      throw fail("Añade tu foto al perfil antes de publicar.", 403);
    return p;
  };
  const email = (b) => {
    const e = text(b.email, 5, 254, "Correo").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw fail("Correo no válido.");
    return e;
  };
  const loginPassword = (b) => {
    if (
      typeof b.password !== "string" ||
      !b.password ||
      b.password.length > 256
    )
      throw fail("Contraseña no válida.");
    return b.password;
  };
  const password = (b) => {
    if (
      typeof b.password !== "string" ||
      b.password.length < 12 ||
      b.password.length > 128
    )
      throw fail("Usa una contraseña de entre 12 y 128 caracteres.");
    return b.password;
  };
  try {
    if (path === "/auth/signup" && method === "POST") {
      const b = await body(request),
        e = email(b),
        p = password(b),
        name = text(b.display_name, 2, 70, "Nombre"),
        city = choice(b.city, CITIES, "Ciudad");
      if (b.accept_rules !== true)
        throw fail("Acepta las normas y la información de privacidad.");
      const k = await pkce(),
        redirect = url.origin + "/pages/ruta-dinamarca.html#comunidad";
      const r = await authFetch(
        "/signup?redirect_to=" + encodeURIComponent(redirect),
        {
          method: "POST",
          body: JSON.stringify({
            email: e,
            password: p,
            data: {
              community_name: name,
              community_city: city,
              community_rules_version: "2026-10-06",
            },
            code_challenge: k.challenge,
            code_challenge_method: "s256",
          }),
        },
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw fail(
          r.status === 429
            ? "Espera antes de solicitar otro registro."
            : "No se pudo completar el registro. Si ya tienes cuenta, inicia sesión.",
          r.status === 429 ? 429 : 400,
        );
      if (d.access_token)
        return reply(
          { ok: true, requiresConfirmation: false },
          200,
          sessionCookies(d),
        );
      return reply(
        {
          ok: true,
          requiresConfirmation: true,
          message:
            "Revisa tu correo para confirmar el registro. Si ya tienes cuenta, inicia sesión.",
        },
        200,
        [cookie(VERIFIER, k.verifier, 900)],
      );
    }
    if (path === "/auth/signin" && method === "POST") {
      const b = await body(request);
      const r = await authFetch("/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({ email: email(b), password: loginPassword(b) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok)
        throw fail(
          r.status === 429
            ? "Demasiados intentos. Espera e inténtalo de nuevo."
            : "Correo o contraseña incorrectos, o correo pendiente de confirmar.",
          r.status === 429 ? 429 : 401,
        );
      return reply({ ok: true }, 200, [
        ...sessionCookies(d),
        cookie(VERIFIER, "", 0),
      ]);
    }
    if (path === "/auth/recover" && method === "POST") {
      const b = await body(request),
        k = await pkce(),
        redirect =
          url.origin +
          "/pages/ruta-dinamarca.html?community_recovery=1#comunidad";
      const r = await authFetch(
        "/recover?redirect_to=" + encodeURIComponent(redirect),
        {
          method: "POST",
          body: JSON.stringify({
            email: email(b),
            code_challenge: k.challenge,
            code_challenge_method: "s256",
          }),
        },
      );
      if (r.status === 429)
        throw fail("Espera antes de solicitar otro correo.", 429);
      if (!r.ok)
        throw fail(
          "No se pudo solicitar la recuperación. Inténtalo más tarde.",
          503,
        );
      return reply(
        {
          ok: true,
          message:
            "Si existe una cuenta con ese correo, recibirás un enlace. Ábrelo en este mismo navegador.",
        },
        200,
        [cookie(VERIFIER, k.verifier, 900)],
      );
    }
    if (path === "/auth/callback" && method === "POST") {
      const b = await body(request),
        verifier = cookiesOf(request)[VERIFIER];
      if (!verifier)
        throw fail(
          "El enlace ha caducado o se abrió en otro navegador. Solicita uno nuevo.",
        );
      const code = text(b.code, 10, 2048, "Código");
      const r = await authFetch("/token?grant_type=pkce", {
        method: "POST",
        body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.access_token)
        throw fail("El enlace no es válido o ha caducado.");
      return reply({ ok: true }, 200, [
        ...sessionCookies(d),
        cookie(VERIFIER, "", 0),
      ]);
    }
    if (path === "/auth/signout" && method === "POST") {
      try {
        const a = await auth();
        await authFetch("/logout?scope=local", {
          method: "POST",
          headers: { Authorization: "Bearer " + a.token },
        });
      } catch {}
      return reply({ ok: true }, 200, clear());
    }
    const a = await auth();
    if (path === "/auth/password" && method === "POST") {
      const b = await body(request);
      const r = await authFetch("/user", {
        method: "PUT",
        headers: { Authorization: "Bearer " + a.token },
        body: JSON.stringify({ password: password(b) }),
      });
      if (!r.ok)
        throw fail(
          "No se pudo cambiar la contraseña. Solicita un nuevo enlace.",
        );
      await authFetch("/logout?scope=global", {
        method: "POST",
        headers: { Authorization: "Bearer " + a.token },
      });
      return reply({ ok: true }, 200, clear());
    }
    if (path === "/session" && method === "GET")
      return reply(
        {
          user: { id: a.user.id, email: a.user.email },
          profile: await ensureProfile(a),
          isAdmin: a.user.app_metadata?.community_admin === true,
        },
        200,
        pending,
      );
    if (path === "/profile" && method === "PATCH") {
      const b = await body(request);
      const record = {
        display_name: text(b.display_name, 2, 70, "Nombre"),
        city: choice(b.city, CITIES, "Ciudad"),
        bio: text(b.bio ?? "", 0, 500, "Presentación"),
      };
      if (b.avatar) {
        record.avatar = image(b.avatar).value;
        record.has_avatar = true;
      }
      const rows = await rest(
        "dk_profiles?id=eq." + a.user.id + "&select=" + PUBLIC_PROFILE,
        a.token,
        { method: "PATCH", body: JSON.stringify(record) },
      );
      return reply({ profile: rows[0] }, 200, pending);
    }
    if (path === "/profile" && method === "DELETE") {
      const b = await body(request),
        r = await authFetch("/token?grant_type=password", {
          method: "POST",
          body: JSON.stringify({
            email: a.user.email,
            password: loginPassword(b),
          }),
        });
      const check = await r.json().catch(() => ({}));
      if (!r.ok || check.user?.id !== a.user.id)
        throw fail("Contraseña incorrecta.", 403);
      await rest("dk_profiles?id=eq." + a.user.id, a.token, {
        method: "DELETE",
      });
      await authFetch("/logout?scope=local", {
        method: "POST",
        headers: { Authorization: "Bearer " + a.token },
      });
      if (check.access_token)
        await authFetch("/logout?scope=local", {
          method: "POST",
          headers: { Authorization: "Bearer " + check.access_token },
        });
      return reply({ ok: true }, 200, clear());
    }
    const profileMatch = path.match(/^\/profiles\/([0-9a-f-]+)$/i);
    if (profileMatch && method === "GET") {
      if (!ID.test(profileMatch[1])) throw fail("Perfil no válido.");
      const rows = await rest(
        "dk_profiles?id=eq." + profileMatch[1] + "&select=" + PUBLIC_PROFILE,
        a.token,
      );
      if (!rows.length) throw fail("Perfil no encontrado.", 404);
      return reply({ profile: rows[0] }, 200, pending);
    }
    const avatarMatch = path.match(/^\/profiles\/([0-9a-f-]+)\/avatar$/i);
    if (avatarMatch && method === "GET") {
      if (!ID.test(avatarMatch[1])) throw fail("Perfil no válido.");
      const rows = await rest(
        "dk_profiles?id=eq." + avatarMatch[1] + "&select=avatar",
        a.token,
      );
      if (!rows[0]?.avatar) throw fail("Foto no encontrada.", 404);
      const im = image(rows[0].avatar),
        h = new Headers({
          "Content-Type": im.mime,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        });
      pending.forEach((c) => h.append("Set-Cookie", c));
      return new Response(im.bytes, { headers: h });
    }
    if (path === "/posts" && method === "GET") {
      let query =
        "dk_posts?select=id,author_id,topic,city,title,body,created_at,updated_at,author:dk_profiles!dk_posts_author_id_fkey(" +
        PUBLIC_PROFILE +
        ")&order=created_at.desc,id.desc&limit=21";
      if (url.searchParams.has("topic"))
        query +=
          "&topic=eq." + choice(url.searchParams.get("topic"), TOPICS, "Tema");
      if (url.searchParams.has("city"))
        query +=
          "&city=eq." +
          encodeURIComponent(
            choice(url.searchParams.get("city"), CITIES, "Ciudad"),
          );
      const search = url.searchParams.get("search")?.trim();
      if (search) {
        text(search, 1, 80, "Búsqueda");
        query +=
          "&title=ilike." +
          encodeURIComponent("*" + search.replace(/[*,%_]/g, "") + "*");
      }
      const before = url.searchParams.get("before"),
        cursorId = url.searchParams.get("cursor_id");
      if (before) {
        if (
          !/^\d{4}-\d\d-\d\dT[\d:.+-]+Z?$/.test(before) ||
          !ID.test(cursorId || "")
        )
          throw fail("Página no válida.");
        query +=
          "&or=" +
          encodeURIComponent(
            "(created_at.lt." +
              before +
              ",and(created_at.eq." +
              before +
              ",id.lt." +
              cursorId +
              "))",
          );
      }
      const rows = await rest(query, a.token),
        more = rows.length > 20;
      const posts = rows.slice(0, 20),
        last = posts.at(-1);
      return reply(
        {
          posts,
          next: more ? { before: last.created_at, cursor_id: last.id } : null,
        },
        200,
        pending,
      );
    }
    if (path === "/posts" && method === "POST") {
      await profileReady(a);
      const b = await body(request),
        rows = await rest("dk_posts", a.token, {
          method: "POST",
          body: JSON.stringify({
            author_id: a.user.id,
            topic: choice(b.topic, TOPICS, "Tema"),
            city: choice(b.city, CITIES, "Ciudad"),
            title: text(b.title, 5, 140, "Título"),
            body: text(b.body, 10, 5000, "Publicación"),
          }),
        });
      return reply({ post: rows[0] }, 201, pending);
    }
    const postMatch = path.match(/^\/posts\/([0-9a-f-]+)$/i);
    if (postMatch) {
      const id = postMatch[1];
      if (!ID.test(id)) throw fail("Publicación no válida.");
      if (method === "GET") {
        const rows = await rest(
          "dk_posts?id=eq." +
            id +
            "&select=*,author:dk_profiles!dk_posts_author_id_fkey(" +
            PUBLIC_PROFILE +
            ")",
          a.token,
        );
        if (!rows.length) throw fail("Publicación no encontrada.", 404);
        return reply({ post: rows[0] }, 200, pending);
      }
      if (method === "PATCH" || method === "DELETE") {
        const init = { method };
        if (method === "PATCH") {
          const b = await body(request);
          init.body = JSON.stringify({
            title: text(b.title, 5, 140, "Título"),
            body: text(b.body, 10, 5000, "Publicación"),
            topic: choice(b.topic, TOPICS, "Tema"),
            city: choice(b.city, CITIES, "Ciudad"),
          });
        }
        const rows = await rest(
          "dk_posts?id=eq." + id + "&author_id=eq." + a.user.id,
          a.token,
          init,
        );
        if (!rows.length)
          throw fail("No tienes permiso o la publicación ya no existe.", 404);
        return reply({ ok: true, post: rows[0] }, 200, pending);
      }
    }
    const thread = path.match(/^\/posts\/([0-9a-f-]+)\/replies$/i);
    if (thread) {
      const id = thread[1];
      if (!ID.test(id)) throw fail("Publicación no válida.");
      if (method === "GET") {
        const offset = Number(url.searchParams.get("offset") || 0);
        if (!Number.isInteger(offset) || offset < 0 || offset > 100000)
          throw fail("Página no válida.");
        const rows = await rest(
          "dk_replies?post_id=eq." +
            id +
            "&select=id,post_id,author_id,body,created_at,author:dk_profiles!dk_replies_author_id_fkey(" +
            PUBLIC_PROFILE +
            ")&order=created_at.asc,id.asc&limit=51&offset=" +
            offset,
          a.token,
        );
        return reply(
          {
            replies: rows.slice(0, 50),
            next: rows.length > 50 ? offset + 50 : null,
          },
          200,
          pending,
        );
      }
      if (method === "POST") {
        await profileReady(a);
        const b = await body(request),
          rows = await rest("dk_replies", a.token, {
            method: "POST",
            body: JSON.stringify({
              post_id: id,
              author_id: a.user.id,
              body: text(b.body, 2, 2000, "Respuesta"),
            }),
          });
        return reply({ reply: rows[0] }, 201, pending);
      }
    }
    const rm = path.match(/^\/replies\/([0-9a-f-]+)$/i);
    if (rm && method === "DELETE") {
      if (!ID.test(rm[1])) throw fail("Respuesta no válida.");
      const rows = await rest(
        "dk_replies?id=eq." + rm[1] + "&author_id=eq." + a.user.id,
        a.token,
        { method: "DELETE" },
      );
      if (!rows.length)
        throw fail("No tienes permiso o la respuesta ya no existe.", 404);
      return reply({ ok: true }, 200, pending);
    }
    if (path === "/reports" && method === "POST") {
      const b = await body(request);
      if (!ID.test(b.post_id || "")) throw fail("Publicación no válida.");
      await rest("dk_reports", a.token, {
        method: "POST",
        body: JSON.stringify({
          reporter_id: a.user.id,
          post_id: b.post_id,
          reason: text(b.reason, 5, 500, "Motivo"),
        }),
      });
      return reply({ ok: true }, 201, pending);
    }
    if (path === "/moderation/reports" && method === "GET") {
      if (a.user.app_metadata?.community_admin !== true)
        throw fail("Acceso restringido.", 403);
      const rows = await rest(
        "dk_reports?select=*,post:dk_posts(id,title),reporter:dk_profiles!dk_reports_reporter_id_fkey(" +
          PUBLIC_PROFILE +
          ")&order=created_at.asc&limit=100",
        a.token,
      );
      return reply({ reports: rows }, 200, pending);
    }
    const moderation = path.match(/^\/moderation\/posts\/([0-9a-f-]+)$/i);
    if (moderation && method === "DELETE") {
      if (a.user.app_metadata?.community_admin !== true)
        throw fail("Acceso restringido.", 403);
      if (!ID.test(moderation[1])) throw fail("Publicación no válida.");
      const rows = await rest("dk_posts?id=eq." + moderation[1], a.token, {
        method: "DELETE",
      });
      if (!rows.length) throw fail("Publicación no encontrada.", 404);
      return reply({ ok: true }, 200, pending);
    }
    return reply({ error: "Ruta no encontrada." }, 404, pending);
  } catch (e) {
    return reply(
      {
        error: e.status
          ? e.message
          : "La comunidad no está disponible temporalmente.",
      },
      e.status || 503,
      pending,
    );
  }
}
