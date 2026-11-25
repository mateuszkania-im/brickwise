# Toyota C-HR 2025 (sculpture) - brief

**Subject**: the user's blue 2nd-generation Toyota C-HR (2025) with a black roof, as a display-scale brick sculpture, about 1:12.
**Scale**: display/sculpture, 36 studs long, 14 wide (16 over the mirrors), 31 plates tall.
**Shape source**: ref/chr-sculpture-36.json (voxel grid from a 3D mesh of the real car). Its side profile is the best likeness we
have: the shape is kept within one plate / one stud of the grid everywhere (column top/bottom read from the grid, mirrored left/right).

**Signature features**
1. Coupe-crossover silhouette: long low bonnet, steep A-pillar, roof peaking over the front doors, sloping rear glass to a spoiler.
2. Two-tone: blue body, black roof and pillars, black cladding (arches, sills, bumpers).
3. Hammerhead front: thin LED slit under the bonnet edge hooking down into a C at the corners, hourglass grille, black corner intakes.
4. Full-width thin red light bar at the rear with red corners.
5. Big wheels in black arches, black mirrors.

**Palette**: Blue, Black, Trans-Black (glass), Trans-Clear (LED), Trans-Red (tail), Flat Silver (rims), Dark Bluish Gray accents.
**Out**: door handles, number plates, badges (too small at this scale for the grid resolution), interior.
**Parts**: budget up to 2,500.

## Review round 1 (first build with real wheels, region colours, tiles)
Check: PASS, 1062 parts. Renders: out/sheet.png, out/compare-hero.png, out/compare-side.png.
Critique:
1. The windscreen is a staircase of Trans-Black tiles that renders tan/grey from the hero angle and almost white from the top:
   the glass area reads lighter than the blue body, the opposite of the photo where the glasshouse is a dark mass.
2. The grille is a flat Dark Bluish Gray slab flush with the face: it reads as a grey number plate, not a dark hourglass grille.
   No depth anywhere on the front face.
3. Red pixels are scattered over the rear quarter on the side (rear-face paint hits every staircase step of the rounded corner).
4. Every edge is a raw staircase (bonnet sides, nose, rear glass, roof edge): 19% specialty parts, the model looks like voxels.
5. Wheel arches are square boxes (the tyre's bounding box is cut out) with a black lintel only over the top; the photo shows round
   black arch rings.
6. The blue door sides are large flat areas; the photo has the black lower cladding rising towards the arches.
Scores (rubric): silhouette 8, signature features 5, colour 6, detail 4, build quality 7.
Fix first: glass colour, grille, red spill; then slopes on the staircase edges.

## Review round 2 (grille recess, rear paint, cheese slopes)
Changes after round 1: grille cells removed one stud deep (dark, shadowed), rear-face paint limited to z <= 3, 1x1 cheese slopes
(54200) on every top cell that stands 2+ plates over a neighbour (same two cells, so the shape is unchanged), front faces bonded
with forced front-to-back 1x2 plates on every other layer. PASS, 1274 parts, 26% specialty.
Critique:
1. The windscreen is still a pale tan staircase from the hero angle: flat Trans-Black tiles render light.
2. Grille hourglass hardly readable: the first face map put the blue band between LED and grille too wide.
3. Recessed grille floor showed bare studs (tile test ignored the removed cells).
4. The face colours copied one stud back spilled red onto the rear quarter and LED onto the front wing sides.
5. A black band (y 22-23) runs along the whole door top under the windows; the photo has body colour up to the glass at the front.
Scores: recognisable 6, proportion 8, structure 7, detail 6, colour 6.

## Review round 3 (face map, windscreen treads)
Changes: new face map (LED slit stepping down inwards with a C hook at the corner, dark lamp under it, grille narrow at the top and
widest at the bumper between two blue blades, black corner intakes); grille floor tiled; windscreen treads Black with the sloped
faces in Trans-Black, so the glasshouse reads as one dark mass like the photo. PASS, 1269 parts.
Critique:
1. Windscreen now dark (better match), but still stepped in five bands.
2. Red still spilt onto the rear flank in a big patch (copy-behind hit side-visible cells).
3. The door tops are black up to the glass.
4. Arches are square openings (the checker clears the tyre's bounding box) with a black lintel; the photo has round arches.
5. The nose top is a sawtooth of small slopes.
Scores: recognisable 7, proportion 8, structure 7, detail 6, colour 7.

## Review round 4 (final)
Changes: face colours are copied one stud back only when that cell is hidden (no spill on the flanks); door tops and front wing
blue up to the glass (z >= 13). PASS, 1265 parts, 26% specialty parts, 0 warnings.
Remaining (honest):
1. Wheel arches are boxy: the opening must clear the tyre's whole bounding box, so only the top is rounded by the black ring.
2. Glass and roof edges are stepped (sculpture resolution of 1 stud x 1 plate); slopes soften only 2-plate steps.
3. The front reads as LED slit + black/dark band with blue blades; the hourglass is only suggested at 7 cells per half face.
4. No badges, number plates or door handles.
5. Trans-Black slopes on the windscreen still show slightly tan in the renders.
Scores: recognisable 7, proportion 8, structure 7, detail 6, colour 7.

## Review round 5 (coordinator pass: round arches)
Toolkit change: tyres and rims now collide as cylinders. Arches re-cut: a cell in the wheel slice (h 0..2) is removed when its
nearest point is within RT + 0.35 studs of the hub, and the arch is open straight down below the hub. The black cladding ring
follows the same curve (centre distance < RT + 1.55). Floor-line noise clamped (bottom >= 5), face pairs made robust (pair on the
layer below when a tile sits on top). PASS, 1220 parts.
Critique (compare-side.png):
1. Arches now hug the tyres and read round; the curve is stepped one plate at a time (no buyable arch fits a 5.4-stud tyre:
   1x6 arches open only 4 studs, the 1x12x3 is far too long).
2. Windscreen still a five-step staircase; rear glass and roof sides still 1-plate stairs.
3. Grille: the trapezoid reads but has no detail; no badge or number plate.
4. Bonnet sides stepped.
5. Specialty share dropped to 24%.

## Review round 6 (coordinator pass: glass, grille details)
Changes: windscreen = 3 rows of 2x2 Trans-Black 45-degree slopes (3039, 15 pcs) with Trans-Black 1x2 tiles on their stud rows,
cells under them Black; a curved-slope pass turns every 1-plate staircase (column tops t, t-1, then lower) into 1x2 curved slopes
11477 in Black or Blue (70 pcs: rear glass, roof side edges, bonnet sides); grille map rebuilt as g(y) = 4,3,3,2,2 from y 12 down
(narrow at the top, widest at the bumper) with blue blades and black intakes outside; white 1x4 number plate (2431) on a 30414
side-stud brick at the back of the grille recess; Flat Silver round badge (98138) on a jumper plate on the nose centre line.
PASS, 1206 parts, 0 errors, 0 warnings.
Critique (compare-hero.png, compare-front.png, compare-side.png):
1. Windscreen is one slanted surface now, but Trans-Black renders tan; the stud rows under the trans tiles show through from above.
2. Arches round but stepped; the black ring is thick at the bottom ends.
3. The number plate covers most of the grille, so the trapezoid is read mainly through the blue blades.
4. The badge sits on top of the nose edge (one plate over the grid), not on the vertical nose face.
5. Red corner-lamp slopes still show as small triangles on the rear flanks.
Scores: recognisable 7, proportion 8, structure 7, detail 7, colour 7.
