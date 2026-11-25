# brickwise

Turn any object, like a car you drive or a stadium you love, into a brick model you can actually build:

- **every brick, one by one**: part, colour, exact position, rotation and build step (`placements.csv`, `model.ldr`)
- **only parts that really exist in that colour**, checked against pinned Rebrickable data while the model is designed
- **a shopping list** with a cost estimate in PLN, ready-to-import files for Rebrickable and BrickLink, and your own sets subtracted (`--have 42115,60337`)
- **a step-by-step instruction booklet** (PDF) in the style of a printed manual: one step per page, parts callout, new parts highlighted, parts list at the end
- **a 3D viewer** page where the model turns, takes itself apart and rebuilds

Models can be built with LEGO® bricks or with compatible bricks from other manufacturers. Part numbers are LEGO design ids, which compatible brands follow.

LEGO® is a trademark of the LEGO Group, which does not sponsor, authorise or endorse this project. Toyota and C-HR are trademarks of Toyota Motor Corporation; the examples are fan models. Toyota and C-HR are trademarks of Toyota Motor Corporation; the examples are fan models.

## Why another tool

AI brick generators (LEGO Forge, BrickWright, BrickGPT, Brick Quest) can already place real parts and check that they connect. None of them checks whether a part was ever produced in the colour it uses, none prices the result, and none makes its own reproducible instructions. A model that looks fine on screen often cannot be bought: the LEGO Forge showcase "retro computer" uses an 8x8 plate in Reddish Brown, which was never made.

brickwise adds that layer:

| | LEGO Forge | brickwise |
|---|---|---|
| real parts, stud connections checked | yes | yes (same engine) |
| part exists in that colour | no | **checked while designing**; `box()` fills only use sizes made in that colour |
| buyable part ids (LDraw to Rebrickable to BrickLink) | no | verified mapping, unmapped parts refused |
| cost estimate, shopping files | no | PLN estimate, `rebrickable.csv`, `bricklink.xml` |
| subtract sets you own | no | yes, from Rebrickable set inventories |
| build steps | no (left to Studio) | supported bottom-up plan, written as `0 STEP` |
| instruction booklet | no | PDF, deterministic |
| reproducible output | no | byte-identical from the saved design down, tested |
| wheels physically mounted | no | every rim on an axle through a Technic hole (or a wheel-pin kit), checked |
| shape from real photos | agent looks at a picture | photos to 3D mesh to stud grid, design built inside it |

## Install as a Claude Code plugin

In Claude Code:

```
/plugin marketplace add mateuszkania-im/brickwise
/plugin install brickwise@brickwise
```

Then ask for a model ("make my car in LEGO", "how much would it cost to build the Maradona stadium") or type `/brickwise`. On first use the skill runs `npm ci` and `npx playwright install chromium` inside the plugin folder. Your designs are written to `brickwise-sets/` in the folder you run Claude Code from, not into the plugin, because the plugin folder is replaced on every update.

## Quick start

Requirements: Node.js 22+, macOS/Linux. `npm install` downloads three.js, Playwright (headless Chromium for rendering) and pdf-lib. `scripts/mesh-colours.py` (colouring a stud grid from a textured mesh) also needs Python 3 with `numpy` and `Pillow` (`pip install numpy Pillow`).

```sh
npm ci
npx playwright install chromium

# design with an AI coding agent (Claude Code, Codex, ...): it follows forge/AGENTS.md
node forge/bin/lego.mjs guide

# the whole chain from a saved design: build + check, parts list, shopping files, booklet, hashes
node bin/brickwise.mjs make examples/toyota-chr-2025 --have 42115

# or on any LDraw model (BrickLink Studio export, etc.)
node bin/brickwise.mjs bom path/to/model.ldr --have 60337
node bin/brickwise.mjs booklet path/to/model.ldr --title "My model"
```

### Getting the shape right

An agent that builds "by eye" gets proportions wrong. brickwise gives it a ground-truth shape first:

```sh
# photos (front, side, back, 3/4) -> 3D mesh with fal.ai Hunyuan3D v3.1 Pro (about $0.50, needs FAL_KEY)
node scripts/photos-to-3d.mjs --front front.jpg --left side.jpg --back rear.jpg --right-front 34.jpg --out ref/mesh.glb
# mesh -> stud grid at the chosen size (pure function, tested): layers + side/front/top silhouettes
node scripts/mesh-to-grid.mjs ref/mesh.glb --length 24 --out ref/grid.json
```

For buildings and stadiums the footprint comes from OpenStreetMap instead (see `examples/stadio-maradona/ref/footprint.json`). The designer builds the blockout from the grid and refines it with slopes, comparing renders side by side with the photos (`lego shots <set> --ref photo.jpg --view left`).

