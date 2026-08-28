/* Tema compartilhado com o portfólio (localStorage "theme") */
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const dark = saved ? saved === "dark" : true;
  root.setAttribute("data-theme", dark ? "dark" : "light");
  const btn = document.getElementById("themeBtn");
  if (!btn) return;
  const label = document.getElementById("themeLabel");
  if (label) label.textContent = dark ? "Light" : "Dark";
  btn.addEventListener("click", () => {
    const d = root.getAttribute("data-theme") !== "dark";
    root.setAttribute("data-theme", d ? "dark" : "light");
    localStorage.setItem("theme", d ? "dark" : "light");
    if (label) label.textContent = d ? "Light" : "Dark";
  });
})();