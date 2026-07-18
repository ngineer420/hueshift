/*!
 * color-math.js — zero-dependency color conversion & contrast helpers.
 * Works as a plain <script> (attaches window.ColorMath) or as a CommonJS
 * module (module.exports) so the exact same file powers the browser UI
 * and the Node unit tests. No external requests, no build step.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ColorMath = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function round(n, places) {
    var p = Math.pow(10, places || 0);
    return Math.round(n * p) / p;
  }

  // ---- HEX -----------------------------------------------------------

  /** Parse "#f0a", "f0a", "#ff00aa", "ff00aa" -> {r,g,b} (0-255 ints) or null. */
  function hexToRgb(hex) {
    if (typeof hex !== "string") return null;
    var s = hex.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(s)) {
      s = s
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    };
  }

  function componentToHex(c) {
    var h = clamp(Math.round(c), 0, 255).toString(16);
    return h.length === 1 ? "0" + h : h;
  }

  /** {r,g,b} (0-255) -> "#rrggbb" (lowercase). */
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // ---- RGB <-> HSL -----------------------------------------------------

  /** {r,g,b} (0-255) -> {h (0-360), s (0-100), l (0-100)}. */
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    var max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    var h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }

    return { h: round(h * 360, 1), s: round(s * 100, 1), l: round(l * 100, 1) };
  }

  function hueToRgbChannel(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  /** h (0-360), s (0-100), l (0-100) -> {r,g,b} (0-255 ints). */
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    h /= 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;

    var r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hueToRgbChannel(p, q, h + 1 / 3);
      g = hueToRgbChannel(p, q, h);
      b = hueToRgbChannel(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  }

  // ---- Parsing free-form strings ---------------------------------------

  /** Accepts hex, "rgb(a)(...)" or "hsl(a)(...)" strings -> {r,g,b} or null. */
  function parseColorString(str) {
    if (typeof str !== "string") return null;
    var s = str.trim();

    var rgbMatch = s.match(
      /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*[\d.]+\s*)?\)$/i
    );
    if (rgbMatch) {
      return {
        r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
        g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
        b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
      };
    }

    var hslMatch = s.match(
      /^hsla?\(\s*(-?[\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*[\d.]+\s*)?\)$/i
    );
    if (hslMatch) {
      return hslToRgb(
        parseFloat(hslMatch[1]),
        parseFloat(hslMatch[2]),
        parseFloat(hslMatch[3])
      );
    }

    return hexToRgb(s);
  }

  function formatRgb(r, g, b) {
    return "rgb(" + Math.round(r) + ", " + Math.round(g) + ", " + Math.round(b) + ")";
  }

  function formatHsl(h, s, l) {
    return "hsl(" + round(h, 0) + ", " + round(s, 0) + "%, " + round(l, 0) + "%)";
  }

  // ---- WCAG contrast -----------------------------------------------------

  function srgbChannelToLinear(c) {
    var cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  }

  /** {r,g,b} (0-255) -> relative luminance per WCAG 2.x, in [0,1]. */
  function relativeLuminance(r, g, b) {
    var R = srgbChannelToLinear(r);
    var G = srgbChannelToLinear(g);
    var B = srgbChannelToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  /** Contrast ratio between two {r,g,b} colors, in [1, 21]. */
  function contrastRatio(rgbA, rgbB) {
    var lA = relativeLuminance(rgbA.r, rgbA.g, rgbA.b);
    var lB = relativeLuminance(rgbB.r, rgbB.g, rgbB.b);
    var lighter = Math.max(lA, lB);
    var darker = Math.min(lA, lB);
    return round((lighter + 0.05) / (darker + 0.05), 2);
  }

  /** WCAG pass/fail thresholds for a given ratio. */
  function contrastVerdict(ratio) {
    return {
      ratio: ratio,
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    };
  }

  // ---- Palette schemes -----------------------------------------------------

  function rotateHue(h, deg) {
    return ((h + deg) % 360 + 360) % 360;
  }

  /** Base {h,s,l} -> array of {h,s,l} for a named scheme. */
  function paletteScheme(hsl, scheme) {
    var h = hsl.h,
      s = hsl.s,
      l = hsl.l;
    switch (scheme) {
      case "complementary":
        return [hsl, { h: rotateHue(h, 180), s: s, l: l }];
      case "analogous":
        return [
          { h: rotateHue(h, -30), s: s, l: l },
          hsl,
          { h: rotateHue(h, 30), s: s, l: l },
        ];
      case "triadic":
        return [
          hsl,
          { h: rotateHue(h, 120), s: s, l: l },
          { h: rotateHue(h, 240), s: s, l: l },
        ];
      default:
        return [hsl];
    }
  }

  return {
    clamp: clamp,
    round: round,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb,
    parseColorString: parseColorString,
    formatRgb: formatRgb,
    formatHsl: formatHsl,
    relativeLuminance: relativeLuminance,
    contrastRatio: contrastRatio,
    contrastVerdict: contrastVerdict,
    rotateHue: rotateHue,
    paletteScheme: paletteScheme,
  };
});
