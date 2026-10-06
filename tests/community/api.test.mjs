import assert from "node:assert/strict";
import { handleCommunity } from "../../community-dinamarca/api.mjs";
import { provider } from "./provider.mjs";
import { A, B, C, photo } from "./database.mjs";
const p = await provider(),
  jars = { a: {}, b: {}, c: {}, new: {} };
async function call(
  who,
  path,
  method = "GET",
  data,
  origin = "https://stannet.space",
) {
  const jar = jars[who];
  const headers = {
    Cookie: Object.entries(jar)
      .map(([k, v]) => k + "=" + v)
      .join("; "),
  };
  if (method !== "GET") headers.Origin = origin;
  if (data !== undefined) headers["Content-Type"] = "application/json";
  const req = new Request("https://stannet.space/api/community" + path, {
      method,
      headers,
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
    r = await handleCommunity(req, {}, p.config);
  for (const c of r.headers.getSetCookie()) {
    const pair = c.split(";")[0],
      i = pair.indexOf("=");
    if (c.includes("Max-Age=0")) delete jar[pair.slice(0, i)];
    else jar[pair.slice(0, i)] = pair.slice(i + 1);
  }
  return {
    status: r.status,
    data: r.headers.get("Content-Type")?.includes("json")
      ? await r.json()
      : await r.arrayBuffer(),
    headers: r.headers,
  };
}
try {
  assert.equal((await call("a", "/posts")).status, 401);
  assert.equal(
    (
      await call(
        "a",
        "/auth/signin",
        "POST",
        { email: "ana@example.test", password: "Ana-Password-123" },
        "https://evil.example",
      )
    ).status,
    403,
  );
  let r = await call("a", "/auth/signin", "POST", {
    email: "ana@example.test",
    password: "Ana-Password-123",
  });
  assert.equal(r.status, 200);
  assert(
    r.headers
      .getSetCookie()
      .every(
        (v) =>
          v.includes("HttpOnly") &&
          v.includes("Secure") &&
          v.includes("SameSite=Strict"),
      ),
  );
  r = await call("a", "/session");
  assert.equal(r.data.profile.display_name, "Ana");
  assert.equal(r.data.profile.avatar, undefined);
  assert.equal(r.data.profile.email, undefined);
  const post = {
    title: "Busco trabajo en redes",
    body: "Experiencia con Linux y redes TCP/IP",
    topic: "trabajo",
    city: "Aarhus",
    author_id: B,
  };
  assert.equal((await call("a", "/posts", "POST", post)).status, 403);
  assert.equal(
    (
      await call("a", "/profile", "PATCH", {
        display_name: "Ana",
        city: "Aarhus",
        bio: "Hola",
        avatar: "data:image/svg+xml;base64,AAAA",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("a", "/profile", "PATCH", {
        display_name: "Ana",
        city: "Aarhus",
        bio: "Hola",
        avatar: photo,
        id: B,
      })
    ).status,
    200,
  );
  r = await call("a", "/posts", "POST", post);
  assert.equal(r.status, 201);
  assert.equal(r.data.post.author_id, A);
  const id = r.data.post.id;
  assert.equal((await call("a", "/posts", "POST", post)).status, 429);
  assert.equal(
    (
      await call("b", "/auth/signin", "POST", {
        email: "luis@example.test",
        password: "old-pass10",
      })
    ).status,
    200,
    "Existing shorter passwords supported",
  );
  await call("b", "/session");
  assert.equal((await call("b", "/posts/" + id, "PATCH", post)).status, 404);
  assert.equal((await call("b", "/posts/" + id, "DELETE")).status, 404);
  await call("b", "/profile", "PATCH", {
    display_name: "Luis",
    city: "Odense",
    bio: "Hola",
    avatar: photo,
  });
  assert.equal(
    (
      await call("b", "/posts/" + id + "/replies", "POST", {
        body: "Prueba de respuesta",
        author_id: A,
      })
    ).status,
    201,
  );
  r = await call("a", "/posts/" + id + "/replies");
  assert.equal(r.data.replies[0].author_id, B);
  assert.equal(
    (
      await call("b", "/reports", "POST", {
        post_id: id,
        reason: "Información dudosa",
      })
    ).status,
    201,
  );
  assert.equal((await call("a", "/moderation/reports")).status, 403);
  const unconfirmed = p.issue(p.users.get(C));
  jars.c.sn_dk_access = unconfirmed.access_token;
  assert.equal((await call("c", "/posts")).status, 403);
  const token = jars.a.sn_dk_access;
  p.tokens.delete(token);
  r = await call("a", "/session");
  assert.equal(r.status, 200);
  assert.notEqual(
    jars.a.sn_dk_access,
    token,
    "Expired access session refreshes",
  );
  assert.equal(
    (await call("a", "/posts?before=evil&cursor_id=bad")).status,
    400,
  );
  r = await call("new", "/auth/signup", "POST", {
    email: "new@example.test",
    password: "New-Password-123",
    display_name: "Nueva persona",
    city: "Aarhus",
    accept_rules: true,
  });
  assert.equal(r.data.requiresConfirmation, true);
  const user = [...p.users.values()].find(
    (u) => u.email === "new@example.test",
  );
  assert.equal(
    (
      await call("new", "/auth/callback", "POST", {
        code: "signup-code-" + user.id,
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("new", "/session")).data.profile.display_name,
    "Nueva persona",
  );
  assert.equal(
    (
      await call("new", "/auth/callback", "POST", {
        code: "signup-code-" + user.id,
      })
    ).status,
    400,
    "Cannot replay callback",
  );
  await call("new", "/auth/recover", "POST", { email: "new@example.test" });
  assert.equal(
    (
      await call("new", "/auth/callback", "POST", {
        code: "recovery-code-" + user.id,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await call("new", "/auth/password", "POST", {
        password: "Updated-Pass-123",
      })
    ).status,
    200,
  );
  assert.equal(Object.keys(jars.new).length, 0);
  assert.equal(
    (await call("a", "/profile", "DELETE", { password: "wrong-pass-123" }))
      .status,
    403,
  );
  assert.equal(
    (await call("a", "/profile", "DELETE", { password: "Ana-Password-123" }))
      .status,
    200,
  );
  assert.equal((await p.db.query("select * from dk_posts")).rows.length, 0);
  assert.equal(
    (await p.db.query("select * from auth.users where id=$1", [A])).rows.length,
    1,
  );
  console.log(
    "PASS API + PostgreSQL: CSRF, cookie security, signup/PKCE, email verification, shorter existing passwords, token refresh, avatars, owner controls, replies, reports, anti-spam, password recovery, profile deletion.",
  );
} finally {
  await p.close();
}
