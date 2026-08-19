#!/usr/bin/env node
/*
 * Generator for the colour-family landing pages and the two tools that feed
 * them. Zero dependencies — plain Node, no build tooling in the shipped site.
 *
 *     node tools/build_color_pages.mjs           # write everything
 *     node tools/build_color_pages.mjs --check   # fail if anything is stale
 *
 * What it writes, all under the repo root:
 *
 *     color-shades-generator/index.html + .html alias
 *     color-name-finder/index.html      + .html alias
 *     shades-of-<family>/index.html     + .html alias   (ten families)
 *     sitemap.xml
 *     the <ul class="tool-nav"> block in EVERY html file
 *     the marked homepage card block
 *
 * Why a generator in a repo that has never had one: the nav is hand-duplicated
 * into every page, and this change takes that from 28 copies to 52. Twenty-four
 * of those are new files that differ only in their swatch table. The nav was
 * already the thing most likely to drift; making it derived rather than copied
 * is the smaller risk.
 *
 * The swatch tables are computed here, at build time, from the site's own
 * color-math.js and color-names.js. That matters for the contrast column: the
 * figures on these pages come from the same contrastRatio() the contrast
 * checker uses, including its 2-decimal rounding, so the two tools cannot
 * disagree about the same pair of colours.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { dirname, join, relative, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = dirname(HERE)
const CM = require(join(ROOT, "assets/color-math.js"))
const CN = require(join(ROOT, "assets/color-names.js"))
const { COPY } = require(join(HERE, "shades_copy.cjs"))

const SITE = "https://gamutlens.com"
const TODAY = "2026-08-11"
const check = process.argv.includes("--check")

/* ------------------------------------------------------------------ chrome */

// `panel` is the homepage panel a link switches to. The two new tools have no
// homepage panel — the name finder in particular must not load its 148-entry
// table on a page that will never open it — so they carry no data-panel-link
// and navigate normally. A data-panel-link pointing at a panel that does not
// exist is worse than none: initPanelSwitching intercepts the click, finds
// nothing, and quietly shows the overview instead, so the link looks dead.
// The portfolio toolbar's tier-1 list (ngineer420.github.io#13, with the
// errata). "Home" is gone from it: the wordmark is the home link, and the spec
// does not spend a rail or sheet slot on it. Order is rail order, and the rail
// is capped at eight — which is exactly what this site has.
//   href, rail chip (<= 18 chars), sheet anchor text, homepage panel
const NAV = [
  ["/color-picker/", "Picker", "Color Picker", "color-picker"],
  ["/color-converter/", "Converter", "Color Converter", "color-converter"],
  ["/gradient-generator/", "Gradient", "Gradient Generator", "gradient-generator"],
  ["/color-palette-generator/", "Palette", "Color Palette Generator", "color-palette-generator"],
  ["/contrast-checker/", "Contrast", "Contrast Checker", "contrast-checker"],
  ["/color-shades-generator/", "Shades", "Color Shades Generator", null],
  ["/color-name-finder/", "Color Names", "Color Name Finder", null],
  ["/image-color-extractor/", "From Image", "Image Color Extractor", "image-color-extractor"],
]

const FAMILIES = [
  { key: "blue", name: "Blue", base: "#1e90ff" },
  { key: "green", name: "Green", base: "#228b22" },
  { key: "pink", name: "Pink", base: "#ff69b4" },
  { key: "purple", name: "Purple", base: "#800080" },
  { key: "red", name: "Red", base: "#e01b24" },
  { key: "orange", name: "Orange", base: "#ffa500" },
  { key: "yellow", name: "Yellow", base: "#f2c200" },
  { key: "brown", name: "Brown", base: "#8b4513" },
  { key: "grey", name: "Grey", base: "#808080" },
  { key: "teal", name: "Teal", base: "#008080" },
]

const ADSENSE =
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7560786263587509" crossorigin="anonymous"></script>'
const ERABBIT =
  '<a href="https://erabb.it" class="erabbit-mark" aria-label="erabb.it"><img src="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>\u{1F407}</text></svg>" width="10" height="10" alt=""></a>'
const NO_FLASH =
  '<script>(function(){try{var r=document.documentElement;var t=localStorage.getItem("hueshift-theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}r.setAttribute("data-theme",t);var a=localStorage.getItem("hueshift-accent");if(a&&/^#[0-9a-fA-F]{6}$/.test(a)){r.style.setProperty("--accent",a);var h=parseInt(a.slice(1,3),16),g=parseInt(a.slice(3,5),16),b=parseInt(a.slice(5,7),16);r.style.setProperty("--accent-rgb",h+", "+g+", "+b);}}catch(e){}})();</script>'

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const j = s => JSON.stringify(s)

