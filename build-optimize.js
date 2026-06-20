// One-shot transform: de-base64 the page and wire up optimized assets.
// Reads the original fairpourtoi_4.html, writes index.html.
const fs = require("fs");

let html = fs.readFileSync("fairpourtoi_4.html", "utf8");
const before = html.length;

// --- 1. Nav + footer logo: identical image -> one shared file -------------
html = html.replace(
  /<img src="data:image\/png;base64,[^"]*" alt="Fair pour toi" class="nav-logo">/,
  '<img src="assets/img/logo.png" alt="Fair pour toi" class="nav-logo" width="384" height="384" decoding="async">'
);
html = html.replace(
  /<img src="data:image\/png;base64,[^"]*" alt="Fair pour toi" class="footer-logo">/,
  '<img src="assets/img/logo.png" alt="Fair pour toi" class="footer-logo" width="384" height="384" loading="lazy" decoding="async">'
);

// --- 2. Hero slides: drop inline base64 backgrounds -----------------------
// slide-N shows hero-(N+1). All four backgrounds are assigned in CSS via
// image-set() (see step 5). We deliberately do NOT set them from JS: a
// CSSOM-assigned image-set() silently fails to paint in Chrome, so the
// stylesheet is the only reliable place for it. The hero AVIFs are tiny
// (~136 KB for all four), so eager-loading them is the right call anyway.
html = html.replace(
  /<div class="photo-slide active" id="slide-0" style='background-image:url\(data:image\/jpeg;base64,[^)]*\)'><\/div>/,
  '<div class="photo-slide active" id="slide-0"></div>'
);
for (let s = 1; s <= 3; s++) {
  const re = new RegExp(
    `<div class="photo-slide" id="slide-${s}" style='background-image:url\\(data:image\\/jpeg;base64,[^)]*\\)'><\\/div>`
  );
  html = html.replace(re, `<div class="photo-slide" id="slide-${s}"></div>`);
}

// --- 3. About carousel images: <picture> AVIF + JPEG, lazy, no CLS --------
const about = [
  { n: 1, alt: "How to pronounce Fair Pour Toi" },
  { n: 2, alt: "Fair Pour Toi — for you, by Grace Fairest" },
];
for (const a of about) {
  const re = new RegExp(
    `<img src="data:image\\/png;base64,[^"]*" alt="${a.alt.replace(/[.*+?^${}()|[\]\\—]/g, "\\$&")}" style="[^"]*">`
  );
  const picture =
    `<picture>` +
    `<source type="image/avif" srcset="assets/img/about-${a.n}.avif">` +
    `<img src="assets/img/about-${a.n}.jpg" alt="${a.alt}" width="958" height="1192" loading="lazy" decoding="async" ` +
    `style="width:100%;height:100%;object-fit:cover;display:block;aspect-ratio:4/5;">` +
    `</picture>`;
  html = html.replace(re, picture);
}

// --- 4. Preload the LCP hero image in <head> ------------------------------
html = html.replace(
  "</head>",
  '<link rel="preload" as="image" href="assets/img/hero-1.jpg" fetchpriority="high">\n</head>'
);

// --- 5. All hero slide backgrounds in CSS: plain url() to the original JPEG.
// We intentionally avoid image-set() here: a CSS image-set() background does
// not paint in Chrome on slides that are first laid out while hidden
// (opacity:0), so slides 1-3 rendered blank. Plain url() always paints.
const heroCss = [0, 1, 2, 3]
  .map((s) => `#slide-${s}{background-image:url('assets/img/hero-${s + 1}.jpg');}`)
  .join("");
html = html.replace("</style>", heroCss + "\n</style>");

fs.writeFileSync("index.html", html);

// Sanity check: every base64 blob must be gone.
const leftover = (html.match(/data:image/g) || []).length;
console.log(`index.html written: ${(html.length / 1024).toFixed(1)} KB ` +
  `(was ${(before / 1024 / 1024).toFixed(2)} MB)`);
console.log(`remaining base64 images: ${leftover}  ${leftover === 0 ? "✓ clean" : "✗ PROBLEM"}`);
