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

const conceptDesignLanes = [
  ["01 Passenger terminal + amenities", "passenger terminal building with ticket office and amenities"],
  ["02 Sheltered canopy + waiting", "large sheltered canopy and outdoor waiting areas"],
  ["03 Bus stop + shelter", "bus stop and shelter"],
  ["04 Kiss 'n' ride + shelters", "kiss 'n' ride area and shelters"],
  ["05 Bicycle enclosure", "bicycle enclosure"],
  ["06 Ferry pontoon + gangway", "ferry pontoon and gangway"],
  ["07 Public parking", "public parking"],
  ["08 Bus layovers", "bus layovers and waiting areas"],
  ["09 Pedestrian link to town", "pedestrian link to and from town"],
  ["10 Coastal habitat restoration", "coastal habitat restoration zone"],
  ["11 Relocated osprey roost", "relocated osprey roost"],
  ["12 Existing barge ramps", "existing barge ramps"],
  ["13 Barge queuing area", "barge queuing area"],
  ["14 Existing barge ticket area", "existing barge ticket area"],
  ["15 Existing amenities + bike rack", "existing amenities block and bicycle rack"],
  ["16 Staff parking", "staff parking"],
  ["17 Foreshore + Harold Walker Jetty", "improved foreshore area and connection to Harold Walker Jetty"]
];

