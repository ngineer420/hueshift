/*
 * The 148 CSS named colours, and the nearest one to any hex.
 *
 * Its own file on purpose: it is only needed by /color-name-finder/ and the
 * shades-of-<colour> pages, and inlining a 148-entry table into the shared bundle
 * would make every other page on the site pay for it.
 *
 * The list is the CSS Color Level 4 keyword set — the X11 list that came off
 * Unix workstations in the 1980s, plus rebeccapurple. That history is why it
 * is lopsided: nine greys in two spellings each, four kinds of slate, a
 * papayawhip, and a darkgray that is lighter than gray.
 *
 * Each entry also carries the hue families it belongs on, because hue alone
 * gets several of them wrong. Brown is not a spectral hue at all (it is dark
 * or desaturated orange), pink files as light red, and the slate greys have
 * enough blue in them to land under blue rather than grey. Where a colour
 * genuinely reads as two things — maroon as dark red and as brown, fuchsia as
 * pink and as purple — it is listed under both, because people search both.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.ColorNames = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // name, hex without the hash, space-separated families
  var RAW = [
  ["aliceblue", "f0f8ff", "blue"],
  ["antiquewhite", "faebd7", "orange brown"],
  ["aqua", "00ffff", "teal blue"],
  ["aquamarine", "7fffd4", "green"],
  ["azure", "f0ffff", "teal"],
  ["beige", "f5f5dc", "yellow"],
  ["bisque", "ffe4c4", "brown"],
  ["black", "000000", "grey"],
  ["blanchedalmond", "ffebcd", "orange brown"],
  ["blue", "0000ff", "blue"],
  ["blueviolet", "8a2be2", "purple"],
  ["brown", "a52a2a", "brown"],
  ["burlywood", "deb887", "brown"],
  ["cadetblue", "5f9ea0", "teal"],
  ["chartreuse", "7fff00", "green"],
  ["chocolate", "d2691e", "brown"],
  ["coral", "ff7f50", "orange red"],
  ["cornflowerblue", "6495ed", "blue"],
  ["cornsilk", "fff8dc", "yellow brown"],
  ["crimson", "dc143c", "red pink"],
  ["cyan", "00ffff", "teal blue"],
  ["darkblue", "00008b", "blue"],
  ["darkcyan", "008b8b", "teal blue"],
  ["darkgoldenrod", "b8860b", "brown"],
  ["darkgray", "a9a9a9", "grey"],
  ["darkgreen", "006400", "green"],
  ["darkgrey", "a9a9a9", "grey"],
  ["darkkhaki", "bdb76b", "yellow"],
  ["darkmagenta", "8b008b", "purple"],
  ["darkolivegreen", "556b2f", "green"],
  ["darkorange", "ff8c00", "orange"],
  ["darkorchid", "9932cc", "purple"],
  ["darkred", "8b0000", "red"],
  ["darksalmon", "e9967a", "orange"],
  ["darkseagreen", "8fbc8f", "green"],
  ["darkslateblue", "483d8b", "blue"],
  ["darkslategray", "2f4f4f", "grey teal"],
  ["darkslategrey", "2f4f4f", "grey teal"],
  ["darkturquoise", "00ced1", "teal"],
  ["darkviolet", "9400d3", "purple"],
  ["deeppink", "ff1493", "pink"],
  ["deepskyblue", "00bfff", "blue"],
  ["dimgray", "696969", "grey"],
  ["dimgrey", "696969", "grey"],
  ["dodgerblue", "1e90ff", "blue"],
  ["firebrick", "b22222", "red"],
  ["floralwhite", "fffaf0", "orange"],
  ["forestgreen", "228b22", "green"],
  ["fuchsia", "ff00ff", "purple pink"],
  ["gainsboro", "dcdcdc", "grey"],
  ["ghostwhite", "f8f8ff", "grey"],
  ["gold", "ffd700", "yellow orange"],
  ["goldenrod", "daa520", "orange"],
  ["gray", "808080", "grey"],
  ["green", "008000", "green"],
  ["greenyellow", "adff2f", "green"],
  ["grey", "808080", "grey"],
  ["honeydew", "f0fff0", "green"],
  ["hotpink", "ff69b4", "pink"],
  ["indianred", "cd5c5c", "red"],
  ["indigo", "4b0082", "purple blue"],
  ["ivory", "fffff0", "yellow"],
  ["khaki", "f0e68c", "yellow"],
  ["lavender", "e6e6fa", "blue purple"],
  ["lavenderblush", "fff0f5", "pink"],
  ["lawngreen", "7cfc00", "green"],
  ["lemonchiffon", "fffacd", "yellow"],
  ["lightblue", "add8e6", "blue teal"],
  ["lightcoral", "f08080", "red pink"],
  ["lightcyan", "e0ffff", "teal"],
  ["lightgoldenrodyellow", "fafad2", "yellow"],
  ["lightgray", "d3d3d3", "grey"],
  ["lightgreen", "90ee90", "green"],
  ["lightgrey", "d3d3d3", "grey"],
  ["lightpink", "ffb6c1", "pink red"],
  ["lightsalmon", "ffa07a", "orange"],
  ["lightseagreen", "20b2aa", "teal green"],
  ["lightskyblue", "87cefa", "blue"],
  ["lightslategray", "778899", "grey blue"],
  ["lightslategrey", "778899", "grey blue"],
  ["lightsteelblue", "b0c4de", "blue"],
  ["lightyellow", "ffffe0", "yellow"],
  ["lime", "00ff00", "green"],
  ["limegreen", "32cd32", "green"],
  ["linen", "faf0e6", "orange brown"],
  ["magenta", "ff00ff", "purple pink"],
  ["maroon", "800000", "brown red"],
  ["mediumaquamarine", "66cdaa", "green"],
  ["mediumblue", "0000cd", "blue"],
  ["mediumorchid", "ba55d3", "purple"],
  ["mediumpurple", "9370db", "purple"],
  ["mediumseagreen", "3cb371", "green"],
  ["mediumslateblue", "7b68ee", "blue purple"],
  ["mediumspringgreen", "00fa9a", "green"],
  ["mediumturquoise", "48d1cc", "teal"],
  ["mediumvioletred", "c71585", "pink purple"],
  ["midnightblue", "191970", "blue"],
  ["mintcream", "f5fffa", "green"],
  ["mistyrose", "ffe4e1", "pink red"],
  ["moccasin", "ffe4b5", "orange brown"],
  ["navajowhite", "ffdead", "brown"],
  ["navy", "000080", "blue"],
  ["oldlace", "fdf5e6", "orange"],
  ["olive", "808000", "yellow green"],
  ["olivedrab", "6b8e23", "green"],
  ["orange", "ffa500", "orange"],
  ["orangered", "ff4500", "orange red"],
  ["orchid", "da70d6", "purple pink"],
  ["palegoldenrod", "eee8aa", "yellow"],
  ["palegreen", "98fb98", "green"],
  ["paleturquoise", "afeeee", "teal"],
  ["palevioletred", "db7093", "pink red"],
  ["papayawhip", "ffefd5", "orange yellow"],
  ["peachpuff", "ffdab9", "orange brown"],
  ["peru", "cd853f", "brown"],
  ["pink", "ffc0cb", "pink red"],
  ["plum", "dda0dd", "purple pink"],
  ["powderblue", "b0e0e6", "teal blue"],
  ["purple", "800080", "purple"],
  ["rebeccapurple", "663399", "purple"],
  ["red", "ff0000", "red"],
  ["rosybrown", "bc8f8f", "brown"],
  ["royalblue", "4169e1", "blue"],
  ["saddlebrown", "8b4513", "brown"],
  ["salmon", "fa8072", "red orange"],
  ["sandybrown", "f4a460", "orange brown"],
  ["seagreen", "2e8b57", "green"],
  ["seashell", "fff5ee", "orange"],
  ["sienna", "a0522d", "brown"],
  ["silver", "c0c0c0", "grey"],
  ["skyblue", "87ceeb", "blue teal"],
  ["slateblue", "6a5acd", "blue purple"],
  ["slategray", "708090", "grey blue"],
  ["slategrey", "708090", "grey blue"],
  ["snow", "fffafa", "grey"],
  ["springgreen", "00ff7f", "green"],
  ["steelblue", "4682b4", "blue"],
  ["tan", "d2b48c", "brown"],
  ["teal", "008080", "teal"],
  ["thistle", "d8bfd8", "purple"],
  ["tomato", "ff6347", "red orange"],
  ["turquoise", "40e0d0", "teal green"],
  ["violet", "ee82ee", "purple pink"],
  ["wheat", "f5deb3", "brown"],
  ["white", "ffffff", "grey"],
  ["whitesmoke", "f5f5f5", "grey"],
  ["yellow", "ffff00", "yellow"],
  ["yellowgreen", "9acd32", "green"],
  ];

  var NAMES = RAW.map(function (row) {
    var hex = "#" + row[1];
    return {
      name: row[0],
      hex: hex,
      r: parseInt(row[1].slice(0, 2), 16),
      g: parseInt(row[1].slice(2, 4), 16),
      b: parseInt(row[1].slice(4, 6), 16),
      families: row[2].split(" "),
    };
  });

  /* ------------------------------- CIE Lab ------------------------------- */
  /*
   * Nearest-name lookup is done in Lab, not in RGB, and that choice is the
   * whole feature.
   *
   * Straight RGB distance treats a step of 20 as the same size everywhere,
   * which it is not: near black, 20 units of red is a visibly different
   * colour, while near white it is nothing at all. The usual symptom is the
   * one this has to get right — #0a0a0a comes back as "darkslategray" or
   * some other dark thing that happens to be close in raw numbers, rather
   * than as black, and every near-neutral answers with a tinted name.
   *
   * Lab is built so that equal numeric distance is roughly equal perceived
   * difference, so the grey axis behaves and near-blacks resolve to black.
   * The distance below is CIE76 (plain Euclidean in Lab). CIEDE2000 is more
   * accurate still, but for "which of 148 well-spaced names is this closest
   * to" the extra machinery does not change the answer, and a formula nobody
   * can check is worse than one that is obviously right.
   */

  var WHITE_X = 95.047, WHITE_Y = 100.0, WHITE_Z = 108.883; // D65, 2° observer

  function toLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function pivot(t) {
    return t > 0.008856 ? Math.cbrt(t) : (903.3 * t + 16) / 116;
  }

  /** {r,g,b} 0-255 -> {L,a,b} */
  function toLab(rgb) {
    var R = toLinear(rgb.r), G = toLinear(rgb.g), B = toLinear(rgb.b);
    var x = (R * 0.4124 + G * 0.3576 + B * 0.1805) * 100 / WHITE_X;
    var y = (R * 0.2126 + G * 0.7152 + B * 0.0722) * 100 / WHITE_Y;
    var z = (R * 0.0193 + G * 0.1192 + B * 0.9505) * 100 / WHITE_Z;
    var fx = pivot(x), fy = pivot(y), fz = pivot(z);
    return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
  }

  function deltaE(labA, labB) {
    var dL = labA.L - labB.L, da = labA.a - labB.a, db = labA.b - labB.b;
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  NAMES.forEach(function (n) {
    n.lab = toLab(n);
  });

  /**
   * The closest named colours to an {r,g,b}.
   *
   * Returns the whole shortlist rather than one answer, because "closest" is
   * often a photo finish between two names and showing the runner-up is more
   * honest than picking one. `exact` means the hex is that colour, not merely
   * near it. `distance` is a Lab delta: under about 2 is imperceptible, under
   * 10 is close, over 25 is a different colour wearing the nearest label.
   */
  function nearest(rgb, count) {
    var lab = toLab(rgb);
    var scored = NAMES.map(function (n) {
      return {
        name: n.name,
        hex: n.hex,
        r: n.r, g: n.g, b: n.b,
        families: n.families,
        distance: deltaE(lab, n.lab),
        exact: n.r === rgb.r && n.g === rgb.g && n.b === rgb.b,
      };
    });
    scored.sort(function (a, b) {
      // Ties happen for real: gray and grey are the same colour under two
      // names, as are aqua/cyan and fuchsia/magenta. Alphabetical order at
      // equal distance at least makes the answer stable.
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.name < b.name ? -1 : 1;
    });
    return scored.slice(0, count || 5);
  }

  /** Every named colour on a hue family's landing page, lightest first. */
  function byFamily(family) {
    return NAMES.filter(function (n) {
      return n.families.indexOf(family) !== -1;
    }).sort(function (a, b) {
      return toLab(b).L - toLab(a).L;
    });
  }

  var FAMILIES = ["red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "brown", "grey"];

  return {
    NAMES: NAMES,
    FAMILIES: FAMILIES,
    toLab: toLab,
    deltaE: deltaE,
    nearest: nearest,
    byFamily: byFamily,
  };
});
