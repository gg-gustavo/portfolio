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