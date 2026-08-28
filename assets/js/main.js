const root = document.documentElement;
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem("theme");

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.innerHTML = theme === "dark"
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}
applyTheme(savedTheme || (prefersDark ? "dark" : "light"));

document.getElementById("themeBtn").addEventListener("click", () => {
  applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

const nav = document.getElementById("nav");
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

navToggle.addEventListener("click", () => {
  const open = navLinks.hidden;
  navLinks.hidden = !open;
  navToggle.setAttribute("aria-expanded", open);
  navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  navLinks.hidden = true;
  navToggle.setAttribute("aria-expanded", "false");
}));

const typingEl = document.getElementById("typing");
if (typingEl) {
  const words = ["produtos.", "pesquisa.", "software.", "inovação."];
  let wi = 0, ci = 0, deleting = false;
  (function type() {
    const word = words[wi];
    typingEl.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) { ci++; setTimeout(type, 90); }
    else if (!deleting) { deleting = true; setTimeout(type, 1800); }
    else if (ci > 0) { ci--; setTimeout(type, 45); }
    else { deleting = false; wi = (wi + 1) % words.length; setTimeout(type, 300); }
  })();
}

const carousel = document.getElementById("carousel");
if (carousel) {
  const track = document.getElementById("carouselTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const slides = track.children;
  let idx = 0, timer;

  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement("button");
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Ir para o slide ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap.appendChild(dot);
  }
  const dots = dotsWrap.children;

  function go(i) {
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    [...dots].forEach((d, j) => d.classList.toggle("active", j === idx));
  }
  function next() { go(idx + 1); }

  document.getElementById("prevSlide").addEventListener("click", () => go(idx - 1));
  document.getElementById("nextSlide").addEventListener("click", next);

  carousel.addEventListener("mouseenter", () => clearInterval(timer));
  carousel.addEventListener("mouseleave", () => { timer = setInterval(next, 6000); });
  carousel.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") go(idx - 1);
    if (e.key === "ArrowRight") next();
  });
  carousel.tabIndex = 0;
  carousel.setAttribute("aria-label", "Carrossel de destaques");

  go(0);
  timer = setInterval(next, 6000);
}

const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("visible"));
}

const counters = document.querySelectorAll(".counter .num");
if (counters.length && "IntersectionObserver" in window) {
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || "";
      const dur = 1200, start = performance.now();
      (function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(start);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => cio.observe(el));
}

const tiltCards = document.querySelectorAll(".project-card");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (tiltCards.length && finePointer && !reducedMotion) {
  tiltCards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    card.addEventListener("mouseleave", () => { card.style.transform = ""; });
  });
}

