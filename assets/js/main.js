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
      attribute float aDelay;
      attribute float aRate;
      attribute vec3 aPhase;
      attribute float aBlink;
      attribute float aColor;
      uniform float uTime;
      uniform vec2 uRot;
      uniform float uRatio;
      uniform float uSize;
      uniform float uAmp;
      uniform vec2 uMouse;
      uniform float uGrav;
      varying float vDepth;
      varying float vAppear;
      varying float vBlink;
      varying float vColor;
      void main() {
        vec3 p = aPos;
        p.x += sin(uTime * aRate + aPhase.x) * uAmp;
        p.y += sin(uTime * aRate * 1.31 + aPhase.y) * uAmp;
        p.z += cos(uTime * aRate * 0.77 + aPhase.z) * uAmp;
        vec2 toMouse = uMouse - p.xy;
        float dist = length(toMouse);
        if (dist > 0.001) {
          p.xy += (toMouse / dist) * uGrav * smoothstep(1.5, 0.0, dist);
        }
        float cx = cos(uRot.x), sx = sin(uRot.x);
        float cy = cos(uRot.y), sy = sin(uRot.y);
        p.yz = mat2(cx, -sx, sx, cx) * p.yz;
        p.xz = mat2(cy, -sy, sy, cy) * p.xz;
        float z = 2.9;
        float f = 1.0 / (z - p.z);
        gl_Position = vec4(p.xy * f, p.z / z, 1.0);
        gl_Position.x *= uRatio;
        vDepth = clamp((p.z + 1.2) / 2.4, 0.0, 1.0);
        vAppear = clamp((uTime - aDelay) * aRate, 0.0, 1.0);
        vBlink = 0.55 + 0.45 * sin(uTime * (1.0 + aRate * 2.0) + aBlink);
        vColor = aColor;
        gl_PointSize = uSize * f * uRatio * (0.5 + 0.5 * vAppear);
      }`;
    const FS_POINTS = `
      precision mediump float;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying float vDepth;
      varying float vAppear;
      varying float vBlink;
      varying float vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, d) * (0.5 + 0.5 * vDepth) * vAppear * vBlink;
        gl_FragColor = vec4(mix(uColor1, uColor2, vColor), alpha);
      }`;
    const FS_LINES = `
      precision mediump float;
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vDepth;
      varying float vAppear;
      varying float vColor;
      void main() {
        gl_FragColor = vec4(uColor, uAlpha * (0.35 + 0.65 * vDepth) * vAppear);
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

    const N = 45;
    const XH = 1.7, YH = 1.25, ZH = 1.0;
    const pos = new Float32Array(N * 3);
    const delay = new Float32Array(N);
    const rate = new Float32Array(N);
    const phase = new Float32Array(N * 3);
    const blink = new Float32Array(N);
    const col = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3]     = (Math.random() * 2 - 1) * XH;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * YH;
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * ZH;
      delay[i] = Math.random() * 7;
      rate[i] = 0.25 + Math.random() * 0.6;
      phase[i * 3] = Math.random() * Math.PI * 2;
      phase[i * 3 + 1] = Math.random() * Math.PI * 2;
      phase[i * 3 + 2] = Math.random() * Math.PI * 2;
      blink[i] = Math.random() * Math.PI * 2;
      col[i] = i % 2;
    }
    const TH = 0.95;
    const pairs = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pos[i * 3] - pos[j * 3], dy = pos[i * 3 + 1] - pos[j * 3 + 1], dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < TH * TH) pairs.push(i, j);
      }
    }
    const E = pairs.length / 2;
    const linePos = new Float32Array(E * 6);
    const lineDelay = new Float32Array(E * 2);
    const lineRate = new Float32Array(E * 2);
    const linePhase = new Float32Array(E * 6);
    const lineBlink = new Float32Array(E * 2);
    const lineCol = new Float32Array(E * 2);
    for (let e = 0; e < E; e++) {
      const a = pairs[e * 2], b = pairs[e * 2 + 1];
      linePos[e * 6] = pos[a * 3]; linePos[e * 6 + 1] = pos[a * 3 + 1]; linePos[e * 6 + 2] = pos[a * 3 + 2];
      linePos[e * 6 + 3] = pos[b * 3]; linePos[e * 6 + 4] = pos[b * 3 + 1]; linePos[e * 6 + 5] = pos[b * 3 + 2];
      lineDelay[e * 2] = delay[a]; lineDelay[e * 2 + 1] = delay[b];
      lineRate[e * 2] = rate[a]; lineRate[e * 2 + 1] = rate[b];
      linePhase[e * 6] = phase[a * 3]; linePhase[e * 6 + 1] = phase[a * 3 + 1]; linePhase[e * 6 + 2] = phase[a * 3 + 2];
      linePhase[e * 6 + 3] = phase[b * 3]; linePhase[e * 6 + 4] = phase[b * 3 + 1]; linePhase[e * 6 + 5] = phase[b * 3 + 2];
      lineBlink[e * 2] = blink[a]; lineBlink[e * 2 + 1] = blink[b];
      lineCol[e * 2] = 0; lineCol[e * 2 + 1] = 0;
    }

    function bindAttrs(p, bufPos, bufD, bufR, bufPh, bufB, bufC) {
      gl.useProgram(p);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufPos);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aPos"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aPos"), 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufD);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aDelay"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aDelay"), 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufR);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aRate"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aRate"), 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufPh);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aPhase"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aPhase"), 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufB);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aBlink"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aBlink"), 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufC);
      gl.enableVertexAttribArray(gl.getAttribLocation(p, "aColor"));
      gl.vertexAttribPointer(gl.getAttribLocation(p, "aColor"), 1, gl.FLOAT, false, 0, 0);
    }

    const bufP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const bufPD = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufPD); gl.bufferData(gl.ARRAY_BUFFER, delay, gl.STATIC_DRAW);
    const bufPR = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufPR); gl.bufferData(gl.ARRAY_BUFFER, rate, gl.STATIC_DRAW);
    const bufPP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufPP); gl.bufferData(gl.ARRAY_BUFFER, phase, gl.STATIC_DRAW);
    const bufPB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufPB); gl.bufferData(gl.ARRAY_BUFFER, blink, gl.STATIC_DRAW);
    const bufPC = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufPC); gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW);
    const bufL = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufL); gl.bufferData(gl.ARRAY_BUFFER, linePos, gl.STATIC_DRAW);
    const bufLD = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufLD); gl.bufferData(gl.ARRAY_BUFFER, lineDelay, gl.STATIC_DRAW);
    const bufLR = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufLR); gl.bufferData(gl.ARRAY_BUFFER, lineRate, gl.STATIC_DRAW);
    const bufLP = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufLP); gl.bufferData(gl.ARRAY_BUFFER, linePhase, gl.STATIC_DRAW);
    const bufLB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufLB); gl.bufferData(gl.ARRAY_BUFFER, lineBlink, gl.STATIC_DRAW);
    const bufLC = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bufLC); gl.bufferData(gl.ARRAY_BUFFER, lineCol, gl.STATIC_DRAW);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);

    const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    function hexRgb(hex) {
      const m = hex.replace("#", "");
      const n = parseInt(m.length === 3 ? m.split("").map(c => c + c).join("") : m, 16);
      if (isNaN(n)) return [0.85, 0.47, 0.02];
      return [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => v / 255);
    }
    let c1 = hexRgb(cssVar("--accent"));
    let c2 = hexRgb(cssVar("--accent-2"));
    let ce = hexRgb(cssVar("--edge"));
    const t0 = performance.now();
    new MutationObserver(() => {
      c1 = hexRgb(cssVar("--accent"));
      c2 = hexRgb(cssVar("--accent-2"));
      ce = hexRgb(cssVar("--edge"));
      draw(reduced ? 999 : (performance.now() - t0) / 1000);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let W = 0, H = 0, raf = 0;
    const rot = { x: 0.5, y: 0.7 };
    let target = { x: 0.5, y: 0.7 };
    let rw = { x: 0, y: 0 };
    let rwT = 0;
    function nextRandomWalk() {
      rw = { x: (Math.random() * 2 - 1) * 0.55, y: (Math.random() * 2 - 1) * 0.55 };
      rwT = 1.5 + Math.random() * 2.5;
    }
    nextRandomWalk();

    let dragging = false, lastX = 0, lastY = 0;
    const mouse = { x: 999, y: 999 };

    function resize() {
      W = heroGraph.clientWidth;
      H = heroGraph.clientHeight;
      heroGraph.width = W * DPR;
      heroGraph.height = H * DPR;
      gl.viewport(0, 0, W * DPR, H * DPR);
    }
    resize();

    function toWorld(x, y) {
      const r = heroGraph.getBoundingClientRect();
      const ndcX = ((x - r.left) / r.width) * 2 - 1;
      const ndcY = -(((y - r.top) / r.height) * 2 - 1);
      const f = 1 / 2.9;
      return { x: ndcX / (f * (W / H)), y: ndcY / f };
    }

    if (fine || "ontouchstart" in window) {
      heroGraph.addEventListener("mousemove", e => {
        const m = toWorld(e.clientX, e.clientY);
        mouse.x = m.x; mouse.y = m.y;
      });
      heroGraph.addEventListener("mouseleave", () => { mouse.x = 999; mouse.y = 999; });
      heroGraph.addEventListener("mousedown", e => {
        dragging = true;
        lastX = e.clientX; lastY = e.clientY;
        heroGraph.classList.add("dragging");
      });
      window.addEventListener("mousemove", e => {
        if (!dragging) return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        rot.y += dx * 0.006;
        rot.x = Math.max(-1.2, Math.min(1.2, rot.x + dy * 0.006));
        lastX = e.clientX; lastY = e.clientY;
      });
      window.addEventListener("mouseup", () => {
        dragging = false;
        heroGraph.classList.remove("dragging");
      });
      heroGraph.addEventListener("touchstart", e => {
        dragging = true;
        lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
        heroGraph.classList.add("dragging");
      }, { passive: true });
      heroGraph.addEventListener("touchmove", e => {
        const t = e.touches[0];
        if (!t) return;
        const m = toWorld(t.clientX, t.clientY);
        mouse.x = m.x; mouse.y = m.y;
        if (dragging) {
          const dx = t.clientX - lastX, dy = t.clientY - lastY;
          rot.y += dx * 0.006;
          rot.x = Math.max(-1.2, Math.min(1.2, rot.x + dy * 0.006));
          lastX = t.clientX; lastY = t.clientY;
          e.preventDefault();
        }
      }, { passive: false });
      const endTouch = () => {
        dragging = false;
        heroGraph.classList.remove("dragging");
      };
      heroGraph.addEventListener("touchend", endTouch);
      heroGraph.addEventListener("touchcancel", endTouch);
    }

    function draw(time) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const r = (W * DPR) / (H * DPR);
      const rotArr = [rot.x, rot.y];
      bindAttrs(progP, bufP, bufPD, bufPR, bufPP, bufPB, bufPC);
      gl.uniform1f(gl.getUniformLocation(progP, "uRatio"), r);
      gl.uniform2f(gl.getUniformLocation(progP, "uRot"), rotArr[0], rotArr[1]);
      gl.uniform1f(gl.getUniformLocation(progP, "uTime"), time);
      gl.uniform1f(gl.getUniformLocation(progP, "uAmp"), 0.16);
      gl.uniform1f(gl.getUniformLocation(progP, "uSize"), 30);
      gl.uniform2f(gl.getUniformLocation(progP, "uMouse"), mouse.x, mouse.y);
      gl.uniform1f(gl.getUniformLocation(progP, "uGrav"), 0.14);
      gl.uniform3f(gl.getUniformLocation(progP, "uColor1"), c1[0], c1[1], c1[2]);
      gl.uniform3f(gl.getUniformLocation(progP, "uColor2"), c2[0], c2[1], c2[2]);
      gl.drawArrays(gl.POINTS, 0, N);

      bindAttrs(progL, bufL, bufLD, bufLR, bufLP, bufLB, bufLC);
      gl.uniform1f(gl.getUniformLocation(progL, "uRatio"), r);
      gl.uniform2f(gl.getUniformLocation(progL, "uRot"), rotArr[0], rotArr[1]);
      gl.uniform1f(gl.getUniformLocation(progL, "uTime"), time);
      gl.uniform1f(gl.getUniformLocation(progL, "uAmp"), 0.16);
      gl.uniform2f(gl.getUniformLocation(progL, "uMouse"), mouse.x, mouse.y);
      gl.uniform1f(gl.getUniformLocation(progL, "uGrav"), 0.14);
      gl.uniform3f(gl.getUniformLocation(progL, "uColor"), ce[0], ce[1], ce[2]);
      gl.uniform1f(gl.getUniformLocation(progL, "uAlpha"), 0.65);
      gl.drawArrays(gl.LINES, 0, E * 2);
    }

    function frame() {
      if (!dragging) {
        rwT -= 1 / 60;
        if (rwT <= 0) nextRandomWalk();
        target = { x: 0.5 + rw.x, y: 0.7 + rw.y };
        rot.x += (target.x - rot.x) * 0.03;
        rot.y += (target.y - rot.y) * 0.03;
      }
      draw((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }

    draw(999);
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