// Theme management functionality
(function() {
  'use strict';
  
  function initTheme() {
    const toggle = document.getElementById("theme-toggle");
    const root = document.body;

    // Function to apply theme based on localStorage
    function applyTheme() {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    // Apply theme on initial load
    applyTheme();

    // Listen for storage changes from other tabs/pages
    window.addEventListener('storage', function(e) {
      if (e.key === 'theme') {
        applyTheme();
      }
    });

    // Listen for page visibility changes (when returning to this tab)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        applyTheme();
      }
    });

    // Listen for focus events (when returning to this window)
    window.addEventListener('focus', applyTheme);

    // Handle toggle clicks
    if (toggle) {
      toggle.addEventListener("click", () => {
        const isDark = root.classList.toggle("dark");
        localStorage.setItem("theme", isDark ? "dark" : "light");
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();