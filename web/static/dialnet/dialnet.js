// Dialnet theme for the Anubis challenge page. Loaded synchronously at the top of <body>:
// 1. picks the portal from the host name (logo and accent colour) before the first paint;
// 2. once the page is parsed, draws one of eight loading animations, chosen at random on each visit,
//    driven by the events main.mjs dispatches: anubis:progress {fraction}, anubis:done, anubis:error.
(() => {
  "use strict";

  // host -> portal (the same names and logos as dialnet-auth); anything else is Dialnet
  const PORTALS = [
    [/(^|\.)agora\.edu\.es$/, "agora", "ágora"],
    [/(^|\.)documat\.unirioja\.es$/, "documat", "Documat"],
    [/(^|\.)hispadoc\.es$/, "hispadoc", "Hispadoc"],
    [/(^|\.)docuvin\.es$/, "docuvin", "Docuvin"],
  ];
  const host = location.hostname.toLowerCase();
  const [, portal, portalName] = PORTALS.find(([re]) => re.test(host)) || [null, "dialnet", "Dialnet"];
  document.body.dataset.portal = portal;
  document.body.dataset.state = "working";

  const es = !/^en/i.test(document.documentElement.lang || "es");
  const T = es
    ? { working: "Comprobando…", done: "Verificado", error: "No se ha podido completar la comprobación",
        accepted: "ACEPTADO", rejected: "RECHAZADO", longer: "Está tardando más de lo normal…" }
    : { working: "Checking…", done: "Verified", error: "The check could not be completed",
        accepted: "ACCEPTED", rejected: "REJECTED", longer: "This is taking longer than usual…" };

  const ready = (fn) => (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn());

  ready(() => {
    const logo = document.getElementById("da-logo");
    if (logo) {
      logo.src = logo.src.replace(/\/img\/[a-z]+\.png/, `/img/${portal}.png`);
      logo.alt = portalName;
    }

    const box = document.getElementById("da-anim");
    const status = document.getElementById("da-status");
    if (!box || !status) return; // error and other pages: theme only

    let frac = 0;
    const state = () => document.body.dataset.state;
    const setH = (el, h) => { if (el && el._h !== h) { el._h = h; el.innerHTML = h; } };
    const year = new Date().getFullYear();
    const SELLO = '<div class="sello"></div>';
    const DOTS = '<span class="dots"><i></i><i></i><i></i></span>';

    const UA = navigator.userAgent;
    const author = /Edg\//.test(UA) ? "Edge, M." : /Firefox\//.test(UA) ? "Firefox, M." : /Chrome\//.test(UA) ? "Chrome, G."
      : /Safari\//.test(UA) ? "Safari, A." : "Navegador, T.";
    const doi = `10.0000/humano.${year}.${Math.random().toString(16).slice(2, 6)}`;

    const LOMOS = [[4.6, "var(--da-accent)"], [3.9, "#3d5a80"], [4.3, "#6b705c"], [5, "#171717"], [3.6, "var(--da-accent)"],
      [4.4, "#a07040"], [4.8, "#5c4b8a"], [3.8, "#3d5a80"], [4.5, "#6b705c"], [4.1, "#171717"]];
    const BARS = [1, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2];
    const M = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const d = new Date();
    const today = `${String(d.getDate()).padStart(2, "0")} ${M[d.getMonth()]} ${year}`;

    // each animation: its markup and how it draws a progress fraction in a state (working, done, error)
    const ANIMS = {
      barra: { html: '<div class="da-bar"><div></div></div>',
        draw: (f) => { box.querySelector(".da-bar > div").style.width = `${f * 100}%`; } },
      cita: { html: `<div class="cita"></div>${SELLO}`,
        draw: (f, st) => {
          const parts = [[`${author} (${year}). `, 0], ["Comprobación de humanidad", 1], [". ", 0], [portalName, 1], [", 1(1), 1–4.", 0]];
          const total = parts.reduce((a, p) => a + p[0].length, 0);
          const n = st === "working" ? Math.round(f * total) : total;
          let k = 0, out = "";
          for (const [t, em] of parts) {
            const s = t.slice(0, Math.max(0, Math.min(t.length, n - k)));
            out += em ? `<em>${s}</em>` : s;
            k += t.length;
          }
          box.querySelector(".cita").innerHTML = out + (n < total ? '<span class="caret"></span>' : "");
          document.getElementById("da-doi").textContent = st === "done" ? `DOI: ${doi}` : "";
        } },
      libro: { html: `<div class="libro"><div class="tapa i"></div><div class="tapa d"></div><div class="hoja"></div><div class="hoja"></div><div class="hoja"></div></div>${SELLO}`,
        draw: () => {} },
      estante: { html: `<div class="estante"><div class="lomos">${LOMOS.map(([h, c], i) =>
          `<span class="lomo${i === LOMOS.length - 1 ? " tumbado" : ""}" style="height:${h}rem;background:${c}"></span>`).join("")}</div><div class="balda"></div></div>${SELLO}`,
        draw: (f, st) => {
          const n = st === "working" ? Math.floor(f * LOMOS.length) : st === "done" ? LOMOS.length : Math.floor(LOMOS.length * 0.35);
          box.querySelectorAll(".lomo").forEach((b, i) => b.classList.toggle("on", i < n));
        } },
      isbn: { html: `<div class="a-col"><div class="bc"><div class="laser"></div>${BARS.map((x, i) =>
          `<i style="width:${x}px;${i % 3 === 2 ? "background:transparent" : ""}"></i>`).join("")}</div><span class="isbn"></span></div>${SELLO}`,
        draw: (f, st) => {
          box.querySelector(".isbn").textContent = st === "done" ? "ISBN 978-84-HUMANO ✓" : st === "error" ? "ISBN ilegible"
            : `ISBN 978-84-${"·".repeat(Math.round(f * 6))}`;
        } },
      ficha: { html: `<div class="ficha"><div class="h">DEVOLVER ANTES DE</div><div class="r"><span>12 MAR 1998</span></div>
          <div class="r"><span>03 NOV 2004</span></div><div class="r"><span>21 ENE 2013</span></div><div class="r"><span class="hoy"></span></div></div>${SELLO}`,
        draw: (f, st) => {
          const hoy = box.querySelector(".hoy");
          hoy.textContent = st === "error" ? "EXTRAVIADO" : today;
          hoy.classList.toggle("mal", st === "error");
          box.querySelectorAll(".ficha .r span").forEach((x, i) =>
            x.classList.toggle("on", st === "error" ? i !== 2 : st === "done" ? true : f >= (i + 1) / 4.4));
        } },
      rev: { html: `<div class="a-col"><div class="rv"><div class="who"><div class="bub r1"></div><div class="av">R1</div></div><div class="ms"></div>
          <div class="who"><div class="bub r2"></div><div class="av">R2</div></div></div><span class="cap rvc"></span></div>`,
        draw: (f, st) => {
          const r1 = box.querySelector(".r1"), r2 = box.querySelector(".r2"), a = f >= 0.5 || st !== "working";
          r1.className = `bub r1${a ? " ok" : ""}`; setH(r1, a ? "✓" : DOTS);
          r2.className = `bub r2${st === "done" ? " ok" : st === "error" ? " ko" : ""}`;
          setH(r2, st === "done" ? "✓" : st === "error" ? "Revisiones mayores" : DOTS);
          box.querySelector(".rvc").textContent = st === "done" ? "Aceptado para publicación" : st === "error" ? "Devuelto al autor"
            : a ? "Revisor 1: aceptado. Esperando al revisor 2…" : "En revisión por pares…";
        } },
      cit: { html: '<div class="a-col"><span class="cap">Citado por</span><span class="num">0</span><span class="cap hidx"></span></div>',
        draw: (f, st) => {
          box.querySelector(".num").textContent = Math.round((st === "error" ? 0.35 : f) * 1234).toLocaleString("es-ES");
          box.querySelector(".hidx").textContent = st === "done" ? "Índice h de humanidad: 1" : st === "error" ? "Artículo retractado" : "";
        } },
    };

    // the playful ones speak Spanish; other languages get the bar
    const names = es ? Object.keys(ANIMS) : ["barra"];
    const kind = names[Math.floor(Math.random() * names.length)];
    box.dataset.kind = kind;
    box.innerHTML = ANIMS[kind].html;

    const draw = () => {
      const st = state(), f = st === "done" ? 1 : st === "error" ? 0.35 : frac;
      ANIMS[kind].draw(f, st);
      const sello = box.querySelector(".sello");
      if (sello) sello.textContent = st === "error" ? T.rejected : T.accepted;
      status.innerHTML = st === "done"
        ? `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#1e6b3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>${T.done}`
        : st === "error" ? T.error : frac > 0.9 ? T.longer : T.working;
    };

    document.addEventListener("anubis:progress", (e) => { frac = Math.max(frac, Math.min(1, e.detail.fraction)); draw(); });
    document.addEventListener("anubis:done", () => { document.body.dataset.state = "done"; draw(); });
    document.addEventListener("anubis:error", () => {
      document.body.dataset.state = "error";
      const steps = document.getElementById("da-steps");
      if (steps) steps.hidden = false;
      draw();
    });
    const retry = document.getElementById("da-retry");
    if (retry) retry.addEventListener("click", () => location.reload());
    draw();
  });
})();
