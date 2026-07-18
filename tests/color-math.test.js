/**
 * Zero-dependency test runner for assets/color-math.js.
 * Run with: node tests/color-math.test.js
 */
"use strict";
var assert = require("assert");
var CM = require("../assets/color-math.js");

var failures = 0;
var passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok  - " + name);
  } catch (err) {
    failures++;
    console.error("  FAIL - " + name);
    console.error("        " + err.message);
  }
}

function approxEqual(a, b, tolerance, msg) {
  tolerance = tolerance == null ? 1 : tolerance;
  assert.ok(
    Math.abs(a - b) <= tolerance,
    (msg || "") + " expected " + a + " ~= " + b + " (tolerance " + tolerance + ")"
  );
}

console.log("color-math.js");

// ---- HEX <-> RGB ---------------------------------------------------------

test("hexToRgb parses 6-digit hex with #", function () {
  assert.deepStrictEqual(CM.hexToRgb("#ff00aa"), { r: 255, g: 0, b: 170 });
});

test("hexToRgb parses 6-digit hex without #", function () {
  assert.deepStrictEqual(CM.hexToRgb("ff00aa"), { r: 255, g: 0, b: 170 });
});

test("hexToRgb expands 3-digit shorthand", function () {
  assert.deepStrictEqual(CM.hexToRgb("#f0a"), { r: 255, g: 0, b: 170 });
});

test("hexToRgb is case-insensitive", function () {
  assert.deepStrictEqual(CM.hexToRgb("#FF00AA"), { r: 255, g: 0, b: 170 });
});

test("hexToRgb rejects invalid input", function () {
  assert.strictEqual(CM.hexToRgb("not-a-color"), null);
  assert.strictEqual(CM.hexToRgb("#ff00"), null);
  assert.strictEqual(CM.hexToRgb(""), null);
});

test("rgbToHex round-trips known values", function () {
  assert.strictEqual(CM.rgbToHex(255, 0, 170), "#ff00aa");
  assert.strictEqual(CM.rgbToHex(0, 0, 0), "#000000");
  assert.strictEqual(CM.rgbToHex(255, 255, 255), "#ffffff");
});

test("hex -> rgb -> hex round trip is stable for 100 sampled colors", function () {
  for (var i = 0; i < 100; i++) {
    var r = (i * 37) % 256;
    var g = (i * 53) % 256;
    var b = (i * 91) % 256;
    var hex = CM.rgbToHex(r, g, b);
    var rgb = CM.hexToRgb(hex);
    assert.strictEqual(CM.rgbToHex(rgb.r, rgb.g, rgb.b), hex);
  }
});

// ---- RGB <-> HSL ---------------------------------------------------------

test("rgbToHsl: pure red is h=0 s=100 l=50", function () {
  var hsl = CM.rgbToHsl(255, 0, 0);
  approxEqual(hsl.h, 0, 0.5);
  approxEqual(hsl.s, 100, 0.5);
  approxEqual(hsl.l, 50, 0.5);
});

test("rgbToHsl: pure white is s=0 l=100", function () {
  var hsl = CM.rgbToHsl(255, 255, 255);
  approxEqual(hsl.l, 100, 0.5);
  approxEqual(hsl.s, 0, 0.5);
});

test("rgbToHsl: pure black is l=0", function () {
  var hsl = CM.rgbToHsl(0, 0, 0);
  approxEqual(hsl.l, 0, 0.5);
});

test("hslToRgb: h=120 s=100 l=50 is pure green", function () {
  var rgb = CM.hslToRgb(120, 100, 50);
  assert.deepStrictEqual(rgb, { r: 0, g: 255, b: 0 });
});

test("hslToRgb: h=240 s=100 l=50 is pure blue", function () {
  var rgb = CM.hslToRgb(240, 100, 50);
  assert.deepStrictEqual(rgb, { r: 0, g: 0, b: 255 });
});

test("rgb -> hsl -> rgb round trip is stable (within rounding) for 50 sampled colors", function () {
  for (var i = 0; i < 50; i++) {
    var r = (i * 41) % 256;
    var g = (i * 61) % 256;
    var b = (i * 97) % 256;
    var hsl = CM.rgbToHsl(r, g, b);
    var back = CM.hslToRgb(hsl.h, hsl.s, hsl.l);
    approxEqual(back.r, r, 2, "r channel for sample " + i);
    approxEqual(back.g, g, 2, "g channel for sample " + i);
    approxEqual(back.b, b, 2, "b channel for sample " + i);
  }
});

