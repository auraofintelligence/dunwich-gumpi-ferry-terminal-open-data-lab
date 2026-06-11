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

function renderConceptLaneOptions() {
  const options = conceptDesignLanes
    .map(([label, value]) => `<option value="${value}">${label}</option>`)
    .join("");

  return `
    <optgroup label="TMR concept design markers">
      ${options}
    </optgroup>
    <optgroup label="Community extra">
      <option value="another community idea not named in the current concept design">Add my own lane below</option>
    </optgroup>
  `;
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

  function responseOrQuestion(answer, question) {
    return answer ? answer : `Ask me: ${question}`;
  }

  function buildGeneratorPrompt(point) {
    const focusSelect = viewer?.querySelector("[data-design-focus]");
    const focus = focusSelect?.value || "an open community design idea";
    const focusLabel = focusSelect?.selectedOptions?.[0]?.textContent.trim() || focus;
    const extraLane = viewer?.querySelector("[data-design-extra]")?.value.trim() || "";
    const noticed = viewer?.querySelector("[data-design-notice]")?.value.trim() || "";
    const idea = viewer?.querySelector("[data-design-idea]")?.value.trim() || "";
    const people = viewer?.querySelector("[data-design-people]")?.value.trim() || "";
    const notes = viewer?.querySelector("[data-design-notes]")?.value.trim() || "";
    const hasAnyAnswer = extraLane || noticed || idea || people || notes;
    const customLaneSelected = focus === "another community idea not named in the current concept design";
    const lane = extraLane
      ? customLaneSelected
        ? `${extraLane} lane`
        : `${focus} lane, with an extra community lane called ${extraLane}`
      : `${focus} lane`;

    if (!hasAnyAnswer) {
      return [
        `Use the attached saved view from ${point.title} as the real site reference.`,
        "Before generating an image, ask me five quick questions:",
        "1. What caught your eye in this exact view?",
        "2. Does one of the 17 concept-design markers fit, or would you name another lane?",
        "3. What would you change, add, remove, move or protect here?",
        "4. Who should this help, and what should feel better for them?",
        "5. What must stay recognisable from the real place?",
        "After I answer, turn my words into a clearly labelled concept overlay for community discussion."
      ].join("\n");
    }

    return [
      `Use the attached saved view from ${point.title} as the real site reference.`,
      `Help me visualise my own idea in the ${lane}.`,
      "My answers:",
      `- Starting lane: ${focusLabel} - ${focus}`,
      `- Extra lane or missing issue: ${responseOrQuestion(extraLane, "If this does not fit the current concept-design list, what lane name would you add?")}`,
      `- What I noticed: ${responseOrQuestion(noticed, "What caught your eye in this exact view?")}`,
      `- What I want to try: ${responseOrQuestion(idea, "What would you change, add, remove, move or protect here?")}`,
      `- Who it should help: ${responseOrQuestion(people, "Who should this help, and what should feel better for them?")}`,
      `- What should stay recognisable: ${responseOrQuestion(notes, "What must stay recognisable from the real place?")}`,
      "If an answer is thin, ask one plain follow-up question before generating.",
      "When ready, make a clearly labelled concept overlay. Keep the real photo recognisable and do not present it as approved design, survey data or a finished plan."
    ].join("\n");
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
    const fields = viewer?.querySelectorAll("[data-design-focus], [data-design-extra], [data-design-notice], [data-design-idea], [data-design-people], [data-design-notes]") || [];

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
              <h4>Save the view, then shape the idea</h4>
              <p>Frame the site angle, save it as a PNG, answer the questions, then copy a prompt that carries your words into the image model.</p>
              <div class="button-row">
                <button class="button primary small-button" type="button" data-save-view>Save current view</button>
                <a class="button ghost small-button" href="${point.pano}" download="${point.downloadName}">Download full 360</a>
              </div>
              <p class="workflow-status" data-workflow-status>Loading the 360 viewer...</p>
            </div>
            <details class="prompt-drawer" open>
              <summary>Idea questions</summary>
              <form class="idea-prompt-form" data-prompt-form>
                <label>
                  <span>Starting lane</span>
                  <select data-design-focus>
                    ${renderConceptLaneOptions()}
                  </select>
                </label>
                <label>
                  <span>Add another lane</span>
                  <textarea data-design-extra rows="2" placeholder="If your idea does not fit the 17 numbered concept markers, name the missing lane here."></textarea>
                </label>
                <p class="prompt-tip">The starting lanes mirror the 17 numbered TMR concept-design markers. If your idea sits outside that list, add your own lane in this box.</p>
                <label>
                  <span>What catches your eye?</span>
                  <textarea data-design-notice rows="2" placeholder="What do you notice in this view: heat, glare, queueing, trees, water, parking, welcome, confusion, beauty?"></textarea>
                </label>
                <label class="prompt-question-wide">
                  <span>What would you like to try?</span>
                  <textarea data-design-idea rows="3" placeholder="Say it your way. What would you add, remove, move, protect, test or make easier here?"></textarea>
                </label>
                <label>
                  <span>Who should it help?</span>
                  <textarea data-design-people rows="2" placeholder="Locals, Elders, kids, ferry workers, visitors, wildlife, people with prams, bikes, wheelchairs?"></textarea>
                </label>
                <label>
                  <span>What must stay real?</span>
                  <textarea data-design-notes rows="2" placeholder="Keep the real shoreline, paths, vegetation, ferry context and public evidence visible; mark new elements as concept overlays."></textarea>
                </label>
                <label class="prompt-output-label">
                  <span>AI prompt from your answers</span>
                  <textarea data-generated-prompt rows="7" readonly></textarea>
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
