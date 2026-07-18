/*!
 * hueshift.net — shared app behaviour.
 * Loaded on every page after assets/color-math.js. Every init function is
 * defensive (bails if its elements aren't on the page), so the same file
 * runs unmodified on the homepage (all six tool panels at once) and on
 * every standalone tool page (exactly one panel).
 */
(function () {
  "use strict";

  var CM = window.ColorMath;

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

  /* ============================ MOBILE NAV ============================ */
  function initMobileNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("tool-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

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
          : "hueshift.net — browser-only color tools for designers & developers";
        document.title = title;
        history.pushState({ panel: slug || null }, "", path);
      }

      target.scrollIntoView({ behavior: "instant", block: "start" });
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

    render("#8b5cf6", false);
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

    setAll(CM.hexToRgb("#2fe6d9"));
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

    makeStop("#ff3e7f", 0);
    makeStop("#8b5cf6", 100);
    render();
  }

  /* ============================ PALETTE (pg-) ============================ */
  function initPalette() {
    var baseInput = document.getElementById("pg-base-color");
    if (!baseInput) return;
    var baseHexInput = document.getElementById("pg-base-hex-input");
    var schemeBtns = document.querySelectorAll("#pg-scheme-tabs button");
    var results = document.getElementById("pg-results");

    var scheme = "complementary";

    function render() {
      var hex = baseInput.value;
      var rgb = CM.hexToRgb(hex);
      if (!rgb) return;
      var hsl = CM.rgbToHsl(rgb.r, rgb.g, rgb.b);
      var swatches = CM.paletteScheme(hsl, scheme);

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

  /* ============================== BOOT ============================== */
  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSwatchRails();
    initMobileNav();
    wireCopyButtons(document);
    initPanelSwitching();
    initColorPicker();
    initConverter();
    initGradient();
    initPalette();
    initContrast();
    initExtractor();
  });
})();