const heroGraph = document.getElementById("heroGraph");
if (heroGraph) {
  const gl = heroGraph.getContext("webgl", { antialias: true, alpha: true });
  if (gl) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const VS = `
      attribute vec3 aPos;
      uniform vec2 uRot;
      uniform float uRatio;
      uniform float uSize;
      varying float vDepth;
      void main() {
        float cx = cos(uRot.x), sx = sin(uRot.x);
        float cy = cos(uRot.y), sy = sin(uRot.y);
        vec3 p = aPos;
        p.yz = mat2(cx, -sx, sx, cx) * p.yz;
        p.xz = mat2(cy, -sy, sy, cy) * p.xz;
        float z = 3.2;
        float f = 1.0 / (z - p.z);
        gl_Position = vec4(p.xy * f, p.z / z, 1.0);
        gl_Position.x *= uRatio;
        vDepth = clamp((p.z + 1.2) / 2.4, 0.0, 1.0);
        gl_PointSize = uSize * f * uRatio;
      }`;
    const FS_POINTS = `
      precision mediump float;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying float vDepth;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, d) * (0.35 + 0.65 * vDepth);
        gl_FragColor = vec4(mix(uColor1, uColor2, vDepth), alpha);
      }`;
    const FS_LINES = `
      precision mediump float;
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vDepth;
      void main() {
        gl_FragColor = vec4(uColor, uAlpha * (0.35 + 0.65 * vDepth));
      }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function makeProgram(vsSrc, fsSrc) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
      gl.linkProgram(p);
      return p;
    }
    const progP = makeProgram(VS, FS_POINTS);
    const progL = makeProgram(VS, FS_LINES);

    const N = 90;
    const XH = 1.6, YH = 1.15, ZH = 1.0;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() * 2 - 1) * XH;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * YH;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * ZH;
    }
    const TH = 1.15;
    const pairs = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < TH * TH) pairs.push(i, j);
      }
    }
    const E = pairs.length / 2;
    const linePos = new Float32Array(E * 6);
    for (let e = 0; e < E; e++) {
      const a = pairs[e * 2], b = pairs[e * 2 + 1];
      linePos[e * 6] = pos[a * 3]; linePos[e * 6 + 1] = pos[a * 3 + 1]; linePos[e * 6 + 2] = pos[a * 3 + 2];
      linePos[e * 6 + 3] = pos[b * 3]; linePos[e * 6 + 4] = pos[b * 3 + 1]; linePos[e * 6 + 5] = pos[b * 3 + 2];
    }

    const bufP = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufP);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const bufL = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufL);
    gl.bufferData(gl.ARRAY_BUFFER, linePos, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    function hexRgb(hex) {
      const m = hex.replace("#", "");
      const n = parseInt(m.length === 3 ? m.split("").map(c => c + c).join("") : m, 16);
      return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => v / 255);
    }
    let c1 = hexRgb(cssVar("--accent"));
    let c2 = hexRgb(cssVar("--accent-2"));
    new MutationObserver(() => {
      c1 = hexRgb(cssVar("--accent"));
      c2 = hexRgb(cssVar("--accent-2"));
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    function setup(p, r, rotArr) {
      gl.useProgram(p);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aPos"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aPos"), 3, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(p, "uRatio"), r);
      gl.uniform2f(gl.getUniformLocation(p, "uRot"), rotArr[0], rotArr[1]);
    }

    let W = 0, H = 0, raf = 0;
    const rot = { x: 0.5, y: 0.7 };
    const target = { x: 0.5, y: 0.7 };

    function resize() {
      W = heroGraph.clientWidth;
      H = heroGraph.clientHeight;
      heroGraph.width = W * DPR;
      heroGraph.height = H * DPR;
      gl.viewport(0, 0, W * DPR, H * DPR);
    }
    resize();

    const hero = document.getElementById("principal");
    const move = (x, y) => {
      const r = hero.getBoundingClientRect();
      target.y = 0.7 + ((x - r.left) / r.width - 0.5) * 1.8;
      target.x = 0.5 + ((y - r.top) / r.height - 0.5) * 1.2;
    };
    if (fine || "ontouchstart" in window) {
      hero.addEventListener("mousemove", e => move(e.clientX, e.clientY));
      hero.addEventListener("mouseleave", () => { target.x = 0.5; target.y = 0.7; });
      hero.addEventListener("touchmove", e => {
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY);
      }, { passive: true });
    }

    function draw() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const r = (W * DPR) / (H * DPR);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufP);
      setup(progP, r, [rot.x, rot.y]);
      gl.uniform1f(gl.getUniformLocation(progP, "uSize"), 9);
      gl.uniform3f(gl.getUniformLocation(progP, "uColor1"), c1[0], c1[1], c1[2]);
      gl.uniform3f(gl.getUniformLocation(progP, "uColor2"), c2[0], c2[1], c2[2]);
      gl.drawArrays(gl.POINTS, 0, N);

      gl.bindBuffer(gl.ARRAY_BUFFER, bufL);
      setup(progL, r, [rot.x, rot.y]);
      gl.uniform3f(gl.getUniformLocation(progL, "uColor"), c1[0], c1[1], c1[2]);
      gl.uniform1f(gl.getUniformLocation(progL, "uAlpha"), 0.55);
      gl.drawArrays(gl.LINES, 0, E * 2);
    }

    function frame() {
      rot.x += (target.x - rot.x) * 0.04;
      rot.y += (target.y - rot.y) * 0.04;
      rot.y += 0.0006;
      draw();
      raf = requestAnimationFrame(frame);
    }

    draw();
    if (!reduced) raf = requestAnimationFrame(frame);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (!reduced) raf = requestAnimationFrame(frame);
    });
  }
}

const navLinksAll = document.querySelectorAll(".nav-links a");
if (navLinksAll.length && "IntersectionObserver" in window) {
  const sections = [...navLinksAll].map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const sio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinksAll.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${e.target.id}`));
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  sections.forEach(s => sio.observe(s));
}