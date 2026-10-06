const root = document.querySelector("#comunidad.dk-community");
if (root) {
  const $ = (s) => root.querySelector(s),
    status = $("#dkc-status");
  const topics = {
    vivienda: "Vivienda",
    trabajo: "Trabajo",
    tramites: "Trámites",
    estudios: "Estudios",
    ciudades: "Ciudades",
    comunidad: "Comunidad",
  };
  const cities = [
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
  let session = null,
    mode = "signin",
    next = null,
    editing = null,
    avatar = null,
    photoBusy = false,
    feedBusy = false,
    threadId = null,
    threadEpoch = 0;
  const callbacks = new URL(location.href),
    authCode = callbacks.searchParams.get("code"),
    recovery = callbacks.searchParams.get("community_recovery") === "1";
  // Remove the one-time code from the browser address and history immediately.
  if (authCode || recovery) {
    callbacks.searchParams.delete("code");
    callbacks.searchParams.delete("community_recovery");
    history.replaceState(
      null,
      "",
      callbacks.pathname + callbacks.search + "#comunidad",
    );
  }
  function note(message = "", error = false) {
    status.textContent = message;
    status.dataset.error = String(error);
    const modalStatus = $("#dkc-dialog-status");
    if ($("#dkc-dialog").open) {
      modalStatus.textContent = message;
      modalStatus.dataset.error = String(error);
    }
  }
  function el(tag, text, cls) {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  }
  function button(text, fn, cls) {
    const n = el("button", text, cls);
    n.type = "button";
    n.addEventListener("click", () => run(n, fn));
    return n;
  }
  async function run(control, fn) {
    if (control.disabled) return;
    control.disabled = true;
    try {
      await fn();
    } catch (e) {
      note(e.message, true);
    } finally {
      control.disabled = false;
    }
  }
  async function api(path, options = {}) {
    let res;
    try {
      res = await fetch("/api/community" + path, {
        credentials: "same-origin",
        ...options,
        headers: { "Content-Type": "application/json", ...options.headers },
        signal: AbortSignal.timeout(20000),
      });
    } catch {
      throw Error(
        "No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.",
      );
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && session) {
        session = null;
        showSession();
      }
      throw Object.assign(
        Error(data.error || "No se pudo completar la solicitud."),
        { status: res.status },
      );
    }
    return data;
  }
  const send = (path, data, method = "POST") =>
    api(path, { method, body: JSON.stringify(data) });
  function formValues(form) {
    return Object.fromEntries(new FormData(form));
  }
  function populate(select, values) {
    if (select.dataset.all) select.append(new Option(select.dataset.all, ""));
    Object.entries(values).forEach(([value, label]) =>
      select.append(new Option(label, value)),
    );
  }
  root
    .querySelectorAll("[data-cities]")
    .forEach((s) => populate(s, Object.fromEntries(cities.map((c) => [c, c]))));
  root.querySelectorAll("[data-topics]").forEach((s) => populate(s, topics));
  const authForm = $("#dkc-auth-form"),
    profileForm = $("#dkc-profile-form"),
    postForm = $("#dkc-post-form"),
    dialog = $("#dkc-dialog");
  function authMode(value) {
    mode = value;
    const signup = mode === "signup",
      recover = mode === "recover";
    $("#dkc-signup-fields").hidden = !signup;
    authForm.elements.display_name.required = signup;
    $("#dkc-rules").hidden = !signup;
    authForm.elements.accept_rules.required = signup;
    $("#dkc-password-label").hidden = recover;
    authForm.elements.password.required = !recover;
    authForm.elements.password.minLength = signup ? 12 : 1;
    authForm.elements.password.maxLength = signup ? 128 : 256;
    authForm.elements.password.autocomplete = signup
      ? "new-password"
      : "current-password";
    $("#dkc-auth-submit").textContent = signup
      ? "Crear cuenta"
      : recover
        ? "Enviar enlace de recuperación"
        : "Iniciar sesión";
    $("#dkc-auth-help").textContent = signup
      ? "Confirma el correo en este mismo navegador. Después añade tu foto al perfil."
      : recover
        ? "Abre el enlace en este mismo navegador para establecer una contraseña nueva."
        : "Si ya tienes una cuenta StanNet con este correo, puedes utilizarla.";
    root
      .querySelectorAll("[data-auth]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.auth === mode)),
      );
  }
  root.querySelectorAll("[data-auth]").forEach((b) =>
    b.addEventListener("click", () => {
      authMode(b.dataset.auth);
      note();
    }),
  );
  authMode("signin");
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    run($("#dkc-auth-submit"), async () => {
      const b = formValues(authForm);
      b.accept_rules = authForm.elements.accept_rules.checked;
      const d = await send("/auth/" + mode, b);
      authForm.elements.password.value = "";
      if (mode === "recover") {
        note(d.message);
        return;
      }
      if (d.requiresConfirmation) {
        note(d.message);
        authMode("signin");
        return;
      }
      await loadSession();
      note(
        mode === "signup"
          ? "Cuenta creada. Completa tu perfil con una foto."
          : "Sesión iniciada.",
      );
    });
  });
  function showSession() {
    const signed = !!session;
    $("#dkc-auth").hidden = signed;
    $("#dkc-member").hidden = !signed;
    if (!signed) {
      $("#dkc-feed").replaceChildren();
      profileForm.hidden = true;
      postForm.hidden = true;
      $("#dkc-password-form").hidden = true;
      dialog.close();
      threadEpoch++;
      avatar = null;
      return;
    }
    $("#dkc-welcome").textContent = "Hola, " + session.profile.display_name;
    $("#dkc-moderation").hidden = !session.isAdmin;
    Object.entries(session.profile).forEach(([k, v]) => {
      if (profileForm.elements[k]) profileForm.elements[k].value = v ?? "";
    });
    profileForm.hidden = session.profile.has_avatar;
    $("#dkc-photo-preview").hidden = !session.profile.has_avatar;
    if (session.profile.has_avatar)
      $("#dkc-photo-preview").src =
        "/api/community/profiles/" +
        session.user.id +
        "/avatar?v=" +
        Date.now();
  }
  async function loadSession() {
    session = await api("/session");
    showSession();
    await loadFeed(true);
  }
  $("#dkc-signout").addEventListener("click", () =>
    run($("#dkc-signout"), async () => {
      await send("/auth/signout", {});
      session = null;
      showSession();
      note("Sesión cerrada.");
    }),
  );
  $("#dkc-profile-toggle").addEventListener("click", () => {
    profileForm.hidden = !profileForm.hidden;
    if (!profileForm.hidden) profileForm.elements.display_name.focus();
  });
  async function photo(file) {
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10000000
    )
      throw Error("Elige una foto JPEG, PNG o WebP de menos de 10 MB.");
    const src = URL.createObjectURL(file),
      img = new Image();
    try {
      img.src = src;
      await img.decode();
      if (img.width > 20000 || img.height > 20000)
        throw Error("La imagen es demasiado grande.");
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 320;
      const size = Math.min(img.naturalWidth, img.naturalHeight),
        ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 320, 320);
      ctx.drawImage(
        img,
        (img.naturalWidth - size) / 2,
        (img.naturalHeight - size) / 2,
        size,
        size,
        0,
        0,
        320,
        320,
      );
      return canvas.toDataURL("image/jpeg", 0.82);
    } finally {
      URL.revokeObjectURL(src);
    }
  }
  $("#dkc-photo").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    photoBusy = true;
    try {
      avatar = await photo(file);
      $("#dkc-photo-preview").src = avatar;
      $("#dkc-photo-preview").hidden = false;
      note("Foto preparada. Guarda el perfil para conservarla.");
    } catch (e) {
      avatar = null;
      note(e.message, true);
    } finally {
      photoBusy = false;
    }
  });
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    run(profileForm.querySelector("button"), async () => {
      if (photoBusy) throw Error("Espera a que termine de preparar la foto.");
      const b = formValues(profileForm);
      delete b.delete_password;
      if (!avatar && !session.profile.has_avatar)
        throw Error("Añade una foto de perfil.");
      if (avatar) b.avatar = avatar;
      const d = await send("/profile", b, "PATCH");
      session.profile = d.profile;
      avatar = null;
      showSession();
      note("Perfil guardado.");
    });
  });
  $("#dkc-delete-profile").addEventListener("click", () =>
    run($("#dkc-delete-profile"), async () => {
      if (
        !confirm(
          "¿Eliminar tu perfil, foto, publicaciones y respuestas de Comunidad Dinamarca? Esta acción no se puede deshacer.",
        )
      )
        return;
      await send(
        "/profile",
        { password: profileForm.elements.delete_password.value },
        "DELETE",
      );
      profileForm.reset();
      session = null;
      showSession();
      note("Tus datos de comunidad se han eliminado.");
    }),
  );
  function newPost() {
    editing = null;
    postForm.reset();
    postForm.elements.city.value = session.profile.city;
    $("#dkc-post-form-title").textContent = "Nueva publicación";
    postForm.hidden = false;
    postForm.elements.title.focus();
  }
  $("#dkc-new-toggle").addEventListener("click", () => {
    if (!session.profile.has_avatar) {
      profileForm.hidden = false;
      note("Completa el perfil con tu foto antes de publicar.");
      profileForm.scrollIntoView({ block: "center" });
      return;
    }
    newPost();
  });
  $("#dkc-post-cancel").addEventListener("click", () => {
    postForm.hidden = true;
    editing = null;
  });
  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    run(postForm.querySelector("button"), async () => {
      await send(
        editing ? "/posts/" + editing : "/posts",
        formValues(postForm),
        editing ? "PATCH" : "POST",
      );
      postForm.hidden = true;
      editing = null;
      await loadFeed(true);
      note("Publicación guardada.");
    });
  });
  function date(value) {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  }
  function author(p, time) {
    const wrap = el("div", undefined, "dkc-author");
    if (p?.has_avatar) {
      const img = el("img", undefined, "dkc-avatar");
      img.src = "/api/community/profiles/" + p.id + "/avatar";
      img.alt = "";
      img.loading = "lazy";
      wrap.append(img);
    }
    const info = el("div");
    info.append(
      button(p?.display_name || "Miembro", () => openProfile(p.id), "dkc-link"),
      el("div", p?.city + " · " + date(time), "dkc-byline"),
    );
    wrap.append(info);
    return wrap;
  }
  function postCard(p) {
    const card = el("article", undefined, "dkc-post");
    card.append(
      author(p.author, p.created_at),
      el("span", topics[p.topic], "dkc-tag"),
      el("span", p.city, "dkc-tag"),
      el("h3", p.title),
      el(
        "p",
        p.body.length > 500 ? p.body.slice(0, 500) + "…" : p.body,
        "dkc-content",
      ),
    );
    const actions = el("div", undefined, "dkc-actions");
    actions.append(button("Ver y responder", () => openThread(p.id)));
    if (p.author_id === session.user.id) {
      actions.append(
        button("Editar", () => {
          editing = p.id;
          for (const [key, val] of Object.entries(p))
            if (postForm.elements[key]) postForm.elements[key].value = val;
          $("#dkc-post-form-title").textContent = "Editar publicación";
          postForm.hidden = false;
          postForm.elements.title.focus();
        }),
        button("Eliminar", async () => {
          if (!confirm("¿Eliminar esta publicación y sus respuestas?")) return;
          await api("/posts/" + p.id, { method: "DELETE" });
          await loadFeed(true);
          note("Publicación eliminada.");
        }),
      );
    } else
      actions.append(
        button("Denunciar", async () => {
          const reason = prompt(
            "Describe el motivo de la denuncia (mínimo 5 caracteres).",
          );
          if (reason === null) return;
          await send("/reports", { post_id: p.id, reason });
          note("Denuncia registrada para moderación.");
        }),
      );
    card.append(actions);
    return card;
  }
  async function loadFeed(reset) {
    if (feedBusy) return;
    feedBusy = true;
    try {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(formValues($("#dkc-filters"))))
        if (v.trim()) qs.set(k, v.trim());
      if (!reset && next)
        Object.entries(next).forEach(([k, v]) => qs.set(k, v));
      const d = await api("/posts?" + qs);
      if (reset) $("#dkc-feed").replaceChildren();
      d.posts.forEach((p) => $("#dkc-feed").append(postCard(p)));
      if (reset && !d.posts.length)
        $("#dkc-feed").append(
          el(
            "p",
            "Todavía no hay publicaciones con estos filtros. Puedes crear la primera.",
          ),
        );
      next = d.next;
      $("#dkc-more").hidden = !next;
    } finally {
      feedBusy = false;
    }
  }
  $("#dkc-filters").addEventListener("submit", (e) => {
    e.preventDefault();
    run(e.submitter, () => loadFeed(true));
  });
  $("#dkc-more").addEventListener("click", () =>
    run($("#dkc-more"), () => loadFeed(false)),
  );
  function openDialog(title) {
    $("#dkc-dialog-status").textContent = "";
    $("#dkc-dialog-title").textContent = title;
    $("#dkc-dialog-body").replaceChildren();
    if (!dialog.open) dialog.showModal();
  }
  async function openProfile(id) {
    const d = await api("/profiles/" + id);
    threadEpoch++;
    openDialog(d.profile.display_name);
    $("#dkc-dialog-body").append(
      author(d.profile, d.profile.created_at),
      el(
        "p",
        d.profile.bio || "Este miembro todavía no ha añadido una presentación.",
        "dkc-content",
      ),
    );
  }
  async function openThread(id) {
    const epoch = ++threadEpoch,
      d = await api("/posts/" + id);
    if (epoch !== threadEpoch) return;
    threadId = id;
    openDialog(d.post.title);
    const area = $("#dkc-dialog-body");
    area.append(
      author(d.post.author, d.post.created_at),
      el("p", d.post.body, "dkc-content"),
    );
    const replies = el("div"),
      more = button("Más respuestas", async () => loadReplies(offset)),
      form = el("form");
    let offset = 0;
    more.hidden = true;
    area.append(el("h4", "Respuestas"), replies, more);
    async function loadReplies(start = 0) {
      const data = await api("/posts/" + id + "/replies?offset=" + start);
      if (epoch !== threadEpoch) return;
      if (!start) replies.replaceChildren();
      for (const r of data.replies) {
        const box = el("article", undefined, "dkc-reply");
        box.append(
          author(r.author, r.created_at),
          el("p", r.body, "dkc-content"),
        );
        if (r.author_id === session.user.id)
          box.append(
            button("Eliminar respuesta", async () => {
              if (!confirm("¿Eliminar tu respuesta?")) return;
              await api("/replies/" + r.id, { method: "DELETE" });
              await loadReplies();
            }),
          );
        replies.append(box);
      }
      if (!start && !data.replies.length)
        replies.append(el("p", "Aún no hay respuestas."));
      offset = data.next;
      more.hidden = offset === null;
    }
    const label = el("label", "Tu respuesta"),
      input = el("textarea");
    input.name = "body";
    input.minLength = 2;
    input.maxLength = 2000;
    input.rows = 3;
    input.required = true;
    label.append(input);
    const submit = el("button", "Publicar respuesta", "dkc-primary");
    submit.type = "submit";
    form.append(label, submit);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      run(submit, async () => {
        await send("/posts/" + id + "/replies", { body: input.value });
        input.value = "";
        await loadReplies();
        note("Respuesta publicada.");
      });
    });
    area.append(form);
    await loadReplies();
  }
  $("#dkc-dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    threadId = null;
    threadEpoch++;
  });
  $("#dkc-password-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    run(form.querySelector("button"), async () => {
      await send("/auth/password", formValues(form));
      form.reset();
      session = null;
      showSession();
      note("Contraseña actualizada. Inicia sesión con la nueva contraseña.");
    });
  });
  $("#dkc-reports-load").addEventListener("click", () =>
    run($("#dkc-reports-load"), async () => {
      const d = await api("/moderation/reports");
      $("#dkc-reports").replaceChildren();
      for (const r of d.reports) {
        const box = el("article", undefined, "dkc-reply");
        box.append(
          el("h4", r.post?.title || "Publicación"),
          el("p", r.reason, "dkc-content"),
          el("p", r.reporter?.display_name + " · " + date(r.created_at)),
          button("Ver publicación", () => openThread(r.post_id)),
          button("Retirar publicación", async () => {
            if (!confirm("¿Retirar esta publicación y sus respuestas?")) return;
            await api("/moderation/posts/" + r.post_id, { method: "DELETE" });
            box.remove();
            await loadFeed(true);
          }),
        );
        $("#dkc-reports").append(box);
      }
      if (!d.reports.length)
        $("#dkc-reports").append(el("p", "No hay denuncias pendientes."));
    }),
  );
  (async () => {
    try {
      if (authCode) {
        await send("/auth/callback", { code: authCode });
        await loadSession();
        if (recovery) {
          $("#dkc-password-form").hidden = false;
          $("#dkc-member").hidden = true;
          $("#dkc-password-form input").focus();
        } else note("Correo confirmado. Completa tu perfil para participar.");
      } else await loadSession();
    } catch (e) {
      if (e.status !== 401) note(e.message, true);
    }
    if (location.hash === "#comunidad") root.scrollIntoView({ block: "start" });
  })();
}