/* The shades-of-* pages are tier 2: the shades generator with a family baked
   in. They never appear in the rail or the sheet body — they get one hub link
   at the bottom of the sheet, plus real <a href> sibling chips inside the
   generator's own control panel, where a family is a parameter and not a peer
   of the other seven tools. */
const SHADES_PARENT = "/color-shades-generator/"
const SHADES_VARIANTS = [
  [SHADES_PARENT, "Any color"],
  ...FAMILIES.map(f => [`/shades-of-${f.key}/`, f.name]),
]
const OWNED = new Set(SHADES_VARIANTS.slice(1).map(([href]) => href))

/* aria-current="page" is reserved for a link that really points at the page
   being rendered. The generator whose tier-2 variant is the current page gets
   aria-current="true" — "the current item in this set" — which is what stops
   the rail rendering unselected on all ten shades pages without announcing a
   link to somewhere else as the current page. */
function currentMark(href, current) {
  if (href === current) return ' aria-current="page"'
  if (href === SHADES_PARENT && OWNED.has(current)) return ' aria-current="true"'
  return ""
}

function toolbar(current) {
  const rail = NAV.map(([href, label, , slug]) => {
    const panel = slug === null ? "" : ` data-panel-link="${slug}"`
    return `      <li><a href="${href}"${panel}${currentMark(href, current)}>${label}</a></li>`
  }).join("\n")
  // Flat, not grouped: eight destinations is where group headings become noise,
  // and the spec renders flat at eight or fewer however the per-site issue
  // sketched it.
  const sheet = NAV.map(([href, , long, slug]) => {
    const panel = slug === null ? "" : ` data-panel-link="${slug}"`
    return `        <li><a href="${href}"${panel}${currentMark(href, current)}>${long}</a></li>`
  }).join("\n")
  return `  <nav class="toolbar" aria-label="Tools">
    <details class="tb-menu">
      <summary class="tb-trigger" aria-label="All ${NAV.length} tools">
        <span class="tb-glyph" aria-hidden="true">&#9636;</span>
        <span class="tb-label">All ${NAV.length}<span class="tb-label-long"> tools</span></span>
      </summary>
      <div class="tb-sheet is-flat">
        <ul>
${sheet}
        </ul>
        <p class="tb-hub"><a href="${SHADES_PARENT}"${OWNED.has(current) ? ' aria-current="true"' : ""}>All ${FAMILIES.length} shades pages &rarr;</a></p>
      </div>
    </details>
    <div class="tb-scrim"></div>
    <ul class="tb-rail">
${rail}
    </ul>
  </nav>`
}

/* The tier-2 switcher, rendered into the shades generator's own workspace and
   into every shades-of-* page. Real links with real hrefs: these pages differ
   by more than a preset, so nothing intercepts the click. */
function shadesChips(current) {
  const items = SHADES_VARIANTS.map(([href, label]) =>
    `        <li><a class="chip-link" href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a></li>`
  ).join("\n")
  return `      <nav class="chip-row" aria-label="Color family">
        <span class="chip-row-label" id="family-chips-label">Family</span>
        <ul aria-labelledby="family-chips-label">
${items}
        </ul>
      </nav>`
}

function head({ title, description, canonical, jsonLd }) {
  return `<!doctype html>
<html lang="en">
<head>
  ${NO_FLASH}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="#121017">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="gamutlens.com">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(description)}">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/style.css">
  <script type="application/ld+json">${jsonLd}</script>
  ${ADSENSE}
</head>`
}

/* Brand and one icon button, nothing else — no links, and not sticky, because
   sticky chrome can overlay an AdSense anchor unit. The five-swatch accent rail
   moved to the footer: it was what kept the closed mobile header at 121px while
   showing zero navigation, and at 320px it wrapped the header to a third row. */
function header(current) {
  return `<body>
  <a class="skip-link" href="#main">Skip to the tools</a>
  <header class="site-header">
    <div class="wrap">
      <a href="/" class="wordmark" data-panel-link="">gamutlens</a>
      <div class="header-controls">
        <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Toggle light and dark theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>
      </div>
    </div>
  </header>
<!-- nav:start -->
${toolbar(current)}
<!-- nav:end -->`
}

const FOOTER_RAIL =
  '      <div class="swatch-rail" data-rail aria-label="Site accent color"><span class="rail-label">Site accent</span></div>'

const FOOTER = `  <footer class="site-footer">
    <div class="wrap">
${FOOTER_RAIL}
      <p class="footer-tag">gamutlens.com — browser-only color tools. Nothing you type or upload ever leaves this tab.</p>
      <ul class="footer-links">
        <li><a href="/articles/">Articles</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
      </ul>
    </div>
  </footer>
${ERABBIT}`

const SCRIPTS_PLAIN = `  <script src="/assets/color-math.js"></script>
  <script src="/assets/app.js"></script>
</body>
</html>
`

