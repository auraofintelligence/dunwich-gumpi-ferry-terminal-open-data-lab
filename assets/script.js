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

function supportsWebGl() {
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch (error) {
    return false;
  }
}

function setupPhotoMap() {
  const map = document.querySelector("[data-photo-map]");
  const preview = document.querySelector("[data-photo-preview]");
  const thumbs = document.querySelector("[data-photo-thumbs]");
  const viewer = document.querySelector("[data-pano-viewer]");
  const selectedCount = document.querySelector("[data-selected-count]");
  const downloadCurrent = document.querySelector("[data-download-current]");
  const downloadSelected = document.querySelector("[data-download-selected]");
  const selectAll = document.querySelector("[data-select-all-panos]");
  const clearSelection = document.querySelector("[data-clear-panos]");
  const points = window.DUNWICH_GUMPI_PHOTO_POINTS || [];
  if (!map || !preview || !thumbs || !points.length) return;

  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  let activeId = points[0].id;
  const selectedIds = new Set();
  let sphereViewer = null;

  function project(point) {
    const x = 12 + ((point.lon - minLon) / Math.max(maxLon - minLon, .00001)) * 76;
    const y = 86 - ((point.lat - minLat) / Math.max(maxLat - minLat, .00001)) * 70;
    return { x, y };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function spreadMapPoints() {
    const placed = [];
    const minDistance = 7.2;

    return points.map((point, index) => {
      const base = project(point);
      let position = base;

      for (let attempt = 0; attempt < 64; attempt += 1) {
        const ring = Math.ceil(attempt / 8);
        const radius = attempt === 0 ? 0 : ring * 4.2;
        const angle = ((attempt % 8) / 8) * Math.PI * 2 + (index % 3) * .24;
        const candidate = {
          x: clamp(base.x + Math.cos(angle) * radius, 8, 92),
          y: clamp(base.y + Math.sin(angle) * radius, 10, 90)
        };
        const clear = placed.every((existing) => Math.hypot(candidate.x - existing.x, candidate.y - existing.y) >= minDistance);

        if (clear) {
          position = candidate;
          break;
        }
      }

      placed.push(position);
      return { point, position };
    });
  }

  function downloadFile(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function getActivePoint() {
    return points.find((point) => point.id === activeId) || points[0];
  }

  function getSelectedPoints() {
    return points.filter((point) => selectedIds.has(point.id));
  }

  function syncSelection() {
    document.querySelectorAll("[data-photo-select]").forEach((input) => {
      input.checked = selectedIds.has(input.dataset.photoSelect);
    });
    if (selectedCount) {
      const count = selectedIds.size;
      selectedCount.textContent = `${count} selected`;
    }
  }

  function downloadPointSet(items) {
    items.forEach((point, index) => {
      window.setTimeout(() => downloadFile(point.pano, point.downloadName), index * 180);
    });
  }

  function viewFileName(point) {
    const base = point.downloadName.replace(/\.[^.]+$/, "");
    if (!sphereViewer) return `${base}-current-view.png`;
    const yaw = Math.round(sphereViewer.getYaw());
    const pitch = Math.round(sphereViewer.getPitch());
    return `${base}-view-yaw-${yaw}-pitch-${pitch}.png`;
  }

  function setWorkflowStatus(message) {
    const status = viewer?.querySelector("[data-workflow-status]");
    if (status) status.textContent = message;
  }

  function currentViewLabel() {
    if (!sphereViewer) return "selected viewer angle";
    return `yaw ${Math.round(sphereViewer.getYaw())}, pitch ${Math.round(sphereViewer.getPitch())}, field of view ${Math.round(sphereViewer.getHfov())}`;
  }

  function buildGeneratorPrompt(point) {
    const focus = viewer?.querySelector("[data-design-focus]")?.value || "shade, safety and arrival experience";
    const idea = viewer?.querySelector("[data-design-idea]")?.value.trim() || "a practical public-space improvement that locals could debate, change or reject";
    const notes = viewer?.querySelector("[data-design-notes]")?.value.trim() || "keep the existing shoreline, paths, vegetation, ferry context and public evidence visible";
    return [
      `Use the attached saved view from ${point.title} as the real site reference.`,
      `Create a clearly labelled concept overlay for ${focus}.`,
      `Idea: ${idea}.`,
      `Keep the current place recognisable: ${notes}.`,
      "Do not present the image as an approved design, survey drawing or finished plan.",
      "Make it useful for community discussion: show what changes, what stays, and what still needs real data."
    ].join(" ");
  }

  function syncGeneratorPrompt(point) {
    const prompt = viewer?.querySelector("[data-generated-prompt]");
    if (prompt) prompt.value = buildGeneratorPrompt(point);
  }

  function saveCurrentView(point) {
    if (!sphereViewer || !sphereViewer.isLoaded()) {
      setWorkflowStatus("The 360 viewer is still loading. Try again once the image is visible.");
      return;
    }

    try {
      sphereViewer.stopMovement();
      const canvas = sphereViewer.getRenderer()?.getCanvas?.();
      if (!canvas || !canvas.toBlob) throw new Error("Viewer canvas is not available.");
      canvas.toBlob((blob) => {
        if (!blob) {
          setWorkflowStatus("This browser could not export the view. Use a browser screenshot, then copy the prompt below.");
          return;
        }
        const url = URL.createObjectURL(blob);
        downloadFile(url, viewFileName(point));
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        setWorkflowStatus(`Saved the current view as a PNG from ${currentViewLabel()}. Use that image with the prompt below.`);
      }, "image/png");
    } catch (error) {
      setWorkflowStatus("This browser could not export the view. Use a browser screenshot, then copy the prompt below.");
    }
  }

  function setupSphereViewer(point) {
    const stage = viewer?.querySelector("[data-sphere-stage]");
    if (!stage) return;

    if (sphereViewer?.destroy) {
      sphereViewer.destroy();
      sphereViewer = null;
    }

    if (!supportsWebGl()) {
      stage.innerHTML = `
        <div class="viewer-fallback">
          <h4>360 viewer unavailable on this device</h4>
          <p>This browser or computer is not offering WebGL, which the look-around viewer needs. Older laptops, older operating systems, disabled hardware acceleration or locked-down browser settings can cause this.</p>
          <p>The public evidence still works: use the selected thumbnail, the raw flattened panorama strip below, or download the original 360 photo.</p>
        </div>
      `;
      setWorkflowStatus("WebGL is not available here. Use the fallback image, raw strip or download links.");
      return;
    }

    if (!window.pannellum?.viewer) {
      stage.innerHTML = `<p class="viewer-fallback">The interactive 360 viewer did not load. Use the thumbnail, raw panorama strip or downloads as the fallback.</p>`;
      setWorkflowStatus("The 360 viewer library did not load. Use the fallback image, raw strip or download links.");
      return;
    }

    sphereViewer = pannellum.viewer(stage, {
      type: "equirectangular",
      panorama: point.pano,
      autoLoad: true,
      showControls: true,
      showFullscreenCtrl: true,
      pitch: -4,
      yaw: 0,
      hfov: 95,
      minHfov: 35,
      maxHfov: 120,
      compass: false,
      preview: point.thumb,
      previewTitle: point.title,
      previewAuthor: "Dunwich Gumpi Open Data Lab"
    });

    sphereViewer.on("load", () => {
      setWorkflowStatus("Drag the 360 photo until the useful angle is framed, then save the current view.");
    });

    sphereViewer.on("error", () => {
      setWorkflowStatus("The interactive viewer could not load this panorama. Use the raw strip below as the fallback reference.");
    });
  }

  function setupPromptWorkflow(point) {
    const saveButton = viewer?.querySelector("[data-save-view]");
    const copyButton = viewer?.querySelector("[data-copy-prompt]");
    const prompt = viewer?.querySelector("[data-generated-prompt]");
    const fields = viewer?.querySelectorAll("[data-design-focus], [data-design-idea], [data-design-notes]") || [];

    saveButton?.addEventListener("click", () => saveCurrentView(point));
    fields.forEach((field) => field.addEventListener("input", () => syncGeneratorPrompt(point)));
    fields.forEach((field) => field.addEventListener("change", () => syncGeneratorPrompt(point)));
    copyButton?.addEventListener("click", async () => {
      syncGeneratorPrompt(point);
      try {
        await navigator.clipboard.writeText(prompt.value);
        setWorkflowStatus("Prompt copied. Attach the saved view in your image generator, then paste this prompt.");
      } catch (error) {
        prompt.select();
        setWorkflowStatus("Prompt selected. Copy it manually, then attach the saved view in your image generator.");
      }
    });
    syncGeneratorPrompt(point);
  }

  function renderActive(point) {
    activeId = point.id;
    if (sphereViewer?.destroy) {
      sphereViewer.destroy();
      sphereViewer = null;
    }
    preview.innerHTML = `
      <div class="selected-photo-compact">
        <img src="${point.thumb}" alt="${point.title}">
        <div>
          <span class="section-label">Selected point</span>
          <h3>${point.title}</h3>
          <p class="photo-meta">${point.captureLabel} - ${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}</p>
        </div>
      </div>
    `;
    if (viewer) {
      viewer.innerHTML = `
        <div class="pano-viewer main-pano-viewer">
          <div class="pano-header">
            <div>
              <span class="section-label">Interactive 360 view</span>
              <h3>${point.title}</h3>
              <p>Drag inside the photo, frame the angle that matters, then save that view as the reference image for a labelled concept overlay.</p>
            </div>
            <span class="pano-tag">360 viewer</span>
          </div>
          <div class="sphere-viewer main-sphere-viewer" data-sphere-stage aria-label="${point.title} interactive 360 viewer"></div>
          <div class="viewer-toolbelt">
            <div class="pano-pipeline compact-pipeline">
              <h4>View to image-generator concept</h4>
              <p>Frame the site angle, save it as a PNG, attach that PNG to an image model, then paste the prompt. Keep the original photo linked beside any generated concept.</p>
              <div class="button-row">
                <button class="button primary small-button" type="button" data-save-view>Save current view</button>
                <a class="button ghost small-button" href="${point.pano}" download="${point.downloadName}">Download full 360</a>
              </div>
              <p class="workflow-status" data-workflow-status>Loading the 360 viewer...</p>
            </div>
            <details class="prompt-drawer" open>
              <summary>Concept prompt</summary>
              <form class="idea-prompt-form" data-prompt-form>
                <label>
                  <span>Focus</span>
                  <select data-design-focus>
                    <option value="shade, seating and a calmer waiting area">Shade + seating</option>
                    <option value="safer pedestrian movement and clearer ferry queues">Movement + queues</option>
                    <option value="Gumpi arrival, culture and public welcome">Culture + arrival</option>
                    <option value="wildlife-safe edges, planting and stormwater care">Ecology + edges</option>
                    <option value="local enterprise, kiosks and event noticeboards">Local enterprise</option>
                    <option value="maker-space prototype: modular rails, blocks or shelters">Maker prototype</option>
                  </select>
                </label>
                <label>
                  <span>Idea to test</span>
                  <textarea data-design-idea rows="3" placeholder="Example: add a lightweight shade canopy and seating line that keeps the sea view open and leaves service access clear."></textarea>
                </label>
                <label class="prompt-output-label">
                  <span>Prompt</span>
                  <textarea data-generated-prompt rows="5" readonly></textarea>
                </label>
                <label class="honesty-notes-label">
                  <span>Keep honest</span>
                  <textarea data-design-notes rows="2" placeholder="Keep the real shoreline, paths, vegetation, ferry context and public evidence visible; mark new elements as concept overlays."></textarea>
                </label>
                <div class="button-row prompt-actions">
                  <button class="button ghost small-button" type="button" data-copy-prompt>Copy prompt</button>
                  <a class="button ghost small-button" href="simulation-workflows.html">Workflow guide</a>
                </div>
              </form>
            </details>
          </div>
          <details class="raw-pano-details">
            <summary>Open the raw flattened panorama strip</summary>
            <div class="pano-scroll"><img src="${point.pano}" alt="${point.title} equirectangular panorama"></div>
          </details>
        </div>
      `;
      setupSphereViewer(point);
      setupPromptWorkflow(point);
    }
    document.querySelectorAll("[data-photo-id]").forEach((element) => {
      element.classList.toggle("active", element.dataset.photoId === activeId);
    });
  }

  spreadMapPoints().forEach(({ point, position }, index) => {
    const { x, y } = position;
    const marker = document.createElement("button");
    marker.className = "map-point";
    marker.type = "button";
    marker.dataset.photoId = point.id;
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    marker.title = point.title;
    marker.setAttribute("aria-label", `Show ${point.title}`);
    marker.textContent = point.sequence;
    marker.addEventListener("click", () => renderActive(point));
    map.append(marker);

    const item = document.createElement("div");
    item.className = "thumb-item";

    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.dataset.photoId = point.id;
    thumb.innerHTML = `<img src="${point.thumb}" alt="${point.title} thumbnail"><span>${point.sequence}</span>`;
    thumb.addEventListener("click", () => renderActive(point));
    item.append(thumb);

    const label = document.createElement("label");
    label.className = "thumb-select";
    label.innerHTML = `<input type="checkbox" data-photo-select="${point.id}"> Add`;
    label.querySelector("input").addEventListener("change", (event) => {
      if (event.target.checked) {
        selectedIds.add(point.id);
      } else {
        selectedIds.delete(point.id);
      }
      syncSelection();
    });
    item.append(label);
    thumbs.append(item);

    if (index === 0) renderActive(point);
  });

  downloadCurrent?.addEventListener("click", () => {
    const point = getActivePoint();
    downloadFile(point.pano, point.downloadName);
  });

  downloadSelected?.addEventListener("click", () => {
    const selected = getSelectedPoints();
    downloadPointSet(selected.length ? selected : [getActivePoint()]);
  });

  selectAll?.addEventListener("click", () => {
    points.forEach((point) => selectedIds.add(point.id));
    syncSelection();
  });

  clearSelection?.addEventListener("click", () => {
    selectedIds.clear();
    syncSelection();
  });

  syncSelection();
}

renderHeader();
renderFooter();
renderSequenceNav();
setupToTop();
setupExternalLinks();
setupPhotoMap();
