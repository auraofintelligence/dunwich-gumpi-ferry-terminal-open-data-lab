const pages = [
  ["home", "Home", "index.html"],
  ["map", "Evidence Map", "evidence-map.html"],
  ["official", "Official Trail", "official-trail.html"],
  ["spectrum", "Design Spectrum", "design-spectrum.html"],
  ["simulate", "Simulate", "simulation-workflows.html"],
  ["data", "Drone + LiDAR", "data-ladder.html"],
  ["tools", "Tools", "tools.html"],
  ["song", "Song", "song.html"],
  ["sources", "Sources", "sources.html"]
];

const currentPage = document.body.dataset.page || "home";

function renderHeader() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const links = pages.map(([id, label, href]) => {
    const current = id === currentPage ? ' aria-current="page"' : "";
    return `<a href="${href}"${current}>${label}</a>`;
  }).join("");

  header.innerHTML = `
    <nav class="nav" aria-label="Main navigation">
      <a class="brand" href="index.html" aria-label="Dunwich Gumpi Ferry Terminal Open Data Lab home">
        <span class="brand-mark">DG</span>
        <span class="brand-text"><strong>Dunwich Gumpi Lab</strong><span>open data and simulation</span></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      <div class="nav-links" id="site-nav">${links}</div>
    </nav>
  `;

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".nav-links");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function renderFooter() {
  const footer = document.querySelector("[data-site-footer]");
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-inner">
      <p>Dunwich (Gumpi) Ferry Terminal Open Data Lab. A community prototype for source-backed site evidence, generative design exploration, and capability transfer around the ferry terminal upgrade.</p>
      <nav class="footer-links" aria-label="Footer links">
        <a href="sources.html">Sources</a>
        <a href="https://auraofintelligence.github.io/straddie-digital-twin-builders/l1.html" target="_blank" rel="noopener noreferrer">Digital twin L1</a>
        <a href="https://auraofintelligence.github.io/ready-set-co-op-trust-hub/" target="_blank" rel="noopener noreferrer">Ready S.E.T.</a>
        <a href="https://auraofintelligence.github.io/ballow-road-sand-screen-hub/" target="_blank" rel="noopener noreferrer">10-12 Ballow</a>
        <a href="https://github.com/auraofintelligence/dunwich-gumpi-ferry-terminal-open-data-lab" target="_blank" rel="noopener noreferrer">Source repo</a>
      </nav>
    </div>
  `;
}

function renderSequenceNav() {
  const container = document.querySelector("[data-sequence-nav]");
  if (!container) return;

  const index = pages.findIndex(([id]) => id === currentPage);
  if (index === -1) return;

  const previous = pages[(index - 1 + pages.length) % pages.length];
  const next = pages[(index + 1) % pages.length];
  container.innerHTML = `
    <nav class="sequence-nav" aria-label="Previous and next pages">
      <a href="${previous[2]}"><span>Previous</span><strong>${previous[1]}</strong></a>
      <a href="${next[2]}"><span>Next</span><strong>${next[1]}</strong></a>
    </nav>
  `;
}

function setupToTop() {
  const button = document.querySelector("[data-to-top]");
  if (!button) return;
  const sync = () => button.classList.toggle("visible", window.scrollY > 520);
  window.addEventListener("scroll", sync, { passive: true });
  button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  sync();
}

function setupExternalLinks() {
  document.querySelectorAll('a[href^="http"]').forEach((link) => {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });
}

function setupPhotoMap() {
  const map = document.querySelector("[data-photo-map]");
  const preview = document.querySelector("[data-photo-preview]");
  const thumbs = document.querySelector("[data-photo-thumbs]");
  const viewer = document.querySelector("[data-pano-viewer]");
  const points = window.DUNWICH_GUMPI_PHOTO_POINTS || [];
  if (!map || !preview || !thumbs || !points.length) return;

  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  let activeId = points[0].id;

  function project(point) {
    const x = 12 + ((point.lon - minLon) / Math.max(maxLon - minLon, .00001)) * 76;
    const y = 86 - ((point.lat - minLat) / Math.max(maxLat - minLat, .00001)) * 70;
    return { x, y };
  }

  function renderActive(point) {
    activeId = point.id;
    preview.innerHTML = `
      <figure class="selected-photo-frame">
        <img src="${point.thumb}" alt="${point.title}">
        <span>360 pano seed</span>
      </figure>
      <h3>${point.title}</h3>
      <p class="photo-meta">${point.sourceFile} - ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}</p>
      <p>${point.notes}</p>
    `;
    if (viewer) {
      viewer.innerHTML = `
        <div class="pano-viewer">
          <div class="pano-header">
            <div>
              <h3>${point.title} panorama strip</h3>
              <p>Scroll sideways to inspect the flattened 360 image. This is good enough for early idea prompts, not a survey model.</p>
            </div>
            <span class="pano-tag">2:1 360 image</span>
          </div>
          <div class="pano-scroll"><img src="${point.pano}" alt="${point.title} equirectangular panorama"></div>
        </div>
      `;
    }
    document.querySelectorAll("[data-photo-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.photoId === activeId);
    });
  }

  points.forEach((point, index) => {
    const { x, y } = project(point);
    const marker = document.createElement("button");
    marker.className = "map-point";
    marker.type = "button";
    marker.dataset.photoId = point.id;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.title = point.title;
    marker.setAttribute("aria-label", `Show ${point.title}`);
    marker.addEventListener("click", () => renderActive(point));
    map.append(marker);

    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.dataset.photoId = point.id;
    thumb.innerHTML = `<img src="${point.thumb}" alt="${point.title} thumbnail"><span>${point.id}</span>`;
    thumb.addEventListener("click", () => renderActive(point));
    thumbs.append(thumb);

    if (index === 0) renderActive(point);
  });
}

renderHeader();
renderFooter();
renderSequenceNav();
setupToTop();
setupExternalLinks();
setupPhotoMap();
