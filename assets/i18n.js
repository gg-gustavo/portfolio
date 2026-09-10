/* i18n global EN/PT — portfólio Gustavo Ripka
 *
 * - localStorage key "lang" (pt|en): escolha explícita do visitante vence.
 * - Primeira visita (sem "lang" salvo): GeoIP por IP — Brasil → pt,
 *   qualquer outro país → en. Fallback: idioma do navegador.
 * - Aplica traduções em elementos com [data-i18n] usando o dicionário
 *   window.I18N_EN (chave → HTML em inglês). PT usa o HTML original
 *   capturado no primeiro apply.
 * - Dispara "i18nchange" (detail.lang) para as páginas re-renderizarem
 *   conteúdo dinâmico em JS.
 *
 * API: I18n.lang | I18n.isPT | I18n.isEN | I18n.toggle() | I18n.set("pt"|"en") |
 *      I18n.apply() | I18n.on(callback) | I18n.ready
 */
(function () {
  "use strict";

  var LS_KEY = "lang";
  var html = document.documentElement;
  var PENDING = "data-i18n-pending";

  var saved = null;
  try { saved = localStorage.getItem(LS_KEY); } catch (e) { /* sem storage */ }

  var lang = saved === "pt" || saved === "en" ? saved : null;
  var decided = !!lang;
  var domReady = false;
  var pending = true;

  var style = document.createElement("style");
  style.textContent = "html[" + PENDING + "] body{visibility:hidden}";
  document.head.appendChild(style);
  html.setAttribute(PENDING, "");

  /* ---------- resolução da língua inicial ---------- */

  function browserLang() {
    var nav = (navigator.languages && navigator.languages[0]) ||
      navigator.language || "";
    return /^pt\b/i.test(nav) ? "pt" : "en";
  }

  function fetchGeo(timeoutMs) {
    var urls = [
      {
        url: "https://ipapi.co/json/",
        pick: function (d) { return d && d.country_code; }
      },
      {
        url: "https://api.country.is/",
        pick: function (d) { return d && d.country && d.country.iso_code; }
      }
    ];
    var attempts = urls.map(function (g) {
      var p;
      try {
        var opts = {};
        var ctrl = null;
        if (window.AbortController) {
          ctrl = new AbortController();
          opts.signal = ctrl.signal;
          setTimeout(function () { try { ctrl.abort(); } catch (e) { /* noop */ } }, timeoutMs);
        }
        p = fetch(g.url, opts)
          .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error("geo-http")); })
          .then(function (d) { return g.pick(d); });
      } catch (e) { return Promise.reject(e); }
      var timer = null;
      var timeoutP = new Promise(function (_, rej) {
        timer = setTimeout(function () { rej(new Error("geo-timeout")); }, timeoutMs + 500);
      });
      return Promise.race([p, timeoutP]).then(
        function (v) { if (timer) clearTimeout(timer); return v; },
        function (e) { if (timer) clearTimeout(timer); throw e; }
      );
    });
    return Promise.any(attempts).then(function (code) {
      return typeof code === "string" && code.length === 2
        ? code.toUpperCase()
        : null;
    }).catch(function () { return null; });
  }

  function persist(v) {
    try { localStorage.setItem(LS_KEY, v); } catch (e) { /* noop */ }
  }

  /* ---------- aplicação ---------- */

  function apply() {
    var dict = window.I18N_EN || {};

    html.lang = lang === "pt" ? "pt-BR" : "en";

    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        try {
          var key = el.getAttribute("data-i18n");
          if (!key) return;
          var pt = el.getAttribute("data-pt");
          if (pt === null) el.setAttribute("data-pt", el.innerHTML);
          else pt = pt;
          if (lang === "en") {
            var en = dict[key];
            if (typeof en === "string") el.innerHTML = en;
          } else {
            el.innerHTML = el.getAttribute("data-pt");
          }
        } catch (e) { /* um elemento ruim não trava a página */ }
      })(els[i]);
    }

    if (lang === "en") {
      var attrEls = document.querySelectorAll("[data-i18n-attr]");
      for (var a = 0; a < attrEls.length; a++) {
        (function (el) {
          try {
            var key = el.getAttribute("data-i18n") || "";
            var spec = el.getAttribute("data-i18n-attr") || "";
            var attrs = spec.split(",");
            for (var j = 0; j < attrs.length; j++) {
              var attr = attrs[j].replace(/^\s+|\s+$/g, "");
              if (!attr) continue;
              var en = dict[key + "." + attr];
              if (typeof en === "string") {
                if (el.getAttribute("data-pt-" + attr) === null) {
                  var current = el.getAttribute(attr);
                  if (current !== null) el.setAttribute("data-pt-" + attr, current);
                }
                el.setAttribute(attr, en);
              }
            }
          } catch (e) { /* noop */ }
        })(attrEls[a]);
      }
    }

    if (lang === "pt") {
      var ptEls = document.querySelectorAll("[data-i18n-attr]");
      for (var b = 0; b < ptEls.length; b++) {
        (function (el) {
          try {
            var spec = el.getAttribute("data-i18n-attr") || "";
            var attrs = spec.split(",");
            for (var j = 0; j < attrs.length; j++) {
              var attr = attrs[j].replace(/^\s+|\s+$/g, "");
              if (!attr) continue;
              var pt = el.getAttribute("data-pt-" + attr);
              if (pt !== null) el.setAttribute(attr, pt);
            }
          } catch (e) { /* noop */ }
        })(ptEls[b]);
      }
    }

    var labelEls = document.querySelectorAll("[data-i18n-label]");
    for (var c = 0; c < labelEls.length; c++) {
      try { labelEls[c].textContent = lang === "pt" ? "EN" : "PT"; } catch (e) { /* noop */ }
    }

    try {
      document.dispatchEvent(new CustomEvent("i18nchange", {
        detail: { lang: lang }
      }));
    } catch (e) { /* noop */ }
  }

  /* ---------- ciclo de vida ---------- */

  function release() {
    if (!pending) return;
    pending = false;
    html.removeAttribute(PENDING);
  }

  function settle() {
    /* rede de segurança global: a página NUNCA fica escondida */
    setTimeout(function () {
      if (pending) {
        if (!decided) {
          try {
            lang = browserLang();
            decided = true;
            persist(lang);
          } catch (e) { lang = "pt"; decided = true; }
        }
        try { apply(); } catch (e) { /* noop */ }
        release();
      }
    }, 1200);
    if (!decided) {
      fetchGeo(2000)
        .catch(function () { return null; })
        .then(function (code) {
          if (!decided) {
            lang = code ? (code === "BR" ? "pt" : "en") : browserLang();
            decided = true;
            persist(lang);
            try { apply(); } catch (e) { /* noop */ }
          }
          release();
        });
    } else {
      try { apply(); } catch (e) { /* noop */ }
      release();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    domReady = true;
    settle();
  });

  /* ---------- troca manual ---------- */

  function setLang(next, persistChoice) {
    next = next === "pt" ? "pt" : "en";
    if (decided && next === lang) { apply(); return; }
    lang = next;
    decided = true;
    if (persistChoice !== false) persist(lang);
    apply();
    if (domReady) release();
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("#langBtn, [data-lang-toggle]");
    if (!btn) return;
    setLang(lang === "pt" ? "en" : "pt");
  });

  var listeners = [];

  document.addEventListener("i18nchange", function (e) {
    listeners.forEach(function (fn) {
      try { fn(e.detail); } catch (err) { /* não quebra o ciclo */ }
    });
  });

  window.I18n = {
    get lang() { return lang; },
    get isPT() { return lang === "pt"; },
    get isEN() { return lang === "en"; },
    get ready() { return domReady && decided; },
    toggle: function () { setLang(lang === "pt" ? "en" : "pt"); },
    set: function (v) { setLang(v); },
    apply: apply,
    on: function (fn) { listeners.push(fn); }
  };
})();