// color-names.js loads only on the two pages that need it, so the other
// twenty-eight do not pay for a 148-entry table they never read.
const SCRIPTS_NAMED = `  <script src="/assets/color-math.js"></script>
  <script src="/assets/color-names.js"></script>
  <script src="/assets/app.js"></script>
</body>
</html>
`

function faqJsonLd(faq) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({
      "@type": "Question", name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  })
}

function faqBlock(faq) {
  return `    <section class="content-section">
      <div class="wrap">
        <h2>FAQ</h2>
        <dl class="faq">
${faq.map(([q, a]) => `        <dt>${esc(q)}</dt>\n        <dd>${esc(a)}</dd>`).join("\n")}
        </dl>
      </div>
    </section>`
}

/* ------------------------------------------------------- swatch computation */

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }

function contrastCell(rgb) {
  // Same function, same rounding, as the contrast checker on this site: a
  // figure printed here has to survive being pasted into that tool.
  const ratio = CM.contrastRatio(rgb, WHITE)
  const verdict = CM.contrastVerdict(ratio)
  const label = verdict.aaaNormal ? "AAA" : verdict.aaNormal ? "AA" : verdict.aaLarge ? "AA large" : "fails"
  return { ratio, label, pass: verdict.aaNormal }
}

function swatchTable(family) {
  const rows = CN.byFamily(family).map(c => {
    const { ratio, label } = contrastCell(c)
    return `            <tr>
              <td><span class="swatch-dot" style="background:${c.hex}"></span>${c.name}</td>
              <td class="mono">${c.hex}</td>
              <td class="mono">${CM.formatRgb(c.r, c.g, c.b)}</td>
              <td class="mono">${ratio.toFixed(2)}:1</td>
              <td><span class="wcag-tag${label === "fails" ? " is-fail" : ""}">${label}</span></td>
            </tr>`
  })
  return { html: rows.join("\n"), count: rows.length }
}

/* A tone removes saturation, and a colour with none to remove has no tones:
   the operation is a no-op and six identical swatches labelled 14% to 86%
   would be a lie told six times. Grey is the case that proves the point. */
function tonesBlock(base, tones) {
  if (CM.rgbToHsl(base.r, base.g, base.b).s >= 2) {
    return `        <div class="shade-strip">\n${staticStrip(tones, e => e.amount + "%")}\n        </div>`
  }
  return `        <p class="strip-note">There are none. A tone is saturation taken out of a colour, and this base has no saturation in it to take — every step lands back on the colour it started from. Tones only mean something once there is some chroma to remove, which is exactly why a grey ramp is built from lightness alone.</p>`
}

function staticStrip(entries, labeller) {
  return entries.map(e => {
    const hex = e.hex || CM.rgbToHex(e.rgb.r, e.rgb.g, e.rgb.b)
    const rgb = e.rgb || CM.hexToRgb(hex)
    const dark = CM.perceptualLightness(rgb) > 55
    return `          <div class="shade-chip is-static"><span class="shade-swatch" style="background:${hex}"></span><span class="shade-meta"><b>${labeller(e)}</b><span>${hex}</span></span></div>`
  }).join("\n")
}

/* ------------------------------------------------------------ the tool pages */

