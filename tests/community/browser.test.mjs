import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { provider } from "./provider.mjs";
import { handleCommunity } from "../../community-dinamarca/api.mjs";
const { chromium } = await import(
  process.env.COMMUNITY_TEST_PLAYWRIGHT_MODULE || "playwright"
);
const site = path.resolve(new URL("../..", import.meta.url).pathname),
  fixture = await provider(),
  errors = [];
const server = http.createServer(async (req, res) => {
  try {
    const origin = "http://localhost:" + server.address().port,
      url = new URL(req.url, origin);
    if (url.pathname.startsWith("/api/community")) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const response = await handleCommunity(
        new Request(url, {
          method: req.method,
          headers: req.headers,
          body: ["GET", "HEAD"].includes(req.method)
            ? undefined
            : Buffer.concat(chunks),
        }),
        {},
        fixture.config,
      );
      res.statusCode = response.status;
      response.headers.forEach((v, k) => {
        if (k !== "set-cookie") res.setHeader(k, v);
      });
      if (response.headers.getSetCookie().length)
        res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    const filename = path.resolve(site, "." + decodeURIComponent(url.pathname));
    if (!filename.startsWith(site + "/")) {
      res.writeHead(403);
      res.end();
      return;
    }
    const content = await fs.readFile(filename);
    const ext = path.extname(filename);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
      }[ext] || "application/octet-stream",
    );
    res.end(content);
  } catch (e) {
    res.statusCode = 404;
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = "http://localhost:" + server.address().port;
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
  ...(process.env.COMMUNITY_TEST_CHROMIUM
    ? { executablePath: process.env.COMMUNITY_TEST_CHROMIUM }
    : {}),
});
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1cAAAAASUVORK5CYII=",
  "base64",
);
const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
  }),
  page = await context.newPage();
