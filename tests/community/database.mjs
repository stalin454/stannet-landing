import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { PGlite } = await import(
  process.env.COMMUNITY_TEST_PGLITE_MODULE || "@electric-sql/pglite"
);
export const A = "11111111-1111-4111-8111-111111111111",
  B = "22222222-2222-4222-8222-222222222222",
  C = "33333333-3333-4333-8333-333333333333";
export async function database() {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth;create table auth.users(id uuid primary key,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to authenticated;grant execute on function auth.uid(),auth.jwt() to authenticated;`,
  );
  await db.exec(
    await fs.readFile(
      new URL("../../supabase/community/001_community.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.query(
    "insert into auth.users values($1,now()),($2,now()),($3,null)",
    [A, B, C],
  );
  let chain = Promise.resolve();
  const as = (id, sql, params = [], admin = false) => {
    const job = chain.then(async () => {
      await db.exec("begin; set local role authenticated;");
      try {
        await db.query(
          "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
          [
            id,
            JSON.stringify({
              sub: id,
              app_metadata: { community_admin: admin },
            }),
          ],
        );
        const res = await db.query(sql, params);
        await db.exec("commit");
        return res;
      } catch (e) {
        await db.exec("rollback");
        throw e;
      }
    });
    chain = job.catch(() => {});
    return job;
  };
  return { db, as };
}
export const photo = "data:image/jpeg;base64,/9j/AAAAAAAAAAAAAA==";
export async function verifyDatabase() {
  const { db, as } = await database();
  await as(
    A,
    "insert into dk_profiles(id,display_name,city,bio) values($1,$2,$3,$4)",
    [A, "Ana", "Aarhus", ""],
  );
  await as(
    B,
    "insert into dk_profiles(id,display_name,city,bio) values($1,$2,$3,$4)",
    [B, "Luis", "Odense", ""],
  );
  await assert.rejects(
    () =>
      as(A, "insert into dk_profiles(id,display_name,city) values($1,$2,$3)", [
        C,
        "Falso",
        "Odense",
      ]),
    /row-level security/,
  );
  assert.equal(
    (await as(C, "select * from dk_profiles")).rows.length,
    0,
    "Unconfirmed users cannot read",
  );
  await assert.rejects(
    () =>
      as(
        A,
        "insert into dk_posts(author_id,topic,city,title,body) values($1,'trabajo','Aarhus','Busco trabajo','Experiencia en redes')",
        [A],
      ),
    /row-level security/,
  );
  await as(A, "update dk_profiles set avatar=$1,has_avatar=true where id=$2", [
    photo,
    A,
  ]);
  await as(B, "update dk_profiles set avatar=$1,has_avatar=true where id=$2", [
    photo,
    B,
  ]);
  const post = (
    await as(
      A,
      "insert into dk_posts(author_id,topic,city,title,body) values($1,'trabajo','Aarhus','Busco trabajo','Experiencia en redes') returning *",
      [A],
    )
  ).rows[0];
  assert.equal(
    (
      await as(B, "update dk_posts set title=$1 where id=$2 returning id", [
        "Otro título",
        post.id,
      ])
    ).rows.length,
    0,
    "Other members cannot edit",
  );
  assert.equal(
    (await as(B, "delete from dk_posts where id=$1 returning id", [post.id]))
      .rows.length,
    0,
    "Other members cannot delete",
  );
  await assert.rejects(
    () =>
      as(
        B,
        "insert into dk_posts(author_id,topic,city,title,body) values($1,'trabajo','Aarhus','Suplantación','No debe guardarse')",
        [A],
      ),
    /row-level security/,
  );
  await assert.rejects(
    () =>
      as(
        A,
        "insert into dk_posts(author_id,topic,city,title,body) values($1,'trabajo','Aarhus','Más trabajo','Publicación inmediata')",
        [A],
      ),
    /community_rate_limit/,
  );
  await assert.rejects(
    () => as(A, "update dk_posts set author_id=$1 where id=$2", [B, post.id]),
    /permission denied/,
  );
  await assert.rejects(
    () => as(A, "update dk_profiles set created_at=now() where id=$1", [A]),
    /permission denied/,
  );
  await as(
    B,
    "insert into dk_replies(post_id,author_id,body) values($1,$2,$3)",
    [post.id, B, "Te comparto mi experiencia"],
  );
  await as(
    B,
    "insert into dk_reports(post_id,reporter_id,reason) values($1,$2,$3)",
    [post.id, B, "Información dudosa"],
  );
  assert.equal(
    (await as(A, "select * from dk_reports")).rows.length,
    0,
    "Reports private to reporter/admin",
  );
  assert.equal(
    (await as(A, "select * from dk_reports", [], true)).rows.length,
    1,
  );
  await db.exec("set role anon");
  await assert.rejects(
    () => db.query("select * from dk_posts"),
    /permission denied/,
  );
  await db.exec("reset role");
  assert.equal(
    (await as(B, "delete from dk_profiles where id=$1 returning id", [A])).rows
      .length,
    0,
  );
  await as(A, "delete from dk_profiles where id=$1", [A]);
  assert.equal((await db.query("select * from dk_posts")).rows.length, 0);
  assert.equal((await db.query("select * from dk_replies")).rows.length, 0);
  assert.equal((await db.query("select * from dk_reports")).rows.length, 0);
  assert.equal(
    (await db.query("select * from auth.users")).rows.length,
    3,
    "Community deletion preserves account",
  );
  await db.close();
  console.log(
    "PASS PostgreSQL: migration, RLS, ownership, verified email, photo requirement, anti-spam, private reports, cascades and shared account preservation.",
  );
}
if (
  process.argv[1] &&
  import.meta.url === new URL("file://" + process.argv[1]).href
)
  await verifyDatabase();