function shadesGeneratorPage() {
  const canonical = SITE + "/color-shades-generator/"
  const description = "Generate 10 tints, 10 shades and 10 tones from any color, plus a perceptual 50-950 scale. Copy as HEX, CSS custom properties, or the whole ramp."
  const faq = [
    ["What is the difference between a tint, a shade and a tone?",
     "A tint is the color mixed toward white, a shade is the same color mixed toward black, and a tone is mixed toward grey — the lightness stays where it is and the saturation comes down. The third one is the one people skip, which is why muted palettes so often come out merely dark."],
    ["Why is the 50-950 scale not evenly spaced in lightness?",
     "Because HSL lightness is not perceptual. Splitting it evenly puts almost all the visible difference in the dark half and leaves 50, 100 and 200 looking like the same color. Each step here targets a CIE L* value instead, solved for by search, so the steps look evenly spaced rather than merely measuring evenly."],
    ["Can I paste this straight into Tailwind or a CSS file?",
     "Yes. The CSS box gives you custom properties named --color-50 through --color-950, and the scale box gives the same values as plain step-and-hex pairs for a config file. Both are the same numbers as the swatches above them."],
    ["Does the base color have to be a hex?",
     "The hex field takes three or six digits with or without the hash, and the color well beside it opens your system picker. Whatever you set is reflected in the link at the bottom, so a palette you like is a URL you can send."],
  ]
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebApplication",
    name: "Color Shades Generator — gamutlens.com", url: canonical,
    applicationCategory: "DesignApplication", operatingSystem: "Any (runs in browser)",
    description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "gamutlens.com" },
  })

  const body = `${header("/color-shades-generator/")}
  <main id="main">
    <section class="panel">
      <div class="wrap">
        <div class="panel-head">
          <h1 tabindex="-1">Color Shades Generator</h1>
          <a class="back-to-tools" href="/" data-panel-link="">← All tools</a>
        </div>
        <p>Ten tints, ten shades and ten tones from a single base color, plus the 50-950 scale people actually paste into a config. Tints mix toward white, shades toward black, and tones toward grey at the same lightness — three different operations that get used as though they were one.</p>
        <div class="workspace">
${shadesChips(SHADES_PARENT)}

    <div class="controls-grid">
      <div class="field">
        <label for="cs-color">Base color</label>
        <input type="color" id="cs-color" value="#4682b4">
      </div>
      <div class="field">
        <label for="cs-hex">HEX</label>
        <input type="text" id="cs-hex" value="#4682b4" spellcheck="false" autocomplete="off">
      </div>
    </div>

    <h2 class="strip-title">Tints <span>mixed toward white</span></h2>
    <div class="shade-strip" id="cs-tints"></div>

    <h2 class="strip-title">Shades <span>mixed toward black</span></h2>
    <div class="shade-strip" id="cs-shades"></div>

    <h2 class="strip-title">Tones <span>mixed toward grey, same lightness</span></h2>
    <div class="shade-strip" id="cs-tones"></div>

    <h2 class="strip-title">50-950 scale <span>even steps in perceptual lightness</span></h2>
    <div class="shade-strip" id="cs-ramp"></div>

    <div class="copy-row">
      <span class="label">HEX list</span>
      <input type="text" class="value" id="cs-out-hex" readonly aria-label="All tints and shades as a HEX list">
      <button type="button" class="copy-btn" data-copy-target="cs-out-hex">Copy</button>
    </div>
    <div class="copy-block">
      <div class="copy-block-head"><span class="label">CSS custom properties</span><button type="button" class="copy-btn" data-copy-target="cs-out-vars">Copy</button></div>
      <textarea id="cs-out-vars" rows="11" readonly aria-label="The scale as CSS custom properties"></textarea>
    </div>
    <div class="copy-block">
      <div class="copy-block-head"><span class="label">50-950 scale</span><button type="button" class="copy-btn" data-copy-target="cs-out-ramp">Copy</button></div>
      <textarea id="cs-out-ramp" rows="11" readonly aria-label="The scale as step and hex pairs"></textarea>
    </div>
    <div class="copy-row share-row">
      <span class="label">Link</span>
      <input type="text" class="value share-url" id="cs-share-url" readonly aria-label="Shareable link to this palette">
      <button type="button" class="copy-btn" data-copy-target="cs-share-url">Copy link</button>
    </div>
        </div>
      </div>
    </section>

    <section class="content-section" id="how-it-works">
      <div class="wrap">
        <h2>How to use the Shades Generator</h2>
        <div class="how-to">
          <ol>
        <li>Set a base color with the color well or by typing a hex value.</li>
        <li>Read off the three strips: tints above the base, shades below it, tones beside it. Clicking any swatch copies its hex.</li>
        <li>Take the 50-950 scale if you need a full ramp — the numbers are the ones a design system expects, and the steps are spaced by perceived lightness rather than by raw HSL.</li>
        <li>Copy the whole thing as a hex list, as CSS custom properties, or as step-and-hex pairs, and send the link if someone else needs the same palette.</li>
          </ol>
        </div>
      </div>
    </section>

${faqBlock(faq)}

    <section class="content-section">
      <div class="wrap">
        <h2>Shades by color family</h2>
        <div class="related-links">
${FAMILIES.map(f => `        <a href="/shades-of-${f.key}/">Shades of ${f.name.toLowerCase()} →</a>`).join("\n")}
        </div>
        <div class="related-links" style="margin-top:12px">
        <a href="/color-name-finder/">Color Name Finder →</a>
        <a href="/color-palette-generator/">Palette Generator →</a>
        <a href="/contrast-checker/">Contrast Checker →</a>
        </div>
      </div>
    </section>
  </main>
${FOOTER}
  <script type="application/ld+json">${faqJsonLd(faq)}</script>
${SCRIPTS_PLAIN}`

  return head({ title: "Color Shades Generator — Tints, Shades, Tones | gamutlens.com", description, canonical, jsonLd }) + "\n" + body
}