async function prepare(p) {
  p.on("pageerror", (e) => errors.push(e.message));
  await p.route("https://**", (r) => r.abort());
}
await prepare(page);
const root = page.locator("#comunidad");
async function photo(p) {
  await p
    .locator("#dkc-photo")
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
  await p
    .locator("#dkc-status")
    .filter({ hasText: "Foto preparada" })
    .waitFor();
  await p
    .locator("#dkc-profile-form")
    .getByRole("button", { name: "Guardar perfil", exact: true })
    .click();
  await p
    .locator("#dkc-status")
    .filter({ hasText: "Perfil guardado" })
    .waitFor();
}
try {
  await page.goto(origin + "/pages/comunidad-dinamarca.html#comunidad");
  await root.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const form = page.locator("#dkc-auth-form");
  await form.getByLabel("Nombre visible").fill("Persona nueva");
  await form.getByLabel("Correo electrónico").fill("browser@example.test");
  await form
    .getByLabel("Contraseña", { exact: true })
    .fill("Browser-Password-123");
  await form.getByLabel("Acepto las normas", { exact: false }).check();
  await form.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page
    .locator("#dkc-status")
    .filter({ hasText: "Revisa tu correo" })
    .waitFor();
  const created = [...fixture.users.values()].find(
    (u) => u.email === "browser@example.test",
  );
  await page.goto(
    origin +
      "/pages/comunidad-dinamarca.html?code=signup-code-" +
      created.id +
      "#comunidad",
  );
  await page
    .locator("#dkc-welcome")
    .filter({ hasText: "Persona nueva" })
    .waitFor();
  assert(!page.url().includes("code="));
  await photo(page);
  await page.locator("#dkc-new-toggle").click();
  const post = page.locator("#dkc-post-form");
  await post
    .getByLabel("Título", { exact: true })
    .fill("Busco vivienda en Aarhus");
  await post
    .getByLabel("Tu publicación")
    .fill(
      "Quiero conocer experiencias sobre vivienda. <img src=x onerror=alert(1)>",
    );
  await post.getByRole("button", { name: "Guardar publicación" }).click();
  await page
    .locator("#dkc-feed h3")
    .filter({ hasText: "Busco vivienda en Aarhus" })
    .waitFor();
  assert.equal(
    await page.locator("#dkc-feed img[src=x]").count(),
    0,
    "Stored content rendered as text",
  );
  await page.reload();
  await page
    .locator("#dkc-feed h3")
    .filter({ hasText: "Busco vivienda en Aarhus" })
    .waitFor();
  await page
    .locator("#dkc-feed")
    .getByRole("button", { name: "Ver y responder" })
    .click();
  const dialog = page.locator("#dkc-dialog");
  await dialog
    .getByLabel("Tu respuesta")
    .fill("Gracias por compartir tus experiencias.");
  await dialog.getByRole("button", { name: "Publicar respuesta" }).click();
  await dialog
    .locator(".dkc-reply")
    .filter({ hasText: "Gracias por compartir" })
    .waitFor();
  await page.locator("#dkc-dialog-close").click();
  for (const width of [
    1920, 1600, 1440, 1366, 1280, 1024, 768, 430, 390, 375, 360,
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await root.isVisible());
    const nav = page.locator("#stannet-canonical-nav .site-nav"),
      toggle = page.locator("#stannet-canonical-nav .menu-toggle");
    if (width >= 1024) {
      assert(await nav.isVisible());
      assert(!(await toggle.isVisible()));
    } else {
      assert(!(await nav.isVisible()));
      assert(await toggle.isVisible());
    }
    const overflow = await root.evaluate(
      (e) => e.scrollWidth > e.clientWidth + 1,
    );
    assert(!overflow, "Community horizontal overflow at " + width);
    console.log("PASS browser responsive", width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("#dkc-feed")
    .getByRole("button", { name: "Ver y responder" })
    .click();
  await dialog.waitFor();
  const rect = await dialog.boundingBox();
  assert(rect.x >= 0 && rect.x + rect.width <= 391);
  await page.locator("#dkc-dialog-close").click();
  const second = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    p2 = await second.newPage();
  await prepare(p2);
  await p2.goto(origin + "/pages/comunidad-dinamarca.html#comunidad");
  await p2.locator("#dkc-auth-form [name=email]").fill("luis@example.test");
  await p2.locator("#dkc-auth-form [name=password]").fill("old-pass10");
  await p2.locator("#dkc-auth-submit").click();
  await p2.locator("#dkc-welcome").filter({ hasText: "Luis" }).waitFor();
  await photo(p2);
  assert.equal(
    await p2
      .locator("#dkc-feed")
      .getByRole("button", { name: "Editar", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await p2
      .locator("#dkc-feed")
      .getByRole("button", { name: "Eliminar", exact: true })
      .count(),
    0,
  );
  await p2
    .locator("#dkc-feed")
    .getByRole("button", { name: "Ver y responder" })
    .click();
  await p2
    .locator("#dkc-dialog")
    .getByLabel("Tu respuesta")
    .fill("Soy otro miembro y puedo responder.");
  await p2
    .locator("#dkc-dialog")
    .getByRole("button", { name: "Publicar respuesta" })
    .click();
  await p2
    .locator("#dkc-dialog .dkc-reply")
    .filter({ hasText: "Soy otro miembro" })
    .waitFor();
  await second.close();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page
    .locator("#dkc-feed")
    .getByRole("button", { name: "Eliminar", exact: true })
    .click({ trial: true });
  page.once("dialog", (d) => d.accept());
  await page
    .locator("#dkc-feed")
    .getByRole("button", { name: "Eliminar", exact: true })
    .click();
  await page
    .locator("#dkc-status")
    .filter({ hasText: "Publicación eliminada" })
    .waitFor();
  assert.equal(await page.locator("#dkc-feed h3").count(), 0);
  await page.locator("#dkc-signout").click();
  await page.locator("#dkc-auth-form").waitFor();
  await page.reload();
  await page.locator("#dkc-auth-form").waitFor();
  assert.equal(
    errors.filter((e) => /community|dkc|Cannot read|not a function/.test(e))
      .length,
    0,
    JSON.stringify(errors),
  );
  console.log(
    "PASS browser E2E: signup, email callback, avatar, persistent session/feed, safe text, replies, two members, ownership, deletion, signout and mobile dialog.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
  await fixture.close();
}
