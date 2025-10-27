(function () {
  function initTheme() {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) {
      console.error("Theme toggle button not found");
      return;
    }

    const themeKey = "readerview_theme";

    const applyTheme = (mode) => {
      if (mode === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        toggle.textContent = "Light";
      } else {
        document.documentElement.removeAttribute("data-theme");
        toggle.textContent = "Dark";
      }
    };

    const saved = localStorage.getItem(themeKey);
    applyTheme(saved === "dark" ? "dark" : "light");

    toggle.addEventListener("click", () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      const next = isDark ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(themeKey, next);
    });
  }

  initTheme();
})();