test("hslToRgb wraps hue outside 0-360", function () {
  assert.deepStrictEqual(CM.hslToRgb(480, 100, 50), CM.hslToRgb(120, 100, 50));
  assert.deepStrictEqual(CM.hslToRgb(-120, 100, 50), CM.hslToRgb(240, 100, 50));
});

// ---- parseColorString ---------------------------------------------------------

test("parseColorString parses rgb() and rgba()", function () {
  assert.deepStrictEqual(CM.parseColorString("rgb(10, 20, 30)"), { r: 10, g: 20, b: 30 });
  assert.deepStrictEqual(CM.parseColorString("rgba(10, 20, 30, 0.5)"), { r: 10, g: 20, b: 30 });
});

test("parseColorString parses hsl() into rgb", function () {
  assert.deepStrictEqual(CM.parseColorString("hsl(120, 100%, 50%)"), { r: 0, g: 255, b: 0 });
});

test("parseColorString falls back to hex", function () {
  assert.deepStrictEqual(CM.parseColorString("#336699"), { r: 51, g: 102, b: 153 });
});

test("parseColorString returns null for garbage", function () {
  assert.strictEqual(CM.parseColorString("not a color at all"), null);
});

// ---- WCAG contrast ---------------------------------------------------------

test("contrastRatio: black on white is 21:1", function () {
  var ratio = CM.contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
  approxEqual(ratio, 21, 0.02);
});

test("contrastRatio: identical colors is 1:1", function () {
  var ratio = CM.contrastRatio({ r: 100, g: 150, b: 200 }, { r: 100, g: 150, b: 200 });
  approxEqual(ratio, 1, 0.02);
});

test("contrastRatio is symmetric regardless of argument order", function () {
  var a = { r: 20, g: 40, b: 60 };
  var b = { r: 220, g: 210, b: 180 };
  assert.strictEqual(CM.contrastRatio(a, b), CM.contrastRatio(b, a));
});

test("contrastRatio: known pair #767676 on white is ~4.54:1 (WCAG spec example)", function () {
  var ratio = CM.contrastRatio(CM.hexToRgb("#767676"), CM.hexToRgb("#ffffff"));
  approxEqual(ratio, 4.54, 0.05);
});

test("contrastVerdict: 21:1 passes every threshold", function () {
  var v = CM.contrastVerdict(21);
  assert.strictEqual(v.aaNormal, true);
  assert.strictEqual(v.aaLarge, true);
  assert.strictEqual(v.aaaNormal, true);
  assert.strictEqual(v.aaaLarge, true);
});

test("contrastVerdict: 3.5:1 passes AA-large only, not AA-normal/AAA", function () {
  var v = CM.contrastVerdict(3.5);
  assert.strictEqual(v.aaLarge, true);
  assert.strictEqual(v.aaNormal, false);
  assert.strictEqual(v.aaaNormal, false);
  assert.strictEqual(v.aaaLarge, false);
});

test("contrastVerdict: 1:1 fails everything", function () {
  var v = CM.contrastVerdict(1);
  assert.strictEqual(v.aaNormal, false);
  assert.strictEqual(v.aaLarge, false);
  assert.strictEqual(v.aaaNormal, false);
  assert.strictEqual(v.aaaLarge, false);
});

// ---- Palette schemes ---------------------------------------------------------

test("paletteScheme: complementary is base hue + 180", function () {
  var out = CM.paletteScheme({ h: 10, s: 50, l: 50 }, "complementary");
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[1].h, 190);
});

test("paletteScheme: analogous is base hue -30/+30, includes base", function () {
  var out = CM.paletteScheme({ h: 200, s: 50, l: 50 }, "analogous");
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].h, 170);
  assert.strictEqual(out[1].h, 200);
  assert.strictEqual(out[2].h, 230);
});

test("paletteScheme: triadic is base hue + 120/+240, wraps correctly", function () {
  var out = CM.paletteScheme({ h: 300, s: 50, l: 50 }, "triadic");
  assert.strictEqual(out.length, 3);
  assert.strictEqual(out[0].h, 300);
  assert.strictEqual(out[1].h, 60); // 300 + 120 = 420 -> wraps to 60
  assert.strictEqual(out[2].h, 180); // 300 + 240 = 540 -> wraps to 180
});

test("rotateHue always returns a value in [0, 360)", function () {
  approxEqual(CM.rotateHue(350, 30), 20, 0.01);
  approxEqual(CM.rotateHue(10, -30), 340, 0.01);
});

// ---- summary ---------------------------------------------------------

console.log("");
console.log(passed + " passed, " + failures + " failed");
if (failures > 0) {
  process.exit(1);
}
