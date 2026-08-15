// Zephlo landing — the only hand-written JS on the site.
// Everything here is progressive enhancement: pages are fully readable
// without it (see the .no-js fallbacks in site.css).
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Theme toggle ─────────────────────────────────────────────────────
  // base.html sets data-theme before first paint; buttons just flip it.
  document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("zephlo-theme", next);
    });
  });

  // ── Navbar background on scroll ──────────────────────────────────────
  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile menu ──────────────────────────────────────────────────────
  var menuBtn = document.getElementById("menu-toggle");
  var menu = document.getElementById("mobile-menu");
  if (menuBtn && menu) {
    menu.hidden = false; // CSS collapses it; hidden is only the no-JS default
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.querySelector(".icon-menu").classList.toggle("hidden", open);
      menuBtn.querySelector(".icon-close").classList.toggle("hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.querySelector(".icon-menu").classList.remove("hidden");
        menuBtn.querySelector(".icon-close").classList.add("hidden");
        document.body.style.overflow = "";
      });
    });
  }

  // ── Scroll reveal ────────────────────────────────────────────────────
  // Mirrors the framer-motion whileInView pattern: once, -80px margin.
  var revealed = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -80px 0px" }
    );
    revealed.forEach(function (el) {
      var delay = el.getAttribute("data-reveal-delay");
      if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
      observer.observe(el);
    });
  } else {
    revealed.forEach(function (el) {
      el.classList.add("revealed");
    });
  }

  // ── Copy-to-clipboard buttons ────────────────────────────────────────
  document.querySelectorAll("[data-copy-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!code) return;
      navigator.clipboard.writeText(code.textContent);
      var label = btn.querySelector(".copy-label");
      label.textContent = "Copied";
      btn.classList.add("text-[var(--emerald)]");
      setTimeout(function () {
        label.textContent = "Copy";
        btn.classList.remove("text-[var(--emerald)]");
      }, 2000);
    });
  });

  // ── Scripted hero demos ──────────────────────────────────────────────
  // A [data-demo] panel plays a 6-phase scene on a loop. Elements inside opt
  // in with data attributes; applyPhase toggles classes and site.css styles
  // them:
  //   data-show-from="N"   → .on   visible from phase N (chat items, screens)
  //   data-show-only="N"   → .on   visible only at phase N (typing dots)
  //   data-hide-from="N"   → .off  hidden from phase N (old screen)
  //   data-active-from="N" → .active  highlighted from phase N (nav items,
  //                          toggles, card selects, value/button swaps)
  // Reduced-motion shows the finished scene (phase 6) immediately.
  function applyPhase(root, phase) {
    root.querySelectorAll("[data-show-from]").forEach(function (el) {
      el.classList.toggle("on", phase >= +el.getAttribute("data-show-from"));
    });
    root.querySelectorAll("[data-show-only]").forEach(function (el) {
      el.classList.toggle("on", phase === +el.getAttribute("data-show-only"));
    });
    root.querySelectorAll("[data-hide-from]").forEach(function (el) {
      el.classList.toggle("off", phase >= +el.getAttribute("data-hide-from"));
    });
    root.querySelectorAll("[data-active-from]").forEach(function (el) {
      el.classList.toggle("active", phase >= +el.getAttribute("data-active-from"));
    });
  }

  document.querySelectorAll("[data-demo]").forEach(function (demo) {
    if (reduceMotion) {
      applyPhase(demo, 6);
      return;
    }
    var SCHEDULE = [
      [900, 1], [2100, 2], [3300, 3], [5100, 4], [6600, 5], [8300, 6],
    ];
    var LOOP_AFTER = 12500;
    var timers = [];
    var run = function () {
      timers.forEach(clearTimeout);
      timers = [];
      applyPhase(demo, 0);
      SCHEDULE.forEach(function (step) {
        timers.push(setTimeout(function () {
          applyPhase(demo, step[1]);
        }, step[0]));
      });
      timers.push(setTimeout(run, LOOP_AFTER));
    };
    run();
  });

  // ── Looping feeds (resolution log / audit stream) ────────────────────
  // Reveals .feed-row children one-by-one, restarting periodically.
  document.querySelectorAll("[data-feed]").forEach(function (feed) {
    if (reduceMotion) return; // CSS already shows all rows
    var rows = feed.querySelectorAll(".feed-row");
    var DELAYS = [700, 2200, 3700, 5200];
    var RESTART = 10500;
    var timers = [];
    var run = function () {
      timers.forEach(clearTimeout);
      timers = [];
      rows.forEach(function (row) {
        row.classList.remove("on");
      });
      rows.forEach(function (row, i) {
        timers.push(setTimeout(function () {
          row.classList.add("on");
        }, DELAYS[i] || (i + 1) * 1500));
      });
      timers.push(setTimeout(run, RESTART));
    };
    run();
  });
})();
