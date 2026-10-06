// Test adapter: managed auth is simulated; all persistence/permissions use real PostgreSQL.
import { database, A, B, C } from "./database.mjs";
const origin = "https://community-test.invalid";
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
export async function provider() {
  const { db, as } = await database();
  const users = new Map([
    [
      A,
      {
        id: A,
        email: "ana@example.test",
        password: "Ana-Password-123",
        email_confirmed_at: "2026-10-06T00:00:00Z",
        user_metadata: { community_name: "Ana", community_city: "Aarhus" },
        app_metadata: {},
      },
    ],
    [
      B,
      {
        id: B,
        email: "luis@example.test",
        password: "old-pass10",
        email_confirmed_at: "2026-10-06T00:00:00Z",
        user_metadata: { community_name: "Luis", community_city: "Odense" },
        app_metadata: {},
      },
    ],
    [
      C,
      {
        id: C,
        email: "pending@example.test",
        password: "Pending-Pass-123",
        email_confirmed_at: null,
        user_metadata: {},
        app_metadata: {},
      },
    ],
  ]);
  const tokens = new Map(),
    refreshes = new Map(),
    codes = new Map(),
    calls = [];
  const publicUser = (u) =>
    Object.fromEntries(Object.entries(u).filter(([k]) => k !== "password"));
  const issue = (u) => {
    const access = crypto.randomUUID(),
      refresh = crypto.randomUUID();
    tokens.set(access, u.id);
    refreshes.set(refresh, u.id);
    return {
      access_token: access,
      refresh_token: refresh,
      expires_in: 3600,
      user: publicUser(u),
    };
  };
  const native = globalThis.fetch;
  async function mock(target, init = {}) {
    const url = new URL(target);
    if (url.origin !== origin) throw Error("Unexpected upstream " + url.origin);
    calls.push({ path: url.pathname, method: init.method || "GET" });
    const payload = init.body ? JSON.parse(init.body) : {},
      method = init.method || "GET",
      head = new Headers(init.headers),
      token = head.get("Authorization")?.replace("Bearer ", ""),
      u = users.get(tokens.get(token));
    if (url.pathname.startsWith("/auth/v1")) {
      const p = url.pathname.slice(8);
      if (p === "/signup") {
        if ([...users.values()].some((u) => u.email === payload.email))
          return json({ user: {} }, 200);
        const id = crypto.randomUUID(),
          created = {
            id,
            email: payload.email,
            password: payload.password,
            email_confirmed_at: null,
            user_metadata: payload.data,
            app_metadata: {},
          };
        users.set(id, created);
        await db.query("insert into auth.users values($1,null)", [id]);
        codes.set("signup-code-" + id, {
          id,
          challenge: payload.code_challenge,
        });
        return json({ user: publicUser(created) });
      }
      if (p === "/recover") {
        const user = [...users.values()].find((u) => u.email === payload.email);
        if (user)
          codes.set("recovery-code-" + user.id, {
            id: user.id,
            challenge: payload.code_challenge,
          });
        return json({});
      }
      if (p === "/token" && url.searchParams.get("grant_type") === "password") {
        const user = [...users.values()].find(
          (u) => u.email === payload.email && u.password === payload.password,
        );
        return user && user.email_confirmed_at
          ? json(issue(user))
          : json({ error: "invalid" }, 400);
      }
      if (
        p === "/token" &&
        url.searchParams.get("grant_type") === "refresh_token"
      ) {
        const user = users.get(refreshes.get(payload.refresh_token));
        if (!user) return json({ error: "invalid" }, 400);
        refreshes.delete(payload.refresh_token);
        return json(issue(user));
      }
      if (p === "/token" && url.searchParams.get("grant_type") === "pkce") {
        const c = codes.get(payload.auth_code);
        if (!c) return json({ error: "invalid" }, 400);
        const hash = Buffer.from(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(payload.code_verifier || ""),
          ),
        ).toString("base64url");
        if (hash !== c.challenge) return json({ error: "invalid" }, 400);
        codes.delete(payload.auth_code);
        const user = users.get(c.id);
        user.email_confirmed_at = "2026-10-06T00:00:00Z";
        await db.query(
          "update auth.users set email_confirmed_at=now() where id=$1",
          [c.id],
        );
        return json(issue(user));
      }
      if (p === "/user" && method === "GET")
        return u ? json(publicUser(u)) : json({}, 401);
      if (p === "/user" && method === "PUT") {
        if (!u) return json({}, 401);
        u.password = payload.password;
        return json(publicUser(u));
      }
      if (p === "/logout") {
        if (u) {
          for (const [t, id] of tokens)
            if (
              t === token ||
              (url.searchParams.get("scope") === "global" && id === u.id)
            )
              tokens.delete(t);
          if (url.searchParams.get("scope") === "global")
            for (const [t, id] of refreshes)
              if (id === u.id) refreshes.delete(t);
        }
        return json({});
      }
      return json({ error: p }, 404);
    }
    if (!u) return json({}, 401);
    const table = url.pathname.slice("/rest/v1/".length);
    if (
      !["dk_profiles", "dk_posts", "dk_replies", "dk_reports"].includes(table)
    )
      return json({ code: "PGRST205" }, 404);
    try {
      const args = [],
        where = [];
      for (const [k, v] of url.searchParams) {
        if (["select", "order", "limit", "offset", "or"].includes(k)) continue;
        if (!/^[a-z_]+$/.test(k)) throw Error("bad field");
        const dot = v.indexOf("."),
          op = v.slice(0, dot),
          value = v.slice(dot + 1);
        args.push(value);
        where.push(
          `${k} ${op === "eq" ? "=" : op === "ilike" ? "ilike" : op === "lt" ? "<" : "="} $${args.length}`,
        );
      }
      const predicate = where.length ? " where " + where.join(" and ") : "";
      let query;
      if (method === "POST") {
        const keys = Object.keys(payload);
        keys.forEach((k) => {
          if (!/^[a-z_]+$/.test(k)) throw Error("bad field");
        });
        args.length = 0;
        keys.forEach((k) => args.push(payload[k]));
        query = `insert into ${table}(${keys.join(",")}) values(${keys.map((k, i) => "$" + (i + 1)).join(",")}) returning *`;
      } else if (method === "PATCH") {
        const keys = Object.keys(payload),
          sets = keys.map((k) => {
            if (!/^[a-z_]+$/.test(k)) throw Error("bad field");
            args.push(payload[k]);
            return k + "=$" + args.length;
          });
        query = `update ${table} set ${sets.join(",")}${predicate} returning *`;
      } else if (method === "DELETE")
        query = `delete from ${table}${predicate} returning *`;
      else {
        let order = url.searchParams.get("order") || "created_at.asc";
        if (!/^[a-z_]+\.(asc|desc)(,[a-z_]+\.(asc|desc))*$/.test(order))
          throw Error("bad order");
        order = order.replaceAll(".", " ");
        const limit = Number(url.searchParams.get("limit") || 100),
          offset = Number(url.searchParams.get("offset") || 0);
        query = `select * from ${table}${predicate} order by ${order} limit ${limit} offset ${offset}`;
      }
      const rows = (
        await as(u.id, query, args, u.app_metadata.community_admin === true)
      ).rows;
      const select = url.searchParams.get("select");
      for (const row of rows) {
        if (select?.includes("author:"))
          row.author = (
            await as(
              u.id,
              "select id,display_name,city,bio,has_avatar,created_at from dk_profiles where id=$1",
              [row.author_id],
            )
          ).rows[0];
        if (select && !select.includes("author:") && !select.includes("*"))
          for (const key of Object.keys(row))
            if (!select.split(",").includes(key)) delete row[key];
      }
      return json(rows, method === "POST" ? 201 : 200);
    } catch (e) {
      return json(
        { code: e.code, message: e.message },
        e.code === "23505" ? 409 : e.code === "42501" ? 403 : 400,
      );
    }
  }
  globalThis.fetch = mock;
  return {
    db,
    as,
    users,
    tokens,
    refreshes,
    codes,
    calls,
    config: { url: origin, key: "test-publishable" },
    issue,
    close: async () => {
      globalThis.fetch = native;
      await db.close();
    },
  };
}