function nameFinderPage() {
  const canonical = SITE + "/color-name-finder/"
  const description = "Find the nearest CSS color name to any hex. Matched in CIE Lab rather than raw RGB, so greys and near-blacks come back with sensible answers."
  const faq = [
    ["How is the nearest name decided?",
     "By distance in CIE Lab, not in RGB. Lab is built so that equal numeric distance is roughly equal perceived difference, which is what makes the answer trustworthy at the ends of the range: a near-black comes back as black rather than as whichever dark name happens to be close in raw channel numbers."],
    ["Why not just compare red, green and blue values?",
     "Because a step of 20 in RGB is a big visible change near black and almost nothing near white, so plain RGB distance systematically mislabels dark colors and near-neutrals. It is the classic failure of this feature, and it is the reason this one converts first."],
    ["What does the delta number mean?",
     "It is the Lab distance between your color and the named one. Below about 2 is a difference an eye cannot separate; below 10 is close enough to use the name in conversation; above 25 you are being handed the nearest label rather than a match, and the page says so."],
    ["Which list of names is this?",
     "The 148 CSS Color Level 4 keywords — the X11 list from 1980s Unix workstations, plus rebeccapurple. It is the set every browser understands, which is also why it is so uneven: nine greys in two spellings each, four slates, and a papayawhip."],
  ]
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebApplication",
    name: "Color Name Finder — gamutlens.com", url: canonical,
    applicationCategory: "DesignApplication", operatingSystem: "Any (runs in browser)",
    description, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "gamutlens.com" },
  })

  const body = `${header("/color-name-finder/")}
  <main id="main">
    <section class="panel">
      <div class="wrap">
        <div class="panel-head">
          <h1 tabindex="-1">Color Name Finder</h1>
          <a class="back-to-tools" href="/" data-panel-link="">← All tools</a>
        </div>
        <p>Paste a hex and get the CSS color name closest to it, with the runners-up and how close each one really is. Matching happens in CIE Lab rather than raw RGB, which is the difference between #0a0a0a coming back as black and coming back as whichever dark name happens to sit nearby in channel numbers.</p>
        <div class="workspace">

    <div class="controls-grid">
      <div class="field">
        <label for="cn-color">Color</label>
        <input type="color" id="cn-color" value="#4682b4">
      </div>
      <div class="field">
        <label for="cn-hex">HEX</label>
        <input type="text" id="cn-hex" value="#4682b4" spellcheck="false" autocomplete="off">
      </div>
    </div>

    <div class="name-result" id="cn-result"></div>
    <h2 class="strip-title">Also close</h2>
    <ul class="name-list" id="cn-list"></ul>

    <div class="copy-row share-row">
      <span class="label">Link</span>
      <input type="text" class="value share-url" id="cn-share-url" readonly aria-label="Shareable link to this color">
      <button type="button" class="copy-btn" data-copy-target="cn-share-url">Copy link</button>
    </div>
        </div>
      </div>
    </section>

    <section class="content-section" id="how-it-works">
      <div class="wrap">
        <h2>How to use the Color Name Finder</h2>
        <div class="how-to">
          <ol>
        <li>Type or paste a hex value, or open the color well and pick one.</li>
        <li>Read the headline match — it says whether the hex is exactly that color, visually identical to it, close to it, or merely nearer to it than to anything else.</li>
        <li>Check the runners-up. Ties are common, and two names sometimes describe the same color: gray and grey, aqua and cyan, fuchsia and magenta.</li>
        <li>Use the contrast figures to decide whether the name you landed on is usable as text on white or on black.</li>
          </ol>
        </div>
      </div>
    </section>

${faqBlock(faq)}

    <section class="content-section">
      <div class="wrap">
        <h2>Related tools</h2>
        <div class="related-links">
        <a href="/color-shades-generator/">Shades Generator →</a>
        <a href="/color-converter/">Color Converter →</a>
        <a href="/contrast-checker/">Contrast Checker →</a>
        </div>
      </div>
    </section>
  </main>
${FOOTER}
  <script type="application/ld+json">${faqJsonLd(faq)}</script>
${SCRIPTS_NAMED}`

  return head({ title: "Color Name Finder — What Color Is This Hex? | gamutlens.com", description, canonical, jsonLd }) + "\n" + body
}

/* ---------------------------------------------------- the family landing pages */