function renderConceptLaneCheckboxes() {
  return conceptDesignLanes
    .map(([label, value], index) => {
      const id = `design-lane-${String(index + 1).padStart(2, "0")}`;
      return `
        <label class="lane-check" for="${id}">
          <input id="${id}" type="checkbox" data-design-lane value="${value}" data-lane-label="${label}">
          <span>${label}</span>
        </label>
      `;
    })
    .join("");
}

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
  const ideaWorkbench = document.querySelector("[data-idea-workbench]");
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
    const status = ideaWorkbench?.querySelector("[data-workflow-status]") || viewer?.querySelector("[data-workflow-status]");
    if (status) status.textContent = message;
  }

  function currentViewLabel() {
    if (!sphereViewer) return "selected viewer angle";
    return `yaw ${Math.round(sphereViewer.getYaw())}, pitch ${Math.round(sphereViewer.getPitch())}, field of view ${Math.round(sphereViewer.getHfov())}`;
  }

  function responseOrQuestion(answer, question) {
    return answer ? answer : `Ask me: ${question}`;
  }

  function buildGeneratorPrompt(point) {
    const selectedLanes = Array.from(ideaWorkbench?.querySelectorAll("[data-design-lane]:checked") || [])
      .map((input) => ({
        label: input.dataset.laneLabel || input.value,
        value: input.value
      }));
    const extraLane = ideaWorkbench?.querySelector("[data-design-extra]")?.value.trim() || "";
    const problem = ideaWorkbench?.querySelector("[data-design-problem]")?.value.trim() || "";
    const build = ideaWorkbench?.querySelector("[data-design-build]")?.value.trim() || "";
    const placement = ideaWorkbench?.querySelector("[data-design-placement]")?.value.trim() || "";
    const movement = ideaWorkbench?.querySelector("[data-design-movement]")?.value.trim() || "";
    const users = ideaWorkbench?.querySelector("[data-design-users]")?.value.trim() || "";
    const look = ideaWorkbench?.querySelector("[data-design-look]")?.value.trim() || "";
    const output = ideaWorkbench?.querySelector("[data-design-output]")?.value.trim() || "";
    const laneLabels = selectedLanes.map((lane) => lane.label);
    const laneValues = selectedLanes.map((lane) => lane.value);
    const laneBrief = [
      ...laneValues,
      extraLane ? `extra community lane: ${extraLane}` : ""
    ].filter(Boolean).join("; ");
    const hasAnyAnswer = selectedLanes.length || extraLane || problem || build || placement || movement || users || look || output;

    if (!hasAnyAnswer) {
      return [
        `Use the attached saved view from ${point.title} as the source photo.`,
        "Treat the current photo as a mostly blank, overgrown terminal site for a future infrastructure concept.",
        "Before generating an image, ask me seven plain design questions:",
        "1. Which numbered project lanes should this idea include?",
        "2. What everyday terminal problem or opportunity should it solve?",
        "3. What buildings, landscape elements, shelter, services or public-space pieces should appear?",
        "4. Where should they sit on the blank terminal ground, and how should they relate to the water, cliffs, seawalls and roads?",
        "5. How should people, buses, bikes, cars, ferries, barges and wildlife move through it?",
        "6. Who uses it, at what scale, and in what weather or ferry-rush conditions?",
        "7. What material, climate and visual style should the concept image use?",
        "After I answer, turn my words into a clearly labelled future-infrastructure concept image for community vision-boarding."
      ].join("\n");
    }

    return [
      "Architectural concept-image brief for a community vision-board.",
      `Reference image: use the attached saved view from ${point.title} as the source photo and camera angle.`,
      "Site reading: treat the current photo as a mostly blank, overgrown ex-sandmining terminal site. It is a starting pad for future infrastructure, not something to preserve as-is.",
      `Selected project lanes: ${responseOrQuestion(laneLabels.join("; "), "Which numbered project lanes should this idea include?")}`,
      `- Extra lane or missing issue: ${responseOrQuestion(extraLane, "If this does not fit the current concept-design list, what lane name would you add?")}`,
      `Design aim: ${responseOrQuestion(problem, "What everyday terminal problem or opportunity should it solve?")}`,
      `Programme and visible elements: ${responseOrQuestion(build, "What buildings, landscape elements, shelter, services or public-space pieces should appear?")}`,
      `Placement and site relationship: ${responseOrQuestion(placement, "Where should the pieces sit, and how should they relate to the water, cliffs, seawalls, roads and blank ground?")}`,
      `Movement and access: ${responseOrQuestion(movement, "How should people, buses, bikes, cars, ferries, barges and wildlife move through it?")}`,
      `Users, operations and scale: ${responseOrQuestion(users, "Who uses it, at what scale, and in what weather or ferry-rush conditions?")}`,
      `Form, materials and climate response: ${responseOrQuestion(look, "What material, climate and maintenance choices should guide it?")}`,
      `Output style and labels: ${responseOrQuestion(output, "Should it look like a labelled photomontage, sketch overlay, realistic render, section marker or public-poster concept?")}`,
      laneBrief ? `Integrated concept scope: ${laneBrief}.` : "Integrated concept scope: ask me which project lanes to combine before generating.",
      "If an answer is thin, ask one plain follow-up question before generating.",
      "Image generation instructions: keep the source-photo perspective, horizon, light direction and scale cues believable. Make the new architecture and landscape read as an overlay on the real site, with clear labels for major changes. Show practical access, shade, waiting, movement and coastal-weather logic rather than generic resort styling.",
      "Do not present it as an approved design, survey drawing, construction document or finished plan. Keep cliffs, seawalls, shoreline and ferry/barge access believable, but redesign the blank terminal ground as needed."
    ].join("\n");
  }

  function syncGeneratorPrompt(point) {
    const prompt = ideaWorkbench?.querySelector("[data-generated-prompt]");
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
    const ideaSaveButton = ideaWorkbench?.querySelector("[data-save-view]");
    const copyButton = ideaWorkbench?.querySelector("[data-copy-prompt]");
    const prompt = ideaWorkbench?.querySelector("[data-generated-prompt]");
    const fields = ideaWorkbench?.querySelectorAll("[data-design-lane], [data-design-extra], [data-design-problem], [data-design-build], [data-design-placement], [data-design-movement], [data-design-users], [data-design-look], [data-design-output]") || [];

    saveButton?.addEventListener("click", () => saveCurrentView(point));
    ideaSaveButton?.addEventListener("click", () => saveCurrentView(point));
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
          <div class="button-row viewer-buttons">
            <button class="button primary small-button" type="button" data-save-view>Save current view</button>
            <a class="button ghost small-button" href="${point.pano}" download="${point.downloadName}">Download full 360</a>
          </div>
          <details class="raw-pano-details">
            <summary>Open the raw flattened panorama strip</summary>
            <div class="pano-scroll"><img src="${point.pano}" alt="${point.title} equirectangular panorama"></div>
          </details>
        </div>
      `;
    }
    if (ideaWorkbench) {
      ideaWorkbench.innerHTML = `
        <div class="idea-workbench-panel">
          <div class="pano-pipeline compact-pipeline">
            <h4>Make a community concept image</h4>
            <p>Save a view, select the project lanes it touches, then write a short architectural brief the image model can actually follow.</p>
            <div class="button-row">
              <button class="button primary small-button" type="button" data-save-view>Save current view</button>
              <a class="button ghost small-button" href="${point.pano}" download="${point.downloadName}">Download full 360</a>
            </div>
            <p class="workflow-status" data-workflow-status>Loading the 360 viewer...</p>
          </div>
          <details class="prompt-drawer" open>
            <summary>Future design questions</summary>
            <form class="idea-prompt-form" data-prompt-form>
                <fieldset class="lane-fieldset">
                  <legend>Project lanes - select one or more</legend>
                  <div class="lane-grid">
                    ${renderConceptLaneCheckboxes()}
                  </div>
                </fieldset>
                <label class="extra-lane-label">
                  <span>Add your own lane</span>
                  <textarea data-design-extra rows="3" placeholder="Name the missing community lane here."></textarea>
                </label>
                <p class="prompt-tip">The 17 lanes mirror the numbered TMR concept-design markers. Tick every lane your idea touches, then add another lane if the official list misses something. Treat the photo as a blank future terminal site: cliffs, seawalls, shoreline and access need to stay believable; the flat terminal ground is open for new ideas.</p>
                <label>
                  <span>Design aim</span>
                  <textarea data-design-problem rows="3" placeholder="What problem, opportunity or daily frustration should this solve?"></textarea>
                </label>
                <label class="field-span-2">
                  <span>Programme + visible elements</span>
                  <textarea data-design-build rows="3" placeholder="Canopy, terminal room, seating, bus loop, bike hub, ticketing, toilets, market edge, planting, lighting, maker module."></textarea>
                </label>
                <label>
                  <span>Placement + site relationship</span>
                  <textarea data-design-placement rows="3" placeholder="Where does it sit? Face water, cliffs, seawalls, roads and ferry access."></textarea>
                </label>
                <label>
                  <span>Movement + access</span>
                  <textarea data-design-movement rows="3" placeholder="Pedestrians, prams, wheelchairs, bikes, cars, buses, queues, ferries, wildlife."></textarea>
                </label>
                <label>
                  <span>Users + operating conditions</span>
                  <textarea data-design-users rows="3" placeholder="Commuters, school runs, Elders, workers, visitors, rush hour, storms, heat, night arrivals."></textarea>
                </label>
                <label>
                  <span>Form, materials + climate</span>
                  <textarea data-design-look rows="3" placeholder="Coastal structure, shade, wind, drainage, local stone, timber, solar, reef-safe runoff."></textarea>
                </label>
                <label class="field-span-2">
                  <span>Image output style</span>
                  <textarea data-design-output rows="3" placeholder="Labelled photomontage, realistic but conceptual, same camera angle, show what changes."></textarea>
                </label>
                <label class="prompt-output-label">
                  <span>AI prompt from your answers</span>
                  <textarea data-generated-prompt rows="8" readonly></textarea>
                </label>
                <div class="button-row prompt-actions">
                  <button class="button ghost small-button" type="button" data-copy-prompt>Copy prompt</button>
                  <a class="button ghost small-button" href="simulation-workflows.html">Workflow guide</a>
                </div>
            </form>
          </details>
        </div>
      `;
    }
    if (viewer) {
      setupSphereViewer(point);
    }
    setupPromptWorkflow(point);
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
