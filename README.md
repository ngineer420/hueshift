# gamutlens.com

Browser-only color tools. The site is static HTML, CSS and JavaScript on GitHub Pages. Nothing that a user types or uploads leaves the browser.

`tools/build_color_pages.mjs` writes the generated pages, `sitemap.xml`, `sw.js`, the nav on every page and the manifest link in every head. Run it after each change to a page, an asset or the tool itself:

```sh
node tools/build_color_pages.mjs           # write everything
node tools/build_color_pages.mjs --check   # exit 1 when a generated file is stale
```

## Offline

`sw.js` is a service worker. It precaches every page URL in `sitemap.xml` and every same-origin stylesheet and script that those pages load. A page that opened once opens again without a network.

The precache list is not typed by hand. `tools/build_color_pages.mjs` builds it from the same URL list that writes `sitemap.xml`, then scans each page for `<link rel="stylesheet">` and `<script src>` tags with a same-origin path.

The cache name is `gamutlens-` plus a 12-character hash of the content of every precached file. A deploy that changes any precached file gets a new cache name. The new worker deletes the old cache when it activates. To refresh the cache name, run `node tools/build_color_pages.mjs` and commit `sw.js`.

The worker answers only same-origin GET requests. It never intercepts the AdSense script and it never caches any third-party request.

`assets/app.js` registers the worker on every page. `manifest.webmanifest` and `icon-512.png` make the site installable.

## Before a deploy

1. Run `node tools/build_color_pages.mjs`.
2. Run `node tools/build_color_pages.mjs --check`. If it exits with 1, commit the files it names.
