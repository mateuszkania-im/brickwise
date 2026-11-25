# Brief

**Request (user's words):** a brick model of the 2nd-generation Toyota C-HR (2024+) that clearly reads as a C-HR. The earlier
attempts (343, 983, 1206 parts) were judged terrible: they sat low like a sedan, the glass rendered beige with the seats showing,
the windscreen was a shallow ladder of trans plates, the front was a blob of blue with random black pixels, the sides were full of
blue/black pixel noise and the rear light bar was hard to see. Lights matter most: the thin LED blade at the bonnet edge hooking
into a boomerang at the corners, and the full-width red bar at the back. Cost and part count are secondary to fidelity.

**Subject:** the user's blue C-HR with a black roof (ref/chr-front34.png), standing on its own wheels, display scale.

**Scale:** about 1:16, set by the wheels. The biggest road wheel in the catalogue (56145 rim + 44309 tyre, 43.2 mm) is the real
720 mm wheel, so 1 stud = 128 mm: 34 studs long, 14 wide (16 over the mirrors), 31 plates tall, wheelbase 21 studs, ground
clearance 4 plates. The sculpture example put the same wheels under a 36-stud body; here body and wheels share one scale.

**Reference:** side and front photos with a stud/plate grid laid over them (measured, not guessed):
roof 31 plates over z 9..16, windscreen from 23 plates at z 23 to 29 at z 18, bonnet 23 -> 20 at the nose, beltline 22 kicking up to
25 under the C-pillar, tail light bar at 20, rear glass 21 -> 27 under a spoiler, sills from 4 to 6, front axle 6.7 studs behind
the nose, rear axle 6 studs from the tail. Front: lamps at 16..18 on the outer 5 studs, grille 7..11, number plate 8..10.

**Signature features (priority order):**
1. Lights: thin white LED blade right under the bonnet edge falling to an inner point, closing a boomerang with the lower LED line;
   a dark crease ties both lamps across the face. Rear: full-width red bar under the rear glass, hooking down at the corners and
   wrapping onto the sides.
2. Crossover stance: big wheels (13.5 of 31 plates), visible ground clearance, tall body side, short glasshouse.
3. Two-tone: blue body, black roof, pillars and spoiler, black arch mouldings standing proud of the body, black sills and bumpers.
4. Hammerhead face: blue band under the lamps with blue legs down to the bumper, black C corners, recessed trapezoid grille,
   white number plate, silver badge.
5. Coupe roofline: steep trapezoid windscreen, roof peak over the front doors, raked rear glass under a spoiler; tumblehome.

**Palette:** Blue (body, tailgate), Black (roof, pillars, spoiler, cladding, bumpers), Dark Blue (glass, see below), White (LED
blades, number plates), Trans-Clear (LED projector dots), Red (rear bar), Flat Silver (rims, badges), Light Bluish Gray (rear trim).

**Glass:** solid Dark Blue. Trans-Black renders light brown in this viewer (and shows whatever is behind it), and the 33-degree
slopes the windscreen needs are not made in Trans-Black. Dark Blue reads as the near-black tinted glass of the real car, keeps the
glass distinct from the black pillars, and hides the cabin.

**Out on purpose:** interior, door handles (flush, body colour on the real car), wipers, shark-fin aerial, lettering.

## How it is built
build.mjs draws the shape as straight lines in studs and plates (profiles per column, no mesh grid), paints it by region, keeps a
shell three cells thick round the wheel wells and two elsewhere, tiles every exposed top and puts real parts over it: 33-degree
slopes for the windscreen (two courses, the upper one narrower) and the rear glass, 1-wide 33-degree slopes for the A and C
pillars, curved slopes on the bonnet and roof edges, Technic bricks + axles + 56145/44309 wheels, SNOT bricks with 1x4 tiles for
both number plates, plates for the spoiler.

## Review log

### Round 1 (1,297 parts, PASS) - first detailed build at the new scale
1. Side glass renders beige and you look into the box behind it (Trans-Black), the same fault as before.
2. Windscreen is a black two-step band, the roof a long flat lid running all the way to the tail: estate, not coupe.
3. Front grille in Dark Bluish Gray reads as a grey box; the K/S/G columns give black teeth: the "random pixels" again.
4. Lamps: a 4-plate white block at each corner (the corner column and its wrap were all white).
5. Arch mouldings are thick black blobs (two-plate ring plus a corner intake rule), jagged against the blue.
6. Spoiler plates show studs; rear number plate one stud off centre, its last stud bare.
Scores: recognisable 4, proportion 7, structure 7, detail 4, colour 4, composition 5.
Fixes: glass in Dark Blue; grille back black; even one-cell arch moulding; corner intake rule dropped; cowl blue up to the screen;
spoiler tiled and narrowed; rear glass raked from the light bar to the spoiler; mirrored hero to the photo's angle.

### Round 2 (1,235 parts, PASS)
1. Glass now dark and reads as glass; side profile against chr-side.jpg is within a plate of the photo everywhere.
2. Roof still 12 studs wide over a 14-stud body: no tumblehome, the glasshouse looks like a box.
3. Windscreen the same width top and bottom.
4. Lamps are two parallel white dashes; the blade does not fall towards the centre.
5. Rear light bar reads as a dotted line (black studs seen through the Trans-Red tiles) and is too thin from behind.
6. Hero camera at 12 degrees still looks down on the car and makes it look low.
Scores: recognisable 6, proportion 7, structure 7, detail 5, colour 7, composition 6.
Fixes: two-step tumblehome (glass at h 1 up to 25 plates, h 2 above, roof 10 wide); trapezoid windscreen (upper course one stud
narrower each side); lamp redrawn as a 3-plate wedge: blade falling from the corner to an inner point on the lower LED line, a black
crease across the centre; bar on solid red plates; camera at 7 degrees.

### Round 3 (1,236 parts, PASS)
1. Front now reads as the C-HR face from the 3/4 view: slim white boomerangs at the corners joined by the dark crease, blue band
   with the badge, blue legs down to the bumper, black C corners, recessed grille with the plate.
2. Rear: bright full-width bar with hooks and side wraps, reflectors, U-shaped diffuser trim, plate centred.
3. Arch mouldings are clean one-cell bands, but still a plate-by-plate staircase round the curve (no buyable arch fits a
   5.4-stud tyre).
4. Rear quarter ledges (tumblehome steps) show as stacked steps from behind.
5. Body sides are large plain blue areas; the real door has a deep diagonal sculpt that bricks cannot show at this scale.
6. Bonnet is a set of 1-plate tiled steps (lines across the bonnet), not a smooth dome.
Scores: recognisable 7, proportion 8, structure 8, detail 6, colour 8, composition 7.
Fixes: face redrawn as the real hammerhead (outer column black, blue legs one stud in, black frame, grille); bonnet drops two
plates behind the front axle through a row of curved slopes (a raised rear half like the real bonnet's power bulge); bi-tone
boundary on the side made a diagonal in three steps from the C-pillar point to the rear arch.

### Round 4 (1,256 parts, PASS) - final
1. Front 3/4 (hero) now reads as a C-HR: slim white boomerang lamps high at the corners joined by the dark crease, blue hammerhead
   with legs to the bumper, black C corners, dark grille with the plate, badge; big wheels with clearance under the sills.
2. Rear: bright full-width red bar right under the raked rear glass, hooks at the corners, wraps onto the sides; plate, badge,
   reflectors, U trim. From behind it is still a flat black wall (the real tailgate is rounded and sculpted).
3. Side matches chr-side.jpg within a plate: wedge bonnet, raked screen, roof peak over the front doors, kick-up of the rear
   window into the black C-pillar, black rear quarter. Arch mouldings are a staircase of plates round the curve.
4. Bonnet sides and roof edges are curved slopes; the bonnet top is still a few tiled steps.
5. Front corner ahead of the front wheel is black from the lamp down (corner frame + arch moulding meet), a bit heavier than the
   photo, where the wing is body colour down to the bumper.
6. Specialty share 18% (the shell is plates and tiles by design; the checker warns under 25%).
Scores: recognisable 7, proportion 8, structure 8, detail 6, colour 8, composition 7.

### Round 5 (1,290 parts, PASS) - after review: lights, nose depth, rear, arches, doors
Review notes (coordinator, against chr-front34.png): each headlight read as two thick white bars with a black bar between, a
cartoon face; the face was a flat wall; the rear a flat black wall; arches still plate staircases; no door crease.
Changes:
1. Headlight rebuilt the way the real one is laid out: one thin white blade (a single plate edge, the thinnest a brick face can
   be) along the bonnet edge from the corner, stepping down to its inner point; under it a recessed black lamp housing (1x4 brick
   with side studs, one stud back) carrying four Trans-Clear 1x1 round tiles, the LED projectors. The second white line and the
   crease across the face are gone.
2. Nose shaped in depth: the centre of the bonnet rolls forward over the face (a row of curved slopes), the blade tucked under its
   edge; the lamp housings and the grille are recessed a stud; thin blue fangs run diagonally down and out from under the lamps
   to the bumper, black C corners outside them, a hexagonal grille (narrow top and bottom) inside with the plate.
3. Rear: tailgate blue like the user's car, recessed one stud under the light bar; the bar is a single plate of red, tiled on top
   so it also reads from above, hooking down at the corners and wrapping onto the sides; rear glass moved one stud in so the bar
   is a lip under it; the roof end rolls into the spoiler with curved slopes.
4. Arches: black mouldings that stand one plate proud of the body, on side-stud bricks: a band of 1x1 tiles over the crown and a
   2x2 corner-round tile at each shoulder, so the opening reads round; wheel-well walls dark.
5. Doors: the lower doors stand one plate proud (blue 1x4 tiles on side-stud bricks), the top edge stepping up towards the rear:
   the C-HR's rising lower-door sculpt, done as one step so it stays a clean line, not noise.
Critique after round 5:
1. Front 3/4: the blade + four projector dots + recessed housing now read as the C-HR lamp; the dots are a bit big (a round tile
   is one stud across), so the lamp reads slightly "row of spotlights".
2. Front straight on: still blocky; the fangs are short blue blocks at this resolution, the grille is a dark slot, not a mesh.
3. Rear 3/4: the thin red bar with corner wraps is the clearest C-HR cue from behind; rear glass, spoiler and tailgate read right.
4. Side: proud round arch mouldings fix the worst staircase; the door sculpt is a single step, a hint rather than the real
   diagonal; the bonnet top is still tiled steps.
5. Roof and C-pillar are a little slab-like from above; no shark-fin aerial.
Scores: recognisable 8, proportion 8, structure 8, detail 7, colour 8, composition 7.

### Round 6 (1,297 parts, PASS) - front lights and fangs
Review notes: the four round Trans-Clear tiles read as a row of round spotlights; the blade was a straight strip of equal
thickness; the fangs were blocks.
Changes:
1. Round tiles and the side-stud housing removed. The lamp housing is now a slim black recess one stud deep with flat 1x1
   Trans-Clear plate segments (alternating with black), so the LEDs read as small flat dashes, not lamps.
2. The curved-slope roll of the bonnet edge now spans the whole nose (x 2..13); the white blade sits right under it and tapers:
   two plates thick at the outer corner (wrapping onto the wing), one plate running in to its inner point.
3. Fangs: a one-stud blue blade stepping diagonally from under the lamp's inner end down and out to the bumper corner; the black C
   corner also wraps onto the side, so the corner is clean black instead of a blue/black mix.
4. compare-front / front34 / side / rear / rear34 regenerated against the photos.
Critique after round 6:
1. Front 3/4 now reads as the C-HR face: thin white blade under the bonnet edge, thicker at the corner, dark slim lamp, blue
   band with the badge, diagonal fangs, dark grille with the plate.
2. The blade still steps rather than slopes (plate resolution), and the fang is a staircase of single studs.
3. A one-stud flat corner of the bonnet shows next to the rolled edge at each corner.
4. The grille is plain dark (no mesh); a mesh in SNOT would cost a lot of depth at this size.
Scores: recognisable 8, proportion 8, structure 8, detail 7, colour 8, composition 7.
