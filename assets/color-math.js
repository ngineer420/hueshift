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

  /* ------------------------- tints, shades and tones -------------------------
   *
   * Three different operations that get used interchangeably and are not
   * interchangeable:
   *
   *   tint   mix toward white   — lighter, same hue
   *   shade  mix toward black   — darker, same hue
   *   tone   mix toward grey    — same lightness, less saturation
   *
   * A tone is the one people get wrong. Reaching for "muted" and turning the
   * lightness down gives a shade, not a tone: the colour goes dark instead of
   * going quiet. Reducing saturation at fixed HSL lightness is exactly mixing
   * with the grey of the same lightness, which is what a tone is.
   */

  function mixChannel(a, b, t) {
    return clamp(Math.round(a + (b - a) * t), 0, 255);
  }

  /** Mix two {r,g,b} by `t` (0 = all of a, 1 = all of b). */
  function mixRgb(a, b, t) {
    return {
      r: mixChannel(a.r, b.r, t),
      g: mixChannel(a.g, b.g, t),
      b: mixChannel(a.b, b.b, t),
    };
  }

  var WHITE = { r: 255, g: 255, b: 255 };
  var BLACK = { r: 0, g: 0, b: 0 };

  function towards(rgb, target, steps) {
    var out = [];
    for (var i = 1; i <= steps; i++) {
      // Stop short of the target: the last step of a ten-step run to white is
      // white, and a swatch of white is not a tint of anything.
      var t = (i / (steps + 1));
      out.push({ amount: round(t * 100, 0), rgb: mixRgb(rgb, target, t) });
    }
    return out;
  }

  function tints(rgb, steps) {
    return towards(rgb, WHITE, steps || 10);
  }

  function shades(rgb, steps) {
    return towards(rgb, BLACK, steps || 10);
  }

  function tones(rgb, steps) {
    var count = steps || 10;
    var base = rgbToHsl(rgb.r, rgb.g, rgb.b);
    var out = [];
    for (var i = 1; i <= count; i++) {
      var t = i / (count + 1);
      out.push({
        amount: round(t * 100, 0),
        rgb: hslToRgb(base.h, base.s * (1 - t), base.l),
      });
    }
    return out;
  }

  /* ------------------------------ the 50-950 ramp ------------------------------
   *
   * The scale people paste into a config. Naive versions space it evenly in
   * HSL lightness, which is why they come out wrong at both ends: HSL
   * lightness is not perceptual, so an even split puts most of the visible
   * difference in the dark half and leaves 50, 100 and 200 nearly identical.
   *
   * These targets are CIE L* instead — the lightness axis built so that equal
   * numbers are equal perceived steps — and each stop is solved for by
   * searching HSL lightness until the result hits its target. The hue is held
   * exactly; saturation is eased off at the pale end, where full saturation
   * both looks fluorescent and cannot reach the target L* at all.
   */

  var RAMP_TARGETS = [
    { step: 50, L: 97, sat: 0.55 },
    { step: 100, L: 94, sat: 0.68 },
    { step: 200, L: 87, sat: 0.82 },
    { step: 300, L: 78, sat: 0.92 },
    { step: 400, L: 67, sat: 1.0 },
    { step: 500, L: 56, sat: 1.0 },
    { step: 600, L: 47, sat: 1.0 },
    { step: 700, L: 38, sat: 0.98 },
    { step: 800, L: 29, sat: 0.94 },
    { step: 900, L: 21, sat: 0.9 },
    { step: 950, L: 14, sat: 0.86 },
  ];

  /** Perceptual lightness L* (0-100) of an {r,g,b}, from its WCAG luminance. */
  function perceptualLightness(rgb) {
    var y = relativeLuminance(rgb.r, rgb.g, rgb.b);
    return y > 0.008856 ? 116 * Math.pow(y, 1 / 3) - 16 : 903.3 * y;
  }

  /**
   * The 50-950 scale for a base colour.
   *
   * Binary search rather than a formula because there is no closed form: L*
   * runs through the sRGB transfer curve and the luminance weights, so the
   * only honest way to land on 67 exactly is to look for it. Twenty-four
   * iterations gets well inside a rounding step and costs nothing.
   */
  function rampScale(rgb) {
    var base = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return RAMP_TARGETS.map(function (target) {
      var sat = clamp(base.s * target.sat, 0, 100);
      var lo = 0, hi = 100, mid = 50, out = null;
      for (var i = 0; i < 24; i++) {
        mid = (lo + hi) / 2;
        out = hslToRgb(base.h, sat, mid);
        if (perceptualLightness(out) < target.L) lo = mid;
        else hi = mid;
      }
      return {
        step: target.step,
        rgb: out,
        hex: rgbToHex(out.r, out.g, out.b),
        lightness: round(perceptualLightness(out), 1),
      };
    });
  }

  return {
    clamp: clamp,
    round: round,
    mixRgb: mixRgb,
    tints: tints,
    shades: shades,
    tones: tones,
    rampScale: rampScale,
    perceptualLightness: perceptualLightness,
    RAMP_TARGETS: RAMP_TARGETS,
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