function familyPage(family) {
  const copy = COPY[family.key]
  if (!copy) throw new Error("no copy for family " + family.key)
  const canonical = `${SITE}/shades-of-${family.key}/`
  const base = CM.hexToRgb(family.base)
  const table = swatchTable(family.key)
  const tints = CM.tints(base, 6)
  const shades = CM.shades(base, 6)
  const tones = CM.tones(base, 6)
  const ramp = CM.rampScale(base)
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org", "@type": "WebPage",
    name: `Shades of ${family.name} — gamutlens.com`, url: canonical, description: copy.description,
  })

  const body = `${header(canonical.replace(SITE, ""))}
  <main id="main">
    <section class="panel">
      <div class="wrap">
        <div class="panel-head">
          <h1 tabindex="-1">Shades of ${family.name}</h1>
          <a class="back-to-tools" href="/color-shades-generator/">← Shades generator</a>
        </div>
        <p class="page-tagline">${esc(copy.tagline)}</p>
${shadesChips(canonical.replace(SITE, ""))}
        <p>${esc(copy.intro)}</p>
        <p>${esc(copy.second)}</p>
      </div>
    </section>

    <section class="content-section">
      <div class="wrap">
        <h2>Every CSS ${family.name.toLowerCase()} name, with its contrast on white</h2>
        <p>The ${table.count} named colors in the CSS keyword list that belong to this family, lightest first. The last two columns are the WCAG 2 contrast ratio against white and what that ratio passes for normal text — computed with the same function as the site's <a href="/contrast-checker/">contrast checker</a>, so the two never disagree.</p>
        <div class="data-table">
          <table>
            <thead>
              <tr><th scope="col">Name</th><th scope="col">HEX</th><th scope="col">RGB</th><th scope="col">On white</th><th scope="col">WCAG</th></tr>
            </thead>
            <tbody>
${table.html}
            </tbody>
          </table>
        </div>
        <p class="table-note">${esc(copy.naming)}</p>
      </div>
    </section>

    <section class="content-section">
      <div class="wrap">
        <h2>Tints, shades and tones of ${esc(family.base)}</h2>
        <p>Built from one base color three different ways. Tints mix it toward white, shades toward black, and tones toward grey at the same lightness — which is why the tone row goes quiet rather than dark.</p>
        <h3>Tints</h3>
        <div class="shade-strip">
${staticStrip(tints, e => e.amount + "%")}
        </div>
        <h3>Shades</h3>
        <div class="shade-strip">
${staticStrip(shades, e => e.amount + "%")}
        </div>
        <h3>Tones</h3>
${tonesBlock(base, tones)}
        <h3>The 50-950 scale</h3>
        <div class="shade-strip">
${staticStrip(ramp, e => String(e.step))}
        </div>
        <p><a class="cta-link" href="/color-shades-generator/?hex=${family.base.slice(1)}">Open this ${family.name.toLowerCase()} in the shades generator →</a></p>
      </div>
    </section>

    <section class="content-section">
      <div class="wrap">
        <h2>Using ${family.name.toLowerCase()} in an interface</h2>
        <p>${esc(copy.usage)}</p>
      </div>
    </section>

${faqBlock(copy.faq)}

    <section class="content-section">
      <div class="wrap">
        <h2>Other color families</h2>
        <div class="related-links">
${FAMILIES.filter(f => f.key !== family.key).map(f => `        <a href="/shades-of-${f.key}/">Shades of ${f.name.toLowerCase()} →</a>`).join("\n")}
        </div>
        <div class="related-links" style="margin-top:12px">
        <a href="/color-shades-generator/">Shades Generator →</a>
        <a href="/color-name-finder/">Color Name Finder →</a>
        </div>
      </div>
    </section>
  </main>
${FOOTER}
  <script type="application/ld+json">${faqJsonLd(copy.faq)}</script>
${SCRIPTS_PLAIN}`

  return head({ title: `${copy.title} | gamutlens.com`, description: copy.description, canonical, jsonLd }) + "\n" + body
}

/* -------------------------------------------------------------------- output */

const stale = []

function write(rel, content) {
  const full = join(ROOT, rel)
  if (check) {
    let current = null
    try { current = readFileSync(full, "utf8") } catch {}
    if (current !== content) stale.push(rel)
    return
  }
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, content)
}

function writeBoth(slug, content) {
  // Both URL forms, byte-identical, because every asset link is absolute —
  // the pattern every existing page on this site already follows.
  write(`${slug}/index.html`, content)
  write(`${slug}.html`, content)
}

function allHtmlFiles(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === ".worktrees" || entry === "node_modules" || entry === "tools") continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) allHtmlFiles(full, out)
    else if (entry.endsWith(".html")) out.push(full)
  }
  return out
}

const GENERATED = new Set([
  ...FAMILIES.flatMap(f => [`shades-of-${f.key}/index.html`, `shades-of-${f.key}.html`]),
  "color-shades-generator/index.html", "color-shades-generator.html",
  "color-name-finder/index.html", "color-name-finder.html",
])

/** Rewrite the whole chrome — header plus toolbar — in a hand-written page.
 *
 * The span runs from `<header class="site-header">` to `<!-- nav:end -->`, or
 * on the first run, before those markers exist, to the end of `</header>`. That
 * makes the migration off the old in-header `<ul class="tool-nav">` and every
 * later sweep the same operation, so there is no one-shot mode to get wrong.
 *
 * The page's own URL is recovered from its path rather than from the markup it
 * is about to lose: `/x/index.html` and `/x.html` are the same destination, so
 * both members of every twin pair are stamped from one list.
 */
