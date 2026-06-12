# Dunwich (Gumpi) Ferry Terminal Open Data Lab

Public static site for a community open-data and simulation prototype around the Dunwich (Gumpi) Ferry Terminal Upgrade.

Public site target:

- https://auraofintelligence.github.io/dunwich-gumpi-ferry-terminal-open-data-lab/

Source repo target:

- https://github.com/auraofintelligence/dunwich-gumpi-ferry-terminal-open-data-lab

## What It Contains

- `index.html` - public landing page
- `evidence-map.html` - interactive 360-photo map
- `community-genai-examples.html` - credited community concept image and design visualisation examples
- `official-trail.html` - official source-backed project facts
- `design-spectrum.html` - simulation lanes and review boundaries
- `simulation-workflows.html` - evidence, design, simulate, review, share loop
- `data-ladder.html` - drone, photogrammetry, LiDAR and open-data next steps
- `tools.html` - Meshy, World Labs Marble, Blender, Scaniverse, Polycam and RealityScan roles
- `song.html` - community song and open-data ask
- `sources.html` - source trail

## Photo Handling

The original 360 and hall-display photos are not stored here as full-size originals. This repo stores smaller WebP derivatives and a generated manifest:

- `assets/photo-data.js`
- `docs/photo-manifest.json`

Regenerate photo assets with:

```powershell
python tools/generate_photo_assets.py
```

## Boundary

This is not an official government project page. It links to official project sources and adds a community workflow for open data, simulation and capability transfer.
