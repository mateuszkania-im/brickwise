---
name: brickwise
description: Turn any object (a description or a photo: a car, a building, a stadium, a thing) into a buildable brick model with every brick placed one by one, only parts that exist in their colour, a shopping list with a cost estimate (owned sets subtracted) and a step-by-step instruction booklet. Use when the user asks to "make X in LEGO / from bricks", "how much would it cost to build X", or types /brickwise or /klocki.
---

# brickwise

Toolkit: the repository that contains this skill (two folders up: `bin/brickwise.mjs`, `forge/`). Below `<bw>` means that folder.
When installed as a plugin, `<bw>` is the plugin cache, which is replaced on every update. So never write into `<bw>`: user designs
go into the user's working directory, `<sets>` = `$PWD/brickwise-sets` (create it). `<bw>/examples/` are read-only references.

0. **Install once.** If `<bw>/node_modules` is missing, run `cd <bw> && npm ci && npx playwright install chromium` (about 200 MB,
   tell the user first). The mesh colouring script also needs Python with `numpy` and `Pillow`.
1. **Existing models first (5 minutes).** Search the web for `<object> LEGO MOC rebrickable`, `<object> LEGO MOC flickr`. If a good MOC with
   instructions exists, show it (link, author, scale, parts, instruction price) and ask whether to use it. Rebrickable has no MOC API.
2. **Reference. Never design from a text description alone.** Download 3-5 real photos (front, side, back, 3/4; Wikimedia Commons,
   press galleries) into `<sets>/<name>/ref/` (keep photos out of git). For objects (cars, things): `scripts/photos-to-3d.mjs` (fal, needs FAL_KEY) then
   `scripts/mesh-to-grid.mjs --length <studs>`, and give the designer the grid as ground truth. For buildings and stadiums, take the footprint from OpenStreetMap
   (Overpass, `out geom`) and rasterise it to a stud grid, as in `<bw>/examples/stadio-maradona/ref/`. Ask the user for a photo file if
   they showed one in chat (pasted images are not files).
3. **Design** in a subagent (long task): `node <bw>/forge/bin/lego.mjs guide` and follow it exactly, with `LEGO_SETS=<sets>`
   (e.g. `LEGO_SETS=$PWD/brickwise-sets`), so the design is saved as `<sets>/<name>/build.mjs`.
   The checker refuses parts that cannot be bought in their colour; `lego parts <words>` lists only buyable parts with their colours.
4. **Make**: `node <bw>/bin/brickwise.mjs make <sets>/<name> --title "<title>" [--have <set numbers the user owns>]`
   (e.g. `make $PWD/brickwise-sets/<name>`).
   It must print `make: OK`. Otherwise fix the design and run it again.
5. **Deliver**: the 3D viewer (`out/set.html`), `out/hero.png`, the booklet (`out/brickwise/instructions.pdf`), the cost range and
   `shopping.md`. Say plainly that the cost is an estimate from part commonness, not a live price, and what still looks weak.
