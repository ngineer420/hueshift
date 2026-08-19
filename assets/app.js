/*!
 * gamutlens.com — shared app behaviour.
 * Loaded on every page after assets/color-math.js. Every init function is
 * defensive (bails if its elements aren't on the page), so the same file
 * runs unmodified on the homepage (all six tool panels at once) and on
 * every standalone tool page (exactly one panel).
 */
(function () {
  "use strict";

  var CM = window.ColorMath;

  /* ============================ SHAREABLE STATE ============================
   * On a color site the output *is* the artifact, so every tool encodes what
   * it is currently showing into a link you can paste into a review, a
   * ticket, or a message. State goes in ordinary query params on the tool's
   * own clean URL — never on whatever page you happen to be looking at — so
   * a link built from the homepage panel still opens the standalone tool.
   */

  var qsp = new URLSearchParams(window.location.search);

  function setShareUrl(inputId, slug, params) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var parts = [];
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value === "" || value == null) return;
      // Commas and colons are legal unencoded in a query string, and
      // "?stops=ff3e7f:0,8b5cf6:100" is a link a person can read and edit
      // by hand — which is half the point of having one.
      parts.push(
        key + "=" + encodeURIComponent(String(value)).replace(/%2C/g, ",").replace(/%3A/g, ":")
      );
    });
    input.value =
      window.location.origin + "/" + slug + "/" + (parts.length ? "?" + parts.join("&") : "");
  }

  // Accepts "8b5cf6" or "#8b5cf6" — the bare form keeps the shared link
  // free of %23, and pasting a hex straight off a design tool still works.
  function paramHex(name, fallback) {
    var raw = qsp.get(name);
    if (!raw) return fallback;
    var hex = raw.charAt(0) === "#" ? raw : "#" + raw;
    return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : fallback;
  }

  function paramInt(name, min, max, fallback) {
    var n = Number(qsp.get(name));
    if (!isFinite(n) || qsp.get(name) === null || qsp.get(name) === "") return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  function paramOneOf(name, allowed, fallback) {
    var raw = qsp.get(name);
    return allowed.indexOf(raw) !== -1 ? raw : fallback;
  }

  function bare(hex) {
    return hex.replace("#", "").toLowerCase();
  }

  /* ============================== THEME ============================== */
  // The no-flash "apply stored theme before paint" step lives inline in
  // <head> on every page. This just wires the visible toggle button.
  function initTheme() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var root = document.documentElement;
      var current = root.getAttribute("data-theme");
      var isDark =
        current === "dark" ||
        (!current && window.matchMedia("(prefers-color-scheme: dark)").matches);
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("hueshift-theme", next);
      } catch (e) {}
    });
  }

  /* ========================= SWATCH RAIL (accent) ========================= */
  // Signature interaction: clicking any spectrum chip, anywhere on the
  // site, retints every accent-driven surface (buttons, focus rings, the
  // active nav pill, gradients) via CSS custom properties, and persists.
  var SIGNAL_CHIPS = [
    { name: "magenta", hex: "#ff3e7f" },
    { name: "amber", hex: "#ffb627" },
    { name: "lime", hex: "#a6e22e" },
    { name: "cyan", hex: "#2fe6d9" },
    { name: "violet", hex: "#8b5cf6" },
  ];

  function applyAccent(hex, persist) {
    var rgb = CM.hexToRgb(hex);
    if (!rgb) return;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty(
      "--accent-rgb",
      rgb.r + ", " + rgb.g + ", " + rgb.b
    );
    document.querySelectorAll(".swatch-rail button[data-accent]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-accent") === hex));
    });
    if (persist) {
      try {
        localStorage.setItem("hueshift-accent", hex);
      } catch (e) {}
    }
  }

  function initSwatchRails() {
    var rails = document.querySelectorAll(".swatch-rail[data-rail]");
    if (!rails.length) return;

    rails.forEach(function (rail) {
      SIGNAL_CHIPS.forEach(function (chip) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-accent", chip.hex);
        btn.setAttribute("aria-pressed", "false");
        btn.style.background = chip.hex;
        btn.setAttribute("aria-label", "Set site accent to " + chip.name);
        rail.appendChild(btn);
      });
    });

    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".swatch-rail button[data-accent]");
      if (!btn) return;
      applyAccent(btn.getAttribute("data-accent"), true);
    });

    var stored = null;
    try {
      stored = localStorage.getItem("hueshift-accent");
    } catch (e) {}
    if (stored) applyAccent(stored, false);
  }

  /* ================================================================== *
   * toolbar v1 — the portfolio navigation pattern.                      *
   * Spec: github.com/ngineer420/ngineer420.github.io/issues/13          *
   *                                                                     *
   * Copied verbatim from the photoshrink pilot. Pure enhancement: with  *
   * JS off, <details>/<summary> still discloses the sheet, the rail is  *
   * still a native scroll container of real links, the edge fades are   *
   * still CSS and the scrim is still CSS. Only the active-chip          *
   * centring, Escape and click-outside are lost.                        *
   * ================================================================== */
  (function toolbar() {
    var bar = document.querySelector('.toolbar');
    if (!bar) return;
    var rail = bar.querySelector('.tb-rail');
    var menu = bar.querySelector('details.tb-menu');

    if (rail) {
      /* js-on hands the right-hand fade over to measurement. Until then the
         CSS keeps it on, so a JS-disabled visitor never gets a chip clipped
         mid-word with nothing to say there is more of the row. */
      rail.classList.add('js-on');
      var fades = function () {
        var max = rail.scrollWidth - rail.clientWidth;
        rail.classList.toggle('can-l', rail.scrollLeft > 1);
        rail.classList.toggle('can-r', rail.scrollLeft < max - 1);
      };
      /* Centre the current chip, measured from the rail's own box rather than
         through offsetLeft. The chips' offsetParent is .toolbar — the rail
         itself is not positioned — so offsetLeft carries the trigger's width
         with it, and centring on that number lands the active chip a whole
         trigger-width left of centre, half under the left fade at 320px. This
         is still a direct scrollLeft assignment and never scrollIntoView,
         which would also scroll every ancestor and the document and so drop a
         phone visitor below the header on arrival. */
      var current = rail.querySelector('[aria-current]');
      if (current) {
        var cbox = current.getBoundingClientRect();
        var rbox = rail.getBoundingClientRect();
        rail.scrollLeft += (cbox.left - rbox.left) - (rbox.width - cbox.width) / 2;
      }
      rail.addEventListener('scroll', fades, { passive: true });
      window.addEventListener('resize', fades);
      fades();
    }

    if (menu) {
      /* A disclosure, not a modal: focus is deliberately not trapped, Tab
         walks the links and straight out the other side. */
      window.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !menu.open) return;
        menu.open = false;
        var summary = menu.querySelector('summary');
        if (summary) summary.focus();
      });
      document.addEventListener('click', function (e) {
        if (menu.open && !menu.contains(e.target)) menu.open = false;
      });
    }
  })();

  /* ============================== CLIPBOARD ============================== */
  function copyText(text, btn) {
    function done(ok) {
      if (!btn) return;
      var original = btn.getAttribute("data-label") || btn.textContent;
      btn.setAttribute("data-label", original);
      btn.textContent = ok ? "Copied" : "Copy failed";
      btn.classList.add("is-copied");
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("is-copied");
      }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          done(true);
        },
        function () {
          done(false);
        }
      );
    } else {
      try {
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        done(true);
      } catch (e) {
        done(false);
      }
    }
  }

  function wireCopyButtons(root) {
    (root || document).querySelectorAll("[data-copy-target]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-copy-target"));
        if (!target) return;
        var text = "value" in target ? target.value : target.textContent;
        copyText(text, btn);
      });
    });
  }

  /* ============================ PANEL SWITCHING ============================ */
  // Homepage only: instant tool switching with pushState, no reload.
  function initPanelSwitching() {
    var panels = document.querySelectorAll("[data-panel]");
    var overview = document.getElementById("overview-panel");
    if (!panels.length || !overview) return;

    var navLinks = document.querySelectorAll("[data-panel-link]");
    var hero = document.querySelector(".hero");

    function show(slug, push) {
      slug = slug || "color-picker"; // homepage shows the primary tool live
      var target = slug
        ? document.querySelector('[data-panel="' + slug + '"]')
        : overview;
      if (!target) target = overview;

      panels.forEach(function (p) {
        p.hidden = true;
      });
      overview.hidden = true;
      // Hide the tall marketing hero when a specific tool is shown so the tool
      // sits right under the nav instead of below a banner.
      if (hero) hero.hidden = !!slug;
      target.hidden = false;

      navLinks.forEach(function (a) {
        var isCurrent = slug
          ? a.getAttribute("data-panel-link") === slug
          : a.getAttribute("data-panel-link") === "";
        if (isCurrent) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      });

      if (push) {
        var path = slug ? "/" + slug : "/";
        var title = slug
          ? target.getAttribute("data-title") || document.title
          : "gamutlens.com — browser-only color tools for designers & developers";
        document.title = title;
        history.pushState({ panel: slug || null }, "", path);
      }

      // Only scroll on user-initiated switches, never on initial load.
      if (push) target.scrollIntoView({ behavior: "instant", block: "start" });
      var heading = target.querySelector("h1, h2");
      if (heading) heading.setAttribute("tabindex", "-1");
      if (heading) heading.focus({ preventScroll: true });
    }

    document.addEventListener("click", function (e) {
      var link = e.target.closest && e.target.closest("[data-panel-link]");
      if (!link) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      show(link.getAttribute("data-panel-link") || null, true);
    });

    window.addEventListener("popstate", function (e) {
      var slug = e.state && e.state.panel ? e.state.panel : null;
      show(slug, false);
    });

    show(null, false);
  }

  /* ============================ COLOR PICKER (cp-) ============================ */
  function initColorPicker() {
    var colorInput = document.getElementById("cp-color");
    if (!colorInput) return;

    var hue = document.getElementById("cp-hue");
    var sat = document.getElementById("cp-sat");
    var light = document.getElementById("cp-light");
    var preview = document.getElementById("cp-preview");
    var hexVal = document.getElementById("cp-hex-value");
    var rgbVal = document.getElementById("cp-rgb-value");
    var hslVal = document.getElementById("cp-hsl-value");
    var cssVal = document.getElementById("cp-css-value");
    var eyedropperBtn = document.getElementById("cp-eyedropper");

    function render(hex, fromSliders) {
      var rgb = CM.hexToRgb(hex);
      if (!rgb) return;
      var hsl = CM.rgbToHsl(rgb.r, rgb.g, rgb.b);

      colorInput.value = hex;
      preview.style.background = hex;
      hexVal.textContent = hex;
      rgbVal.textContent = CM.formatRgb(rgb.r, rgb.g, rgb.b);
      hslVal.textContent = CM.formatHsl(hsl.h, hsl.s, hsl.l);
      cssVal.textContent = "background-color: " + hex + ";";

      if (!fromSliders) {
        hue.value = hsl.h;
        sat.value = hsl.s;
        light.value = hsl.l;
      }
      document.getElementById("cp-hue-value").textContent = Math.round(hsl.h) + "°";
      document.getElementById("cp-sat-value").textContent = Math.round(hsl.s) + "%";
      document.getElementById("cp-light-value").textContent = Math.round(hsl.l) + "%";

      setShareUrl("cp-share-url", "color-picker", { c: bare(hex) });
    }

    colorInput.addEventListener("input", function () {
      render(colorInput.value, false);
    });

    function fromSliders() {
      var rgb = CM.hslToRgb(Number(hue.value), Number(sat.value), Number(light.value));
      render(CM.rgbToHex(rgb.r, rgb.g, rgb.b), true);
    }
    [hue, sat, light].forEach(function (el) {
      el.addEventListener("input", fromSliders);
    });

    if (window.EyeDropper && eyedropperBtn) {
      eyedropperBtn.hidden = false;
      eyedropperBtn.addEventListener("click", function () {
        new window.EyeDropper()
          .open()
          .then(function (result) {
            render(result.sRGBHex, false);
          })
          .catch(function () {});
      });
    }

    render(paramHex("c", "#8b5cf6"), false);
  }

  /* ============================ CONVERTER (cc-) ============================ */
  function initConverter() {
    var hexInput = document.getElementById("cc-hex-input");
    if (!hexInput) return;
    var rgbInput = document.getElementById("cc-rgb-input");
    var hslInput = document.getElementById("cc-hsl-input");
    var preview = document.getElementById("cc-preview");
    var error = document.getElementById("cc-error");

    function setAll(rgb, skip) {
      var hex = CM.rgbToHex(rgb.r, rgb.g, rgb.b);
      var hsl = CM.rgbToHsl(rgb.r, rgb.g, rgb.b);
      if (skip !== "hex") hexInput.value = hex;
      if (skip !== "rgb") rgbInput.value = rgb.r + ", " + rgb.g + ", " + rgb.b;
      if (skip !== "hsl")
        hslInput.value =
          CM.round(hsl.h, 0) + ", " + CM.round(hsl.s, 0) + "%, " + CM.round(hsl.l, 0) + "%";
      preview.style.background = hex;
      error.hidden = true;
      setShareUrl("cc-share-url", "color-converter", { c: bare(hex) });
    }

    function fail() {
      error.hidden = false;
    }

    hexInput.addEventListener("input", function () {
      var rgb = CM.hexToRgb(hexInput.value);
      if (rgb) setAll(rgb, "hex");
      else fail();
    });

    rgbInput.addEventListener("input", function () {
      var rgb = CM.parseColorString("rgb(" + rgbInput.value + ")");
      if (rgb) setAll(rgb, "rgb");
      else fail();
    });

    hslInput.addEventListener("input", function () {
      var rgb = CM.parseColorString("hsl(" + hslInput.value + ")");
      if (rgb) setAll(rgb, "hsl");
      else fail();
    });

    setAll(CM.hexToRgb(paramHex("c", "#2fe6d9")));
  }

  /* ============================ GRADIENT (gg-) ============================ */
  function initGradient() {
    var list = document.getElementById("gg-stops-list");
    if (!list) return;
    var addBtn = document.getElementById("gg-add-stop");
    var angle = document.getElementById("gg-angle");
    var angleValue = document.getElementById("gg-angle-value");
    var type = document.getElementById("gg-type");
    var preview = document.getElementById("gg-preview");
    var cssValue = document.getElementById("gg-css-value");

    var stopId = 0;

    function makeStop(hex, pos) {
      stopId++;
      var row = document.createElement("div");
      row.className = "stop-row";
      row.innerHTML =
        '<input type="color" value="' +
        hex +
        '" aria-label="Stop color">' +
        '<input type="range" min="0" max="100" value="' +
        pos +
        '" aria-label="Stop position">' +
        '<span class="pos-value">' +
        pos +
        '%</span>' +
        '<button type="button" class="ghost-btn" aria-label="Remove stop">✕</button>';
      list.appendChild(row);
      return row;
    }

    function render() {
      var rows = Array.prototype.slice.call(list.querySelectorAll(".stop-row"));
      var stops = rows
        .map(function (row) {
          var color = row.querySelector('input[type="color"]').value;
          var pos = Number(row.querySelector('input[type="range"]').value);
          row.querySelector(".pos-value").textContent = pos + "%";
          return { color: color, pos: pos };
        })
        .sort(function (a, b) {
          return a.pos - b.pos;
        });

      var stopsCss = stops
        .map(function (s) {
          return s.color + " " + s.pos + "%";
        })
        .join(", ");

      var css;
      if (type.value === "radial") {
        css = "radial-gradient(circle, " + stopsCss + ")";
      } else {
        css = "linear-gradient(" + angle.value + "deg, " + stopsCss + ")";
      }

      preview.style.background = css;
      cssValue.textContent = "background: " + css + ";";

      setShareUrl("gg-share-url", "gradient-generator", {
        type: type.value,
        angle: type.value === "radial" ? null : angle.value,
        stops: stops
          .map(function (s) {
            return bare(s.color) + ":" + s.pos;
          })
          .join(","),
      });

      var removeBtns = list.querySelectorAll(".stop-row button");
      removeBtns.forEach(function (b) {
        b.disabled = rows.length <= 2;
      });
    }

    list.addEventListener("input", render);
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var rows = list.querySelectorAll(".stop-row");
      if (rows.length <= 2) return;
      btn.closest(".stop-row").remove();
      render();
    });

    addBtn.addEventListener("click", function () {
      var rows = list.querySelectorAll(".stop-row").length;
      var chip = SIGNAL_CHIPS[rows % SIGNAL_CHIPS.length];
      makeStop(chip.hex, 50);
      render();
    });

    angle.addEventListener("input", function () {
      angleValue.textContent = angle.value + "°";
      render();
    });
    type.addEventListener("change", render);

    // A shared gradient restores its type, angle and every stop. Anything
    // malformed in the link falls back to the default two-stop gradient
    // rather than rendering a broken one.
    var sharedStops = (qsp.get("stops") || "")
      .split(",")
      .map(function (chunk) {
        var bits = chunk.split(":");
        var rgb = CM.hexToRgb(bits[0].charAt(0) === "#" ? bits[0] : "#" + bits[0]);
        var pos = Number(bits[1]);
        if (!rgb || !isFinite(pos)) return null;
        return {
          hex: CM.rgbToHex(rgb.r, rgb.g, rgb.b),
          pos: Math.max(0, Math.min(100, Math.round(pos))),
        };
      })
      .filter(Boolean);

    type.value = paramOneOf("type", ["linear", "radial"], "linear");
    angle.value = paramInt("angle", 0, 360, Number(angle.value) || 90);
    angleValue.textContent = angle.value + "°";

    if (sharedStops.length >= 2) {
      sharedStops.forEach(function (s) {
        makeStop(s.hex, s.pos);
      });
    } else {
      makeStop("#ff3e7f", 0);
      makeStop("#8b5cf6", 100);
    }
    render();
  }

  /* ============================ PALETTE (pg-) ============================ */
  function initPalette() {
    var baseInput = document.getElementById("pg-base-color");
    if (!baseInput) return;
    var baseHexInput = document.getElementById("pg-base-hex-input");
    var schemeBtns = document.querySelectorAll("#pg-scheme-tabs button");
    var results = document.getElementById("pg-results");

    var scheme = paramOneOf("scheme", ["complementary", "analogous", "triadic"], "complementary");

    function render() {
      var hex = baseInput.value;
      var rgb = CM.hexToRgb(hex);
      if (!rgb) return;
      var hsl = CM.rgbToHsl(rgb.r, rgb.g, rgb.b);
      var swatches = CM.paletteScheme(hsl, scheme);

      setShareUrl("pg-share-url", "color-palette-generator", {
        base: bare(hex),
        scheme: scheme,
      });

      /* The palette carried across to the simulator, in the same
         comma-separated shape setShareUrl already emits for the gradient's
         stops. A palette is exactly the input the collision report wants, and
         retyping five hex values is the reason nobody ever checks. */
      var cvdLink = document.getElementById("pg-cvd-link");
      if (cvdLink) {
        cvdLink.href = "/color-blindness-simulator/?stops=" + swatches.map(function (s) {
          var srgb = CM.hslToRgb(s.h, s.s, s.l);
          return bare(CM.rgbToHex(srgb.r, srgb.g, srgb.b));
        }).join(",");
      }

      results.innerHTML = "";
      swatches.forEach(function (s, i) {
        var srgb = CM.hslToRgb(s.h, s.s, s.l);
        var shex = CM.rgbToHex(srgb.r, srgb.g, srgb.b);
        var chip = document.createElement("div");
        chip.className = "palette-chip";
        var copyId = "pg-swatch-" + i;
        chip.innerHTML =
          '<div class="swatch" style="background:' +
          shex +
          '"></div>' +
          '<div class="meta">' +
          '<div id="' +
          copyId +
          '">' +
          shex +
          "</div>" +
          '<button type="button" class="copy-btn" data-copy-target="' +
          copyId +
          '">Copy</button>' +
          "</div>";
        results.appendChild(chip);
      });
      wireCopyButtons(results);
    }

    baseInput.addEventListener("input", function () {
      baseHexInput.value = baseInput.value;
      render();
    });

    baseHexInput.addEventListener("input", function () {
      var rgb = CM.hexToRgb(baseHexInput.value);
      if (rgb) {
        baseInput.value = CM.rgbToHex(rgb.r, rgb.g, rgb.b);
        render();
      }
    });

    schemeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        scheme = btn.getAttribute("data-scheme");
        schemeBtns.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        render();
      });
    });

    baseInput.value = paramHex("base", baseInput.value);
    baseHexInput.value = baseInput.value;
    schemeBtns.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-scheme") === scheme));
    });
    render();
  }

  /* ============================ CONTRAST (cx-) ============================ */
  function initContrast() {
    var fg = document.getElementById("cx-fg");
    if (!fg) return;
    var bg = document.getElementById("cx-bg");
    var fgHex = document.getElementById("cx-fg-hex");
    var bgHex = document.getElementById("cx-bg-hex");
    var swap = document.getElementById("cx-swap");
    var demo = document.getElementById("cx-demo");
    var ratioNum = document.getElementById("cx-ratio-num");
    var verdicts = document.getElementById("cx-verdicts");

    function render() {
      var fgRgb = CM.hexToRgb(fg.value);
      var bgRgb = CM.hexToRgb(bg.value);
      if (!fgRgb || !bgRgb) return;

      demo.style.color = fg.value;
      demo.style.background = bg.value;

      var ratio = CM.contrastRatio(fgRgb, bgRgb);
      var v = CM.contrastVerdict(ratio);
      ratioNum.textContent = ratio.toFixed(2) + ":1";

      setShareUrl("cx-share-url", "contrast-checker", {
        fg: bare(fg.value),
        bg: bare(bg.value),
      });

      var rows = [
        ["AA · normal text", v.aaNormal, "4.5:1"],
        ["AA · large text", v.aaLarge, "3:1"],
        ["AAA · normal text", v.aaaNormal, "7:1"],
        ["AAA · large text", v.aaaLarge, "4.5:1"],
      ];
      verdicts.innerHTML = rows
        .map(function (r) {
          return (
            '<div class="verdict ' +
            (r[1] ? "pass" : "fail") +
            '"><span class="tag">' +
            (r[1] ? "Pass" : "Fail") +
            "</span><br>" +
            r[0] +
            " <span class=\"mono\">(needs " +
            r[2] +
            ")</span></div>"
          );
        })
        .join("");
    }

    fg.addEventListener("input", function () {
      fgHex.value = fg.value;
      render();
    });
    bg.addEventListener("input", function () {
      bgHex.value = bg.value;
      render();
    });
    fgHex.addEventListener("input", function () {
      var rgb = CM.hexToRgb(fgHex.value);
      if (rgb) {
        fg.value = CM.rgbToHex(rgb.r, rgb.g, rgb.b);
        render();
      }
    });
    bgHex.addEventListener("input", function () {
      var rgb = CM.hexToRgb(bgHex.value);
      if (rgb) {
        bg.value = CM.rgbToHex(rgb.r, rgb.g, rgb.b);
        render();
      }
    });
    swap.addEventListener("click", function () {
      var f = fg.value;
      fg.value = bg.value;
      bg.value = f;
      fgHex.value = fg.value;
      bgHex.value = bg.value;
      render();
    });

    fg.value = paramHex("fg", fg.value);
    bg.value = paramHex("bg", bg.value);
    fgHex.value = fg.value;
    bgHex.value = bg.value;
    render();
  }

  /* ============================ EXTRACTOR (ie-) ============================ */
  function initExtractor() {
    var dropzone = document.getElementById("ie-dropzone");
    if (!dropzone) return;
    var fileInput = document.getElementById("ie-file-input");
    var previewWrap = document.getElementById("ie-preview-wrap");
    var previewImg = document.getElementById("ie-preview-img");
    var canvas = document.getElementById("ie-canvas");
    var results = document.getElementById("ie-results");
    var countSelect = document.getElementById("ie-count");

    function quantize(imageData, count) {
      var buckets = {};
      var data = imageData.data;
      var step = 24; // bucket width per channel (0-255 -> ~11 buckets/channel)
      for (var i = 0; i < data.length; i += 4) {
        var a = data[i + 3];
        if (a < 128) continue;
        var r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        var key =
          Math.round(r / step) + "," + Math.round(g / step) + "," + Math.round(b / step);
        if (!buckets[key]) {
          buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
        }
        buckets[key].r += r;
        buckets[key].g += g;
        buckets[key].b += b;
        buckets[key].n += 1;
      }
      var arr = Object.keys(buckets).map(function (k) {
        var bucket = buckets[k];
        return {
          r: Math.round(bucket.r / bucket.n),
          g: Math.round(bucket.g / bucket.n),
          b: Math.round(bucket.b / bucket.n),
          n: bucket.n,
        };
      });
      arr.sort(function (a, b) {
        return b.n - a.n;
      });
      return arr.slice(0, count);
    }

    function renderPalette(colors) {
      results.innerHTML = "";
      colors.forEach(function (c, i) {
        var hex = CM.rgbToHex(c.r, c.g, c.b);
        var copyId = "ie-swatch-" + i;
        var chip = document.createElement("div");
        chip.className = "palette-chip";
        chip.innerHTML =
          '<div class="swatch" style="background:' +
          hex +
          '"></div>' +
          '<div class="meta">' +
          '<div id="' +
          copyId +
          '">' +
          hex +
          "</div>" +
          '<button type="button" class="copy-btn" data-copy-target="' +
          copyId +
          '">Copy</button>' +
          "</div>";
        results.appendChild(chip);
      });
      wireCopyButtons(results);
    }

    function handleFile(file) {
      if (!file || file.type.indexOf("image/") !== 0) return;
      var url = URL.createObjectURL(file);
      previewImg.onload = function () {
        var ctx = canvas.getContext("2d");
        var maxDim = 160;
        var scale = Math.min(1, maxDim / Math.max(previewImg.naturalWidth, previewImg.naturalHeight));
        canvas.width = Math.max(1, Math.round(previewImg.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(previewImg.naturalHeight * scale));
        ctx.drawImage(previewImg, 0, 0, canvas.width, canvas.height);
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var colors = quantize(imageData, Number(countSelect.value));
        renderPalette(colors);
        previewWrap.classList.add("is-visible");
        URL.revokeObjectURL(url);
      };
      previewImg.src = url;
    }

    dropzone.addEventListener("click", function () {
      fileInput.click();
    });
    dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });
    fileInput.addEventListener("change", function () {
      handleFile(fileInput.files[0]);
    });
    ["dragenter", "dragover"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropzone.classList.add("is-drag");
      });
    });
    ["dragleave", "drop"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropzone.classList.remove("is-drag");
      });
    });
    dropzone.addEventListener("drop", function (e) {
      var file = e.dataTransfer.files && e.dataTransfer.files[0];
      handleFile(file);
    });
    countSelect.addEventListener("change", function () {
      if (previewImg.src) handleFile(fileInput.files[0] || null);
      if (previewImg.complete && previewImg.naturalWidth) {
        var ctx = canvas.getContext("2d");
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        renderPalette(quantize(imageData, Number(countSelect.value)));
      }
    });
  }


  /* ==================== COLOR BLINDNESS SIMULATOR (cb-) ====================
   * Palette mode is the headline. Coblis and Chrome DevTools' built-in vision
   * deficiency emulation both re-render an image; neither tells you WHICH TWO
   * of your swatches have just become one colour, which is the question a
   * palette is actually asking. Image mode is the commodity half and sits
   * below it.
   *
   * The maths — the Viénot 1999 matrices, the linear-light path, Lab and the
   * ΔE cutoff — is all in color-math.js. This is wiring.
   */
  var CB_TYPES = ["deuteranopia", "protanopia", "achromatopsia"];

  var CB_LABELS = {
    deuteranopia: { full: "Deuteranopia", partial: "Deuteranomaly", who: "the M cone is missing (deuteranopia) or shifted (deuteranomaly) — about 6% of men" },
    protanopia: { full: "Protanopia", partial: "Protanomaly", who: "the L cone is missing (protanopia) or shifted (protanomaly) — about 2% of men" },
    achromatopsia: { full: "Achromatopsia", partial: "Partial achromatopsia", who: "no usable colour discrimination at all — vanishingly rare, but the strictest test a palette can face" },
  };

  var CB_DEFAULT = ["#d64545", "#45a045", "#3b7dd8", "#e0a020", "#7b4fa8"];

  function initColorBlindness() {
    var list = document.getElementById("cb-swatches");
    if (!list) return;

    var addBtn = document.getElementById("cb-add");
    var typeSelect = document.getElementById("cb-type");
    var severity = document.getElementById("cb-severity");
    var severityOut = document.getElementById("cb-severity-out");
    var before = document.getElementById("cb-row-before");
    var after = document.getElementById("cb-row-after");
    var afterLabel = document.getElementById("cb-after-label");
    var report = document.getElementById("cb-report");
    var matrixOut = document.getElementById("cb-matrix");

    var dropzone = document.getElementById("cb-dropzone");
    var fileInput = document.getElementById("cb-file-input");
    var imgEl = document.getElementById("cb-img");
    var imageWrap = document.getElementById("cb-image-wrap");
    var canvasBefore = document.getElementById("cb-canvas-before");
    var canvasAfter = document.getElementById("cb-canvas-after");

    function hexes() {
      return Array.prototype.slice.call(list.querySelectorAll('input[type="color"]'))
        .map(function (i) { return i.value; });
    }

    function addSwatch(hex) {
      var row = document.createElement("div");
      row.className = "cb-swatch-row";
      row.innerHTML =
        '<input type="color" value="' + hex + '" aria-label="Palette color">' +
        '<input type="text" class="cb-hex" value="' + hex + '" spellcheck="false" autocomplete="off" aria-label="Palette color as hex">' +
        '<button type="button" class="ghost-btn" aria-label="Remove color">✕</button>';
      list.appendChild(row);
      return row;
    }

    function labelFor(type, s) {
      var l = CB_LABELS[type];
      return s >= 0.999 ? l.full : s <= 0.001 ? "No deficiency" : l.partial + " (" + Math.round(s * 100) + "%)";
    }

    /* The matrix is printed from the same table the simulation runs on, so the
       coefficients on the page cannot drift from the ones doing the work. */
    function renderMatrix(type, s) {
      if (!matrixOut) return;
      var m = CM.CVD_MATRICES[type];
      var rows = m.map(function (row, i) {
        return row.map(function (v, k) {
          var coeff = v * s + (i === k ? 1 - s : 0);
          return (coeff >= 0 ? " " : "") + coeff.toFixed(5);
        }).join("  ");
      });
      matrixOut.textContent = rows.join("\n");
    }

    function renderReport(list_, type, s) {
      report.innerHTML = "";
      var pairs = CM.collapsedPairs(list_, type, s);
      var head = document.createElement("p");
      head.className = "cb-report-head";

      if (s <= 0.001) {
        head.textContent = "Severity is at zero, so nothing is being simulated.";
        report.appendChild(head);
        return;
      }
      if (list_.length < 2) {
        head.textContent = "Add a second colour and this reports which pairs collapse into one.";
        report.appendChild(head);
        return;
      }
      if (!pairs.length) {
        head.className += " is-ok";
        head.textContent = "No pair in this palette collapses. Every pair that was at least "
          + CM.CVD_DELTA_E + " ΔE*ab apart is still at least that far apart to "
          + labelFor(type, s).toLowerCase() + ".";
        report.appendChild(head);
        return;
      }
      head.className += " is-warn";
      head.textContent = pairs.length + (pairs.length === 1 ? " pair reads" : " pairs read")
        + " as the same colour to " + labelFor(type, s).toLowerCase() + ".";
      report.appendChild(head);

      var ul = document.createElement("ul");
      ul.className = "cb-report-list";
      pairs.forEach(function (p) {
        var li = document.createElement("li");
        li.innerHTML =
          '<span class="cb-pair">' +
          '<span class="cb-dot" style="background:' + p.hexA + '"></span>' +
          '<span class="mono">' + p.hexA + '</span>' +
          '<span class="cb-pair-arrow" aria-hidden="true">+</span>' +
          '<span class="cb-dot" style="background:' + p.hexB + '"></span>' +
          '<span class="mono">' + p.hexB + '</span>' +
          "</span>" +
          '<span class="cb-delta">ΔE*ab ' + p.before.toFixed(1) + " → <b>" + p.after.toFixed(1) + "</b></span>";
        ul.appendChild(li);
      });
      report.appendChild(ul);
    }

    function renderStrip(target, colors, simulate, type, s) {
      target.innerHTML = "";
      colors.forEach(function (hex) {
        var rgb = CM.hexToRgb(hex);
        if (!rgb) return;
        var shown = simulate ? CM.simulateDeficiency(rgb, type, s) : rgb;
        var shownHex = CM.rgbToHex(shown.r, shown.g, shown.b);
        var chip = document.createElement("div");
        chip.className = "cb-chip";
        chip.innerHTML =
          '<span class="cb-chip-swatch" style="background:' + shownHex + '"></span>' +
          '<span class="mono">' + shownHex + "</span>";
        target.appendChild(chip);
      });
    }

    function renderImage(type, s) {
      if (!imgEl || !imgEl.naturalWidth) return;
      var maxDim = 520;
      var scale = Math.min(1, maxDim / Math.max(imgEl.naturalWidth, imgEl.naturalHeight));
      var w = Math.max(1, Math.round(imgEl.naturalWidth * scale));
      var h = Math.max(1, Math.round(imgEl.naturalHeight * scale));
      [canvasBefore, canvasAfter].forEach(function (c) { c.width = w; c.height = h; });

      var ctxB = canvasBefore.getContext("2d");
      ctxB.drawImage(imgEl, 0, 0, w, h);
      var data = ctxB.getImageData(0, 0, w, h);
      var px = data.data;
      var probe = { r: 0, g: 0, b: 0 };
      for (var i = 0; i < px.length; i += 4) {
        probe.r = px[i]; probe.g = px[i + 1]; probe.b = px[i + 2];
        var out = CM.simulateDeficiency(probe, type, s);
        px[i] = out.r; px[i + 1] = out.g; px[i + 2] = out.b;
      }
      canvasAfter.getContext("2d").putImageData(data, 0, 0);
      imageWrap.classList.add("is-visible");
    }

    function render() {
      var type = typeSelect.value;
      var s = Number(severity.value) / 100;
      var colors = hexes();

      severityOut.textContent = Math.round(s * 100) + "%";
      afterLabel.textContent = labelFor(type, s);

      // Keep each hex box in step with its own colour well.
      Array.prototype.slice.call(list.querySelectorAll(".cb-swatch-row")).forEach(function (row) {
        var well = row.querySelector('input[type="color"]');
        var hex = row.querySelector(".cb-hex");
        if (document.activeElement !== hex) hex.value = well.value;
      });

      renderStrip(before, colors, false, type, s);
      renderStrip(after, colors, true, type, s);
      renderReport(colors, type, s);
      renderMatrix(type, s);
      renderImage(type, s);

      setShareUrl("cb-share-url", "color-blindness-simulator", {
        type: type,
        severity: Math.round(s * 100),
        stops: colors.map(function (h) { return bare(h); }).join(","),
      });

      var removeBtns = list.querySelectorAll(".cb-swatch-row button");
      Array.prototype.forEach.call(removeBtns, function (b) { b.disabled = colors.length <= 2; });
    }

    /* A palette arrives from /color-palette-generator/ and from the gradient
       generator in the same comma-and-colon shape setShareUrl already emits,
       so "check this palette" is one link rather than five copy-pastes. The
       position after the colon is the gradient's; here it is ignored. */
    var shared = (qsp.get("stops") || "")
      .split(",")
      .map(function (chunk) {
        var raw = chunk.split(":")[0];
        if (!raw) return null;
        var rgb = CM.hexToRgb(raw.charAt(0) === "#" ? raw : "#" + raw);
        return rgb ? CM.rgbToHex(rgb.r, rgb.g, rgb.b) : null;
      })
      .filter(Boolean);

    typeSelect.value = paramOneOf("type", CB_TYPES, "deuteranopia");
    severity.value = paramInt("severity", 0, 100, 100);

    (shared.length >= 2 ? shared : CB_DEFAULT).slice(0, 12).forEach(addSwatch);

    list.addEventListener("input", function (e) {
      if (e.target.classList && e.target.classList.contains("cb-hex")) {
        var rgb = CM.hexToRgb(e.target.value);
        if (!rgb) return;
        e.target.closest(".cb-swatch-row").querySelector('input[type="color"]').value =
          CM.rgbToHex(rgb.r, rgb.g, rgb.b);
      }
      render();
    });
    list.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      if (list.querySelectorAll(".cb-swatch-row").length <= 2) return;
      btn.closest(".cb-swatch-row").remove();
      render();
    });
    addBtn.addEventListener("click", function () {
      var n = list.querySelectorAll(".cb-swatch-row").length;
      if (n >= 12) return;
      addSwatch(CB_DEFAULT[n % CB_DEFAULT.length]);
      render();
    });
    typeSelect.addEventListener("change", render);
    severity.addEventListener("input", render);

    if (dropzone) {
      function handleImage(file) {
        if (!file || file.type.indexOf("image/") !== 0) return;
        var url = URL.createObjectURL(file);
        imgEl.onload = function () {
          render();
          URL.revokeObjectURL(url);
        };
        imgEl.src = url;
      }
      dropzone.addEventListener("click", function () { fileInput.click(); });
      dropzone.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); }
      });
      fileInput.addEventListener("change", function () { handleImage(fileInput.files[0]); });
      ["dragenter", "dragover"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.add("is-drag"); });
      });
      ["dragleave", "drop"].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); dropzone.classList.remove("is-drag"); });
      });
      dropzone.addEventListener("drop", function (e) {
        handleImage(e.dataTransfer.files && e.dataTransfer.files[0]);
      });
    }

    render();
  }

  /* ==================== SHADES GENERATOR (cs-) ==================== */
  /* Tints, shades and tones from one base colour, plus the 50-950 scale.
     The maths lives in color-math.js; this is only wiring. */

  function initShades() {
    var picker = document.getElementById("cs-color");
    if (!picker) return;
    var hexInput = document.getElementById("cs-hex");
    var strips = {
      tints: document.getElementById("cs-tints"),
      shades: document.getElementById("cs-shades"),
      tones: document.getElementById("cs-tones"),
      ramp: document.getElementById("cs-ramp"),
    };
    var outHex = document.getElementById("cs-out-hex");
    var outVars = document.getElementById("cs-out-vars");
    var outRamp = document.getElementById("cs-out-ramp");

    function swatch(hex, label, sub) {
      var el = document.createElement("div");
      el.className = "shade-chip";
      el.innerHTML =
        '<span class="shade-swatch" style="background:' + hex + '"></span>' +
        '<span class="shade-meta"><b>' + label + "</b><span>" + hex + "</span>" +
        (sub ? "<span>" + sub + "</span>" : "") + "</span>";
      // The swatch is the copy button: on a page that is nothing but swatches,
      // a row of little buttons beside them would be noise.
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", "Copy " + hex);
      function copy() { copyText(hex, el); }
      el.addEventListener("click", copy);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(); }
      });
      return el;
    }

    function render(hex) {
      var rgb = CM.hexToRgb(hex);
      if (!rgb) return;
      var tints = CM.tints(rgb);
      var shades = CM.shades(rgb);
      var tones = CM.tones(rgb);
      var ramp = CM.rampScale(rgb);
      var toHex = function (entry) { return CM.rgbToHex(entry.rgb.r, entry.rgb.g, entry.rgb.b); };

      [["tints", tints], ["shades", shades], ["tones", tones]].forEach(function (pair) {
        var host = strips[pair[0]];
        if (!host) return;
        host.innerHTML = "";
        // A tone is saturation removed, so a grey has none: rather than
        // print ten identical swatches with ten different percentages on
        // them, say why the row is empty.
        if (pair[0] === "tones" && CM.rgbToHsl(rgb.r, rgb.g, rgb.b).s < 2) {
          host.innerHTML =
            '<p class="strip-note">This base has no saturation to remove, so every tone lands back on the colour itself. Tones only mean something once there is some chroma in the base.</p>';
          return;
        }
        pair[1].forEach(function (entry) {
          host.appendChild(swatch(toHex(entry), entry.amount + "%", null));
        });
      });

      if (strips.ramp) {
        strips.ramp.innerHTML = "";
        ramp.forEach(function (entry) {
          strips.ramp.appendChild(swatch(entry.hex, String(entry.step), "L* " + entry.lightness));
        });
      }

      var all = tints.map(toHex).reverse().concat([hex.toLowerCase()], shades.map(toHex));
      if (outHex) outHex.value = all.join(", ");
      if (outVars) {
        outVars.value = ramp.map(function (e) {
          return "  --color-" + e.step + ": " + e.hex + ";";
        }).join("\n");
      }
      if (outRamp) {
        outRamp.value = ramp.map(function (e) { return e.step + ": " + e.hex; }).join("\n");
      }
      setShareUrl("cs-share-url", "color-shades-generator", { hex: bare(hex) });
    }

    function setHex(hex, from) {
      hex = hex.toLowerCase();
      if (from !== "picker") picker.value = hex;
      if (from !== "text") hexInput.value = hex;
      render(hex);
    }

    picker.addEventListener("input", function () { setHex(picker.value, "picker"); });
    hexInput.addEventListener("input", function () {
      var rgb = CM.hexToRgb(hexInput.value);
      if (rgb) setHex(CM.rgbToHex(rgb.r, rgb.g, rgb.b), "text");
    });

    setHex(paramHex("hex", picker.value), null);
  }

  /* ==================== COLOR NAME FINDER (cn-) ==================== */

  function initColorNameFinder() {
    var picker = document.getElementById("cn-color");
    if (!picker || !window.ColorNames) return;
    var CN = window.ColorNames;
    var hexInput = document.getElementById("cn-hex");
    var result = document.getElementById("cn-result");
    var list = document.getElementById("cn-list");

    function card(match, rgb) {
      var contrastWhite = CM.contrastRatio(match, { r: 255, g: 255, b: 255 });
      var contrastBlack = CM.contrastRatio(match, { r: 0, g: 0, b: 0 });
      return (
        '<div class="name-hit">' +
        '<span class="name-swatch" style="background:' + match.hex + '"></span>' +
        '<div class="name-body">' +
        "<h3>" + match.name + "</h3>" +
        '<p class="name-verdict">' +
        (match.exact
          ? "An exact match: that hex is this colour."
          : match.distance < 2
            ? "Visually identical — a Lab difference of " + match.distance.toFixed(1) + " is below what an eye can separate."
            : match.distance < 10
              ? "Close: a Lab difference of " + match.distance.toFixed(1) + ", near enough to call it by this name."
              : "The nearest name, but not a close one — a Lab difference of " + match.distance.toFixed(1) + " is a visibly different colour.") +
        "</p>" +
        '<p class="name-facts">' + match.hex + " · " + CM.formatRgb(match.r, match.g, match.b) +
        " · " + contrastWhite.toFixed(2) + ":1 on white · " + contrastBlack.toFixed(2) + ":1 on black</p>" +
        "</div></div>"
      );
    }

    function render(hex) {
      var rgb = CM.hexToRgb(hex);
      if (!rgb) return;
      var matches = CN.nearest(rgb, 6);
      result.innerHTML = card(matches[0], rgb);
      list.innerHTML = matches.slice(1).map(function (m) {
        return (
          '<li><span class="name-swatch small" style="background:' + m.hex + '"></span>' +
          "<b>" + m.name + "</b><span>" + m.hex + "</span>" +
          "<span>Δ" + m.distance.toFixed(1) + "</span></li>"
        );
      }).join("");
      setShareUrl("cn-share-url", "color-name-finder", { hex: bare(hex) });
    }

    function setHex(hex, from) {
      hex = hex.toLowerCase();
      if (from !== "picker") picker.value = hex;
      if (from !== "text") hexInput.value = hex;
      render(hex);
    }

    picker.addEventListener("input", function () { setHex(picker.value, "picker"); });
    hexInput.addEventListener("input", function () {
      var rgb = CM.hexToRgb(hexInput.value);
      if (rgb) setHex(CM.rgbToHex(rgb.r, rgb.g, rgb.b), "text");
    });

    setHex(paramHex("hex", picker.value), null);
  }

  /* ============================== BOOT ============================== */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSwatchRails();
    wireCopyButtons(document);
    initPanelSwitching();
    initColorPicker();
    initConverter();
    initGradient();
    initPalette();
    initContrast();
    initExtractor();
    initShades();
    initColorNameFinder();
    initColorBlindness();
  });
})();
