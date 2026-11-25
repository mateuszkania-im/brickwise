# Brief

**Request (user's words):** a large-scale (about 1:15) brick model of the 2025 Toyota C-HR that is clearly recognisable, built from a
voxel grid of a real 3D mesh as ground truth, refined with slopes, curves, wedges and SNOT tiles. Blue GR Sport with a black roof.

**Subject (one sentence):** a 2nd-generation Toyota C-HR coupe-crossover in Blue with a black roof, pillars and cladding, as a
large display model standing on its own wheels.

**Scale:** display scale, 36 studs long x 15 studs wide (body; 17 over the mirrors) x 32 plates tall = about 1:15
(4362 / 288 mm = 15.1). One stud = 121 mm of real car, one plate = 48 mm.

**Reference:** L 4362 · W 1832 · H 1564 · wheelbase 2640 · wheel ~720 mm.
At 1:15: L 36 studs, W 15.1, H 32.3 plates, wheelbase 21.8 studs, wheel 48 mm (15 plates).
Ground truth `ref/chr-grid-36.json` (layers[y][row][gx], 36 x 18 x 33). Orientation (verified on the 24-stud build): front of the
car at gx = 35, tailgate at gx = 0. Mapping: gx -> forge z, row -> forge x (rows 1..15 are the body; rows 0 / 16 hold only the
mirrors), y -> y. Rows r and 16 - r are symmetrised.

What the grid says (centre rows):
- roof 32 plates over gx 8-16, 31 at gx 6-7 and 17-19, windscreen falling 30 -> 23 over gx 20-26, bonnet 22 at gx 27-29 falling
  to 17 at the nose (gx 35); the bonnet wings (rows 2 / 14) sit about one plate above the bonnet centre;
- tail: 26 at gx 0-1 (spoiler), rear glass rising 27 -> 31 over gx 2-6;
- shoulder (rows 2 / 14) at 25 plates, glass rows 3 / 13 at 29-30 (tumblehome), roof rows 4-12;
- mirrors at gx 22, 23-25 plates; body bottom about 6 plates; wheels at gx 4-9 and 25-31.

Photos measured (chr-side, chr-front): beltline at about 70 % of the height (22-23 plates), glasshouse about 9 plates; the LED
headlight slit sits at 19-20 plates across the outer 3.5 studs and hooks down to about 15 at its inner end; the Toyota badge sits
on the bonnet lip at about 16 plates; the hexagon grille spans 6-13 plates and most of the width; number plate 8-10.5 plates.

**Signature features (in priority order):**
1. Side profile: high beltline, glasshouse about a third of the body height, roof peak over the front door with a long falling
   roofline to a spoiler; rear side window ending in a sharp upward point.
2. Hammerhead front: body-colour blades forming a sideways C either side, thin LED slit under the bonnet edge hooking down into a
   C, big dark hexagon-mesh grille with a centre plate, Toyota badge.
3. One continuous black cladding band (arches, sills, bumpers); black roof, pillars and mirrors; Blue body; dark glass with
   smooth dark surfaces (tiles) behind it.
4. Rounded roof edges (curved slopes along the roof sides), smooth tiled tops (no studs on the body).
5. Road wheels: the largest road rim + tyre in the catalogue, on Technic axles through Technic brick holes.

**Wheels:** the catalogue had only the off-road 56891 tyre for the big 56145 rim. Baked the 44309 "Tyre 43.2 x 22 ZR" (LDraw
"Tyre 22/ 30 x 30 ZR", a low-profile street tyre made for exactly this 30.4 mm rim, Black in 104 sets) into the toolkit
catalogue and the brickwise part map: 43.2 mm across against the 48 mm the scale asks for, and it reads as a road tyre.
Rim 56145 in Flat Silver. Each wheel: Technic brick 3700 in the floor, Technic axle 3 through its hole and the rim.

**Size:** 36 x 15 studs (17 over the mirrors) · 32 plates · target 900-1,600 parts (hard limit 2,000).

**Palette:** main Blue · secondary Black (roof, pillars, cladding, grille, mirrors) · Trans-Black (glass) · accents Trans-Clear
(LED), Trans-Red (rear light bar), Flat Silver (rims, badges), White (number plates).

**Out on purpose:** interior (a dark cabin box behind the glass only), opening doors, lettering, the shark-fin antenna.

## Review log

### Blockout
Every symmetrised grid cell as a plate, hollow (688 parts, no wheels). Side silhouette checked against chr-side.jpg: the low end is
the nose, roof highest over the middle, tail high, so front = gx 35 holds. The grid is noisy at the outer rows (1 / 15) and the
shoulder, so the detailed build reads its heights as profiles instead of copying cells.

### Round 1 (1,169 parts, PASS) - compare-side / compare-front34 / compare-front / sheet
1. Glasshouse far too thin: beltline at 23 plates gives a 6-plate window slit (19 % of the height); in the photo the glass is
   about a quarter of the height and the car looks like an estate, not a coupe-crossover.
2. Roof runs flat almost to the tail and the rear glass is a short 4-stud drop right at the end: no "long falling roofline", it
   reads as a shooting brake. The grid falls 31 -> 26 over gx 7..1.
3. Front does not read as a hammerhead: the LED is three dots per side, the blue band over the grille is a large plain area, and
   the grille is a narrow band of studs. The blade / C-intake structure is missing; the face is stepped back at the corners so
   nothing lines up.
4. Tailgate is a 13 x 12 blank blue wall over a 9-plate black bumper; only the plate and badge break it.
5. Mirrors sit on long arms and stick out like handles.
6. Side character line steps read as a staircase across the doors (acceptable as the sculpting, but busy).
7. Rear glass curves render almost white from straight behind (specular), as on the small build.
Fixes: beltline down to 21 (glass 21..28, 8 plates); roof peak kept over the front door, rear glass now a 4-stud curve plus a
2-stud curve from the spoiler (z 6) to the light bar, spoiler one plate proud; front face flat across (z 35) from h 2 inward,
redrawn from chr-front.jpg: black C intakes at the corners up to the lamps, a blue blade falling from the inner lamp end to the
bumper, a taller grille (y 7..12), a 2-plate LED slit that wraps onto the side and hooks down; rear bumper lowered to 10 plates with
a light grey trim line; mirrors moved down to the new beltline.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 1 | 5 | 5 | 7 | 5 | 7 | 6 | estate-like glasshouse, front unreadable |

### Round 2 (1,237 parts, PASS)
1. Glasshouse now reads right on the front door (8 plates), but the roof is still one flat slab with a single step at z 12/13:
   the "roof peak over the front door, long fall to the spoiler" is not there.
2. Rear side window has a flat bottom edge and stops square: no sharp upward point.
3. Black bumper corner runs 4 studs along the side in front of the front wheel (z 30..33): from the side and in the hero view the
   nose looks black and heavy; the real C intake is only visible on the corner.
4. Front: the LED hook is a 3-plate block that reads as a square lamp; the blade/intake/grille layout is now there and readable.
5. Tailgate still mostly a blank blue wall; the number plate floats on blue with nothing round it.
6. Rear glass curves still render near-white from behind (renderer specular on black curves; nothing to fix in parts).
Fixes: roof falls 32 (z 15..20) -> 31 (z 10..14) -> 30 (z 8..9) with the spoiler lip at 31; the rear door window lower edge rises
21 -> 22 -> 23 -> 24 -> 25 towards the C-pillar under the falling roof, so the window closes in a point; front bumper corner black
only on the corner (z 32..33); LED hook cut to 2 plates; black recess round the rear plate; rear light bar and boot one plate lower
so the rear glass is a longer, flatter fall.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 2 | 6 | 6 | 7 | 5 | 7 | 6 | glasshouse right, roof still flat, front readable |

### Round 3 (1,258 parts, PASS)
1. Front corners: the face was stepped (h 1 at z 34, h 2 at z 35) and the raised wing curves stuck out past the nose like two
   rails with a black slot between them: the front read as a hot rod, not a C-HR.
2. Black corner intakes ran full height (4..15) and two studs wide: two black pillars framing a small face.
3. The grille looked small under a tall plain blue bar.
4. Side: roof now falls 32 -> 31 -> 30 to the spoiler and the rear door window closes in a point; the roof steps are visible as
   1-plate stairs (accepted: a smooth fall needs half-plate offsets).
5. Front fender top (20) sat 3 plates under the bonnet wing (23) as a separate rail.
6. Structure: 1,258 parts, mostly 1-plate layers; specialty share only 19-20 %.
Fixes: face flat across from h 1 to h 7 (z 35); wings keep the one-plate crease all the way down with their own 2x1 + 4x1 curves;
fender step softened with cheese slopes facing out; the face redrawn as the C-HR "arrow": LED slit slanting in and down to a
hook, a body-colour stroke under the lamp and the blade under it, a black triangular intake pointing inwards between them; the
grille gets a black frame row (13) so it reads taller; stacked same-colour plates in the shell become bricks (1,258 -> 987 parts,
specialty 25 %); a black roof bow at the B-pillar carries the roof between its two levels.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 3 | 6 | 7 | 7 | 6 | 7 | 7 | profile right, front still heavy |

### Round 4 (987 -> 983 parts, PASS)
1. Side: the roof ran on to z 7 with a short rear glass, but the photo has the spoiler 9 studs from the tail, a long rear glass and
   a huge black C-pillar with the rear door window ending around z 10. The car still read as a short-tailed hatch.
2. The front door glass stopped square at z 20 under the A-pillar: the real window runs forward under the A-pillar into a point.
3. Front (compare-front): the arrow face, LED hook and framed grille now read as the C-HR; the face is still busier and squarer
   than the real one (1-plate steps on the diagonals).
4. Mirrors on 3-stud arms read as black flags standing off the car.
5. Rear: tailgate corners plain blue down to a straight bumper; the real rear bumper sweeps up at the corners.
6. Specialty share 24-25 % after the brick merge (plain bricks now carry the shell).
Fixes: spoiler moved to z 8..9 (one plate proud), rear glass two 4-stud curves from 30 plates at z 8 down to 24 at z 1, cabin and
rear door glass shortened (z 10..13) so the rear window closes in a sharp point in a big black C-pillar; front quarter glass
under the A-pillar (z 21..23, top edge stepping down with the pillar); mirrors on a 1-stud arm, the head one stud proud of the set-in
upper door; rear bumper black sweeps up 3 plates at the corners.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 4 | 7 | 7 | 7 | 6 | 7 | 7 | fastback profile and C-pillar right, arrow face reads |

### Round 5 (983 parts, PASS) - final check, compare-side / -front34 / -front / -rear / -rear34
1. Side profile now matches the photo's masses: high beltline (21 plates), 8-plate glass band, roof peak over the front door,
   spoiler 9 studs from the tail, long rear glass, rear window closing in a point inside a big black C-pillar.
2. Front: arrow face, slanted LED hooking down, framed grille, plate and badge all read; the diagonals are 1-plate steps, so the
   face is squarer and busier than the real, smoothly sculpted one.
3. The roof falls in 1-plate steps (32 / 31 / spoiler) instead of a continuous curve; the windscreen is a staircase of cheese
   slopes that reads as glass but shows its grid.
4. The doors are large plain blue panels (no shut lines or flush handles); the side sculpting is a stepped character line.
5. Rear glass curves render near-white from straight behind (renderer specular on black curved slopes).
6. Tyres sit one stud inside the arches (the checker treats a wheel as a box, so the round arch has to stay outboard of it).
No further structural changes this round.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 5 | 7 | 7 | 7 | 6 | 7 | 7 | delivered; remaining differences listed above |