`make` stops with exit code 1 at the first problem: a check error (floating or colliding parts) or a part that cannot be bought. It never writes a shopping list for a model that cannot be built.

Output in `<set>/out/`:

| file | what |
|---|---|
| `set.html` | 3D viewer |
| `model.ldr` | the model with build steps; opens in BrickLink Studio, LeoCAD, LDCad |
| `brickwise/placements.csv` | every brick: step, part, colour, x/y/z (LDU), rotation |
| `brickwise/bom.csv` | parts list with Rebrickable and BrickLink ids, commonness, owned/to-buy |
| `brickwise/shopping.md` | cost estimate and how to buy |
| `brickwise/rebrickable.csv` | Rebrickable part-list import (it converts to BrickLink/BrickOwl itself) |
| `brickwise/bricklink.xml` | BrickLink wanted list |
| `brickwise/instructions.pdf` | the booklet |
| `MANIFEST.sha256` | hashes of all of the above |

## What is deterministic, and what is not

Two steps are generative and cannot be made reproducible with today's services:

- **photos to 3D mesh** (fal Hunyuan3D / Tripo). Measured: two Tripo runs with the same seed and the same photos gave different meshes (2.3% of stud-grid cells differ). The mesh is therefore saved with a JSON sidecar (request id, SHA-256 of every input photo and of the GLB), and everything is built from that saved file.
- **the design** written by an AI agent (`build.mjs`). It is saved too and becomes the source of truth.


The design itself is made by an AI agent writing `build.mjs`, and that step is not reproducible: ask twice and you get two designs. Everything after the saved `build.mjs` is:

- the data tables are built from pinned inputs whose SHA-256 is checked (`data/SOURCES.sha256`, `data/OUTPUTS.sha256`)
- packing, checking, step planning and every export are pure functions with fixed sort orders
- renders use a fixed orthographic camera, pixel ratio 1 and software rendering (SwiftShader); the PDF has fixed metadata
- `npm test` includes an end-to-end test that runs `make` twice on a fixture and compares every output with a golden manifest

Pinned versions matter: a different Chromium (Playwright version) can change pixels. Dependencies are pinned exactly in `package.json`.

The golden manifests (`MANIFEST.golden` in the fixture and in each example) were made on macOS. Booklet pages use system fonts (Helvetica, falling back to Arial), so on Linux the page images and the PDF can hash differently even though the models, parts lists and shopping files match.

## Tests

- `npm run test:fast` runs everything except the example rebuilds, in about 3 minutes. Use it while working.
- `npm test` also rebuilds every example from its saved design and compares it byte for byte with its golden manifest. That renders every booklet page and takes about 30 minutes.
- `node --test test/<file>.test.mjs` runs one file.

## Data tables

The tables in `data/` (`colors.csv`, `parts.csv`, `part_colors.csv`, `part_rels.csv`, `sets.csv`, `set_parts.csv.gz`, `LDConfig.ldr`, `forge_part_map.csv`) are prebuilt and committed, so you do not need to build them. They come from a Rebrickable database snapshot packaged by [rb.db](https://github.com/ojuuji/rb.db), the colour id table from rebrickable.com/colors (LDraw, BrickLink and BrickOwl ids) and the LDraw `LDConfig.ldr`. `data/SOURCES.sha256` pins the inputs and `data/OUTPUTS.sha256` the outputs.

`npm run data` rebuilds them. It is only for maintainers updating the snapshot: it needs the raw inputs in `data/raw/` (not in the repo) and `sqlite3`, and it checks their hashes first.

## Cost estimate

Prices are an estimate from how common each part+colour is (number of sets it appeared in, last year produced), not a live price: the marketplaces either have no public buyer API (BrickLink keys are for sellers) or need manual approval (BrickOwl catalog access). The tiers and shipping assumptions are in `src/bom.mjs` and explained in [docs/pricing.md](docs/pricing.md). The real price shows up in the marketplace cart.

## Data and licences

- Code: MIT. `forge/` is a fork of [LEGO Forge](https://github.com/ericfu-tianchi/lego-forge) by Tianchi Fu (MIT), extended with availability checks, buyable-size packing, step planning and more parts.
- Part geometry: [LDraw](https://www.ldraw.org) parts library, © LDraw.org contributors, CC BY 2.0.
- Part, colour and set data: [Rebrickable](https://rebrickable.com/downloads/) database downloads, via [rb.db](https://github.com/ojuuji/rb.db). Colour ids for LDraw, BrickLink and BrickOwl from rebrickable.com/colors.
- Stadium footprint: © OpenStreetMap contributors, ODbL 1.0 (see `examples/stadio-maradona/ref/NOTICE.md`).

LEGO® is a trademark of the LEGO Group, which does not sponsor, authorise or endorse this project. Toyota and C-HR are trademarks of Toyota Motor Corporation; the examples are fan models.