function pageUrl(file) {
  let rel = "/" + relative(ROOT, file).split(sep).join("/")
  if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length)
  else if (rel.endsWith(".html")) rel = rel.slice(0, -".html".length) + "/"
  return rel === "//" ? "/" : rel
}

function syncChrome(file) {
  const rel = relative(ROOT, file)
  if (GENERATED.has(rel)) return
  const src = readFileSync(file, "utf8")
  const tag = src.indexOf('<header class="site-header">')
  if (tag === -1) return
  // From the start of the line, so the block's own indent is the only one.
  const open = src.lastIndexOf("\n", tag) + 1
  const END = "<!-- nav:end -->"
  const marked = src.indexOf(END, open)
  const close = marked !== -1
    ? marked + END.length
    : src.indexOf("</header>", open) + "</header>".length
  // header() opens the <body> tag and the skip link; here only the chrome
  // below it is being replaced, so both are trimmed back off.
  const block = header(pageUrl(file))
    .replace(/^<body>\n(  <a class="skip-link"[^\n]*\n)?/, "")
  let updated = src.slice(0, open) + block + src.slice(close)
  if (!/<a class="skip-link"/.test(updated)) {
    updated = updated.replace("<body>\n", '<body>\n  <a class="skip-link" href="#main">Skip to the tools</a>\n')
  }
  // ...which needs a #main to skip to. The hand-written pages never had one.
  if (!/<main[^>]*\bid="main"/.test(updated)) {
    updated = updated.replace(/<main(\s|>)/, '<main id="main"$1')
  }
  // The accent rail came out of the header row — it was what kept the closed
  // mobile header at 121px while showing zero navigation. It belongs on every
  // page, so hand-written footers get it too. Idempotent: only if absent.
  const foot = updated.indexOf('<footer class="site-footer">')
  if (foot !== -1 && !/swatch-rail[^>]*data-rail/.test(updated.slice(foot))) {
    updated = updated.slice(0, foot) +
      updated.slice(foot).replace('      <p class="footer-tag">', FOOTER_RAIL + '\n      <p class="footer-tag">')
  }
  if (check) {
    if (updated !== src) stale.push(rel + " (chrome)")
    return
  }
  if (updated !== src) writeFileSync(file, updated)
}

const CARD_BEGIN = "<!-- BEGIN generated tool cards (tools/build_color_pages.mjs) -->"
const CARD_END = "<!-- END generated tool cards -->"
const FAM_BEGIN = "<!-- BEGIN generated family links (tools/build_color_pages.mjs) -->"
const FAM_END = "<!-- END generated family links -->"

function homepageCards() {
  const cards = [
    ["/color-shades-generator/",
     '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
     "Color Shades Generator", "Tints, shades, tones and a 50-950 ramp."],
    ["/color-name-finder/",
     '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/>',
     "Color Name Finder", "What is this hex actually called?"],
  ]
  return cards.map(([href, icon, name, tagline]) =>
    `          <a class="tool-card" href="${href}">
            <span class="chip" style="background:color-mix(in srgb, var(--accent) 18%, transparent); color:var(--accent)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span>
            <h3>${name}</h3>
            <p>${tagline}</p>
          </a>`
  ).join("\n")
}

function homepageFamilyLinks() {
  return `        <nav class="family-links" aria-label="Color families">
          <span class="family-links-label">Shades by family</span>
${FAMILIES.map(f => `          <a href="/shades-of-${f.key}/">${f.name}</a>`).join("\n")}
        </nav>`
}

function splice(file, begin, end, block, label) {
  const src = readFileSync(file, "utf8")
  const a = src.indexOf(begin)
  const b = src.indexOf(end)
  if (a === -1 || b === -1) throw new Error(`${relative(ROOT, file)} is missing the ${label} markers`)
  const updated = src.slice(0, a) + begin + "\n" + block + "\n" + src.slice(b)
  if (check) {
    if (updated !== src) stale.push(relative(ROOT, file) + ` (${label})`)
    return
  }
  if (updated !== src) writeFileSync(file, updated)
}

function syncHomepage() {
  const file = join(ROOT, "index.html")
  splice(file, CARD_BEGIN, CARD_END, homepageCards(), "tool cards")
  splice(file, FAM_BEGIN, FAM_END, homepageFamilyLinks(), "family links")
}

function sitemap() {
  const urls = [
    "/", "/color-picker/", "/color-converter/", "/gradient-generator/",
    "/color-palette-generator/", "/contrast-checker/", "/image-color-extractor/",
    "/color-shades-generator/", "/color-name-finder/",
    ...FAMILIES.map(f => `/shades-of-${f.key}/`),
    "/privacy/", "/terms/", "/articles/",
    "/articles/hex-rgb-hsl-which-color-format-to-use/",
    "/articles/how-wcag-contrast-ratios-work/",
    "/articles/color-harmony-complementary-analogous-triadic/",
    "/articles/why-gradients-go-grey-in-the-middle/",
  ]
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => `  <url><loc>${SITE}${u}</loc><lastmod>${TODAY}</lastmod></url>`).join("\n") +
    "\n</urlset>\n"
  )
}

/* ------------------------------------------------------------- sanity checks */
/* The maths these pages publish, asserted before they are written. A wrong
   contrast figure or a "tone" that is really a shade is not a bug anyone will
   notice by looking at the page. */

function assertMath() {
  const problems = []
  const ok = (cond, msg) => { if (!cond) problems.push(msg) }
  for (const family of FAMILIES) {
    const base = CM.hexToRgb(family.base)
    const L = rgb => CM.perceptualLightness(rgb)
    const S = rgb => CM.rgbToHsl(rgb.r, rgb.g, rgb.b).s
    const baseHsl = CM.rgbToHsl(base.r, base.g, base.b)
    CM.tints(base).forEach((t, i, a) => {
      ok(L(t.rgb) > L(base), `${family.key}: tint ${i} is not lighter than the base`)
      if (i) ok(L(t.rgb) > L(a[i - 1].rgb), `${family.key}: tints are not monotonic`)
    })
    CM.shades(base).forEach((s, i, a) => {
      ok(L(s.rgb) < L(base), `${family.key}: shade ${i} is not darker than the base`)
      if (i) ok(L(s.rgb) < L(a[i - 1].rgb), `${family.key}: shades are not monotonic`)
    })
    CM.tones(base).forEach((t, i) => {
      ok(S(t.rgb) < baseHsl.s + 0.01, `${family.key}: tone ${i} did not reduce saturation`)
      const l = CM.rgbToHsl(t.rgb.r, t.rgb.g, t.rgb.b).l
      ok(Math.abs(l - baseHsl.l) < 2, `${family.key}: tone ${i} moved the lightness (${l} vs ${baseHsl.l})`)
    })
    const toneHexes = CM.tones(base).map(t => CM.rgbToHex(t.rgb.r, t.rgb.g, t.rgb.b)).join()
    const shadeHexes = CM.shades(base).map(t => CM.rgbToHex(t.rgb.r, t.rgb.g, t.rgb.b)).join()
    ok(toneHexes !== shadeHexes, `${family.key}: tones are just relabelled shades`)
    const ramp = CM.rampScale(base)
    ramp.forEach((r, i, a) => {
      if (i) ok(r.lightness < a[i - 1].lightness, `${family.key}: ramp is not monotonic at ${r.step}`)
      const target = CM.RAMP_TARGETS[i].L
      ok(Math.abs(r.lightness - target) < 1.5, `${family.key}: ramp ${r.step} is L* ${r.lightness}, wanted ${target}`)
    })
    ok(CN.byFamily(family.key).length >= 8, `${family.key}: only ${CN.byFamily(family.key).length} named colors`)
  }
  // The name lookup's known failure mode, asserted rather than hoped for.
  const near = hex => CN.nearest(CM.hexToRgb(hex), 1)[0].name
  ok(near("#0a0a0a") === "black", "near-black should resolve to black, got " + near("#0a0a0a"))
  ok(near("#010203") === "black", "near-black should resolve to black, got " + near("#010203"))
  ok(["gray", "grey"].includes(near("#808080")), "#808080 should be gray")
  ok(near("#c0c0c0") === "silver", "#c0c0c0 should be silver")
  ok(near("#4682b4") === "steelblue", "#4682b4 should be steelblue")
  ok(CN.NAMES.length === 148, "expected 148 CSS names, got " + CN.NAMES.length)
  if (problems.length) {
    console.error("math checks failed:")
    problems.forEach(p => console.error("  " + p))
    process.exit(1)
  }
  console.log(`math checks passed (${FAMILIES.length} families, ${CN.NAMES.length} names)`)
}

assertMath()

writeBoth("color-shades-generator", shadesGeneratorPage())
writeBoth("color-name-finder", nameFinderPage())
for (const family of FAMILIES) writeBoth(`shades-of-${family.key}`, familyPage(family))
write("sitemap.xml", sitemap())
syncHomepage()
for (const file of allHtmlFiles()) syncChrome(file)

if (check) {
  if (stale.length) {
    console.error(`stale or missing (${stale.length}):`)
    stale.slice(0, 20).forEach(s => console.error("  " + s))
    if (stale.length > 20) console.error(`  ... and ${stale.length - 20} more`)
    console.error("\nrun: node tools/build_color_pages.mjs")
    process.exit(1)
  }
  console.log("generated files are up to date")
} else {
  console.log(`wrote ${FAMILIES.length} family pages + 2 tool pages (both URL forms), sitemap.xml, the homepage cards and the nav on every page`)
}
