# Brief

**Request (user's words):** a LEGO-compatible microscale brick model of the Stadio Diego Armando Maradona (Naples), outline taken
exactly from the OpenStreetMap footprint in `ref/footprint.json` (48 x 40 studs, 6 m per stud).

**Subject (one sentence):** the elliptical concrete bowl of Naples' football stadium in Fuorigrotta, with its light-blue seats, the
blue athletics track round the pitch and the 1990 translucent roof ring hung from 28 steel pylons.

**Scale:** micro: 1 stud = 6 m, 1 plate = 2.4 m. The whole stadium is the set, so people, seats and railings are left out; seats are
read as stud texture in a pixel mix of blues and white.

**What the real thing looks like (2026):**
- Bowl about 280 x 240 m outside, pitch 105 x 68 m, an 8-lane 400 m track between pitch and stands (so the stands start far from the pitch).
- Two concrete tiers (first and second ring) rising from the track to a level outer rim around 30-35 m, plus the 1990 third ring on top
  (closed to the public, still there).
- Seats renewed for the 2019 Universiade: light blue with darker blue and white pixels.
- Roof: a translucent polycarbonate canopy ring over the upper stands, hung from 28 white L-shaped steel pylons that stand outside the bowl
  and lean their arms over the roof. The field and the lower stands are open to the sky.
- Big video screens in the curves at the two ends; floodlights along the roof edge.
- Outside: grey concrete facade with horizontal concourse bands and spiral ramps, a paved forecourt.

**Signature features (3-5):**
1. The elliptical outline (exact from OSM) and the open bowl rising evenly to a level rim.
2. Light-blue seats in a pixel pattern of blues and white, two tiers with a concourse between them.
3. Blue athletics track round a green pitch with white markings.
4. The roof ring with 28 white pylons standing outside the rim.
5. Four black screens at the ends.

**Size:** footprint 48 x 40 studs (base exactly 48 x 40) · rim ~14 plates above the base, roof top ~18, pylon arms ~20 · target
1,300-1,900 parts (hard limit 2,000).

**Palette (4-8):** main Light Bluish Gray (concrete) · secondary Medium Azure / Dark Azure / Medium Blue / White (seats) · Sand Blue (track) ·
Green + Bright Green (pitch stripes) · accents White (pylons, lines), Black (screens), Trans Clear (roof). Base Dark Bluish Gray (asphalt).

**Out on purpose:** the spiral ramps as separate towers (too fine at 6 m/stud; suggested by facade bands), seats and railings, people,
goals, the surrounding streets and the Mostra d'Oltremare. The third ring is not split off as its own tier: it is the steeper top band
of the upper stands, in a darker seat mix.

**Method:** build.mjs reads `ref/footprint.json`; for every 'S' cell it measures the distance to the track and to the outside and turns the
ratio into a height (lower tier, concourse, upper tier, rim), so the outline and the tiers follow the real plan. Coloured surfaces are
packed with a custom packer that only uses sizes that exist in that colour (checked against the pinned availability data).

## Review log
| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 1 | 7 | 7 | 7 | 5 | 7 | 5 | see critique round 1 |

### Round 1 critique (1,503 parts, PASS)
Looked at out/hero.png and out/sheet.png.
1. The base around the bowl is bare Dark Bluish Gray studs on all four sides: the set looks unfinished, no setting (Composition).
2. The outer wall between the pylons is plain grey with two dark bands, nothing at ground level; from the front and back views it reads
   as a grey drum (Detail capped at 5).
3. Track plus apron is one big flat Sand Blue area with no markings; from the hero angle it reads as a lavender puddle round the pitch.
4. Only 2 of the 4 screens were placed (the search wanted seats of 13 plates or lower under fixed rows), and only 25 of 28 pylons:
   on the right the bowl touches the edge of the plan, so there is no outside cell for a pylon there.
5. Each pylon starts with a white 1x1 round brick and round plate under the antenna mast: it reads as a street lamp with a fat foot.
6. The roof's inner edge is ragged (1-stud teeth) and the Trans Clear tiles almost disappear, so the roof reads as a thin white ring.
7. Specialty parts only 19% (good sets 25-50%).
Fixes made: paved forecourt ring (Light Bluish Gray tiles) and trees (green cones) in the corners of the plot; grille-brick gallery
band on the facade; dark grey apron round the track and a white finish line; screens placed by searching the inner edge of the roof
in each half of each curve; pylons fall back to the nearest outside cell, then to the rim cell itself (28 now); concrete-grey footings.
| 2 | 8 | 8 | 7 | 6 | 7 | 7 | see critique round 2 |

### Round 2 critique (1,806 parts, PASS, 28% specialty)
Looked at out/hero.png and out/sheet.png again after the round 1 fixes.
1. The roof reads as solid white, not as a translucent canopy: the Trans Clear tiles sit on White plates, so the whole ring looks milky
   and heavy, and from the hero angle it hides most of the front stand.
2. The inner edge of the roof is still ragged with 1-stud steps even after smoothing.
3. The centre circle is four 1x1 round tiles round the halfway line: it reads as a white four-leaf clover, not a circle.
4. Track: still one flat Sand Blue band (renders lavender) with only a finish line; acceptable since the real track is plain blue,
   but it is the largest single-colour area of the model.
5. Two pylons on the right are set into the outer wall (the bowl touches the edge of the plan there); they had left 1-stud slots
   in the facade. Fixed this round with solid round-brick columns.
6. The tiers do read now: dark walkway behind the moat, grey concourse, and a row of cheese slopes in front of the darker third ring.
   The cheese-slope front row on the upper tier too was tried (1,907 parts) and dropped to stay well under 2,000.
7. Lower facade between the dark plinth and the grille gallery band is plain grey, but no blank stretch is wider than ~5 studs
   because of the pylons.
Next: translucent roof (Trans Clear plates under the canopy, white only over the outer wall), a proper centre circle, camera a little
higher so the bowl shows more than the facade.
| 3 | 8 | 8 | 7 | 7 | 7 | 7 | see critique round 3 |

### Round 3 critique (1,813 parts, PASS, 28% specialty, 0 warnings)
Changes since round 2: roof plates are Trans Clear now (only the ring beam over the outer wall is white), the centre circle is four
quarter-round tiles turned outwards, camera raised to 44 degrees.
1. The roof finally reads as a translucent canopy: the upper stands show through it and the white ring beam plus pylon arms carry the
   structure. Its inner edge still steps in 1-stud stairs on the diagonals, which no plate layout can avoid at this scale.
2. The roof is only ~3 studs (18 m) deep; the real canopy reaches further over the second ring. Deeper would push the part count past
   ~1,950, so it stays.
3. The pylons are 1x1 antenna masts with a 3-stud arm on top: the ring of 28 reads well from every side, but the L shape is weak in the
   side views (they look like lamp posts with caps). Two of them stand in the outer wall on the east side because the OSM outline
   reaches the edge of the 48-stud plan there.
4. The facade is still repetitive: dark plinth, plain grey, grille gallery band, grey. The spiral ramps of the real exterior are left
   out; the pylons give the rhythm.
5. Seats: the pixel mix reads as the 2019 light-blue seating, but the patches are random 2-stud runs, not a designed pattern.
6. Track: one flat Sand Blue surface with a white finish line; true to the plain blue track, but it is the dullest area in the hero.
7. Centre circle now reads as a circle; penalty areas are 2 x 6 studs, which is slightly large but legible.
All rows are at 7 or above; this is the last review round allowed by the guide, delivered with the weak points above.

## Redesign from real photos (ref/aerial-napoli-user.png, ref/commons-*.jpg)
The first version was built from text only and the user compared it with photos: it did not look like the stadium. What the photos show,
and what was wrong in v1:
- From above the stadium is dominated by a huge OPAQUE GREY roof ring with radial panels, covering the outer ~55% of the bowl.
  v1 had a narrow white / translucent ring. Only the lower bowl is visible, in deep blues (Blue, Dark Blue, Medium Blue, some white)
  with NAPOLI spelled in white on the long stand. v1 had light cyan (Medium Azure) confetti.
- From outside: grey concrete ring beam over a dark, open undercroft with concrete frames, and 28 dark grey steel lattice pylons rising
  from the ground to the roof edge. v1 had white antenna masts and a closed grey drum.
- Pitch darker green, track medium blue, narrow grey apron.
New section: open lower bowl (u < 0.55) rising from the track to plate 9; everything beyond sits under the roof at plate 15 (hidden
tiers are grey support only, no seats); the first ring under the roof edge is the upper tier in shade (Dark Blue) with floodlights
(Trans Clear 1x1 round plates) and four black screens in the curves; outer wall = Black undercroft, Light Bluish Gray ring beam, Dark
Bluish Gray grille-brick steel band; pylons = 2-stud towers of Dark Bluish Gray Technic bricks with holes (1x1 round bricks where only
one stud is free); roof = Light Bluish Gray plates, tiles on top with a Dark Bluish Gray radial rib per bay and quarter-round tiles on
the stair corners of both edges.

| round | recognisable | proportion | structure | detail | colour | composition | notes |
|---|---|---|---|---|---|---|---|
| 4 | 7 | 8 | 7 | 7 | 8 | 7 | first redesign render, compared with the aerial and the August 2025 exterior photo |

### Round 4 critique (1,918 parts, PASS, 34% specialty)
Compared out/compare.png (aerial vs hero) and the front view against the August 2025 exterior photo.
1. Hero vs aerial: the big grey roof ring, the blue lower bowl and the dark band under the roof edge now match the photo's reading.
2. NAPOLI is there but hard to read: the letters sit on five stepped rows of different heights, and where a row uses a seat brick the
   white front face smears the letter downwards. Calmed the seats round the letters to Blue/Dark Blue only, which helped.
3. The first roof try (56 alternating stripes) made a zig-zag zebra; changed to light panels with one darker rib per bay, closer to the photo.
4. The shaded band under the roof is one flat Dark Blue wall; in the photo the upper seats in shade still show blue pixels.
5. Exterior: Black undercroft, grey ring beam, grille band and the 2-stud pylons read like the photo from the front, but the pylons are
   solid columns with round holes, not X-braced lattice (no buyable 1x1 or 1x2 part gives X-bracing at this size).
6. Inner roof edge still steps on the diagonals; quarter-round tiles soften the stair corners but it is not a clean ellipse.
7. 1,918 parts: little room left for more.
| 5 | 8 | 8 | 7 | 7 | 8 | 7 | shade band pixels, asphalt forecourt, camera turned to face the main stand like the aerial |

### Round 5 critique (1,925 parts, PASS, 31% specialty)
Changes: Blue pixels in the shaded upper-tier band (in the photo the seats under the roof still show blue), the paving ring removed
(the real forecourt is dark asphalt parking, so the Dark Bluish Gray base stays as it is, with a grey kerb only along the front),
hero camera moved to [12, 40] so it looks at the main stand head on, like the aerial photo.
1. Side by side with the aerial the composition now matches: grey roof ring, dark band under its edge, blue bowl, NAPOLI facing the
   camera, green pitch on a blue track.
2. NAPOLI reads, but the A (pointed top on a 3-stud grid) looks like an H next to the N; the letters also stretch downwards where a
   letter cell is a seat brick. Changing the A to a square top.
3. The track renders lighter than in the photos (Medium Blue); the darker Blue would merge with the seats, so it stays.
4. The roof's radial ribs come out as short dark dashes on the diagonals because each rib is a 1-stud angular bin on a stud grid.
5. The roof inner edge is still a stepped ellipse (softened by quarter-round tiles), and so is the outer rim.
6. The pitch markings are heavy (1 stud = 6 m makes every line 6 m wide); the centre circle reads as a white disc.
7. Part count 1,925 of 2,000: no room left for a deeper roof truss or real X-braced pylons.
| 6 | 8 | 8 | 7 | 7 | 8 | 7 | A with a square top; final |

### Round 6 critique (1,925 parts, PASS, 0 warnings, 31% specialty)
Looked at out/sheet.png (all six views) and out/compare.png again.
1. Top and hero views: NAPOLI now reads letter by letter (square-topped A no longer looks like an H); a stray white seat pixel just left
   of the N still makes it look like "INAPOLI" from straight above.
2. Front/back/side views against the exterior photos: Black undercroft, grey ring beam, grille steel band and 28 dark pylons rising
   above the roof edge give the right rhythm. The pylons are solid 2-stud towers with round holes, not X-braced lattice.
3. The roof is the dominant grey ring as in the aerial, but its top is busy: light panels, dark rib dashes and quarter-round corners
   make it look lumpy rather than one smooth sloping surface; the real roof also slopes slightly inward, this one is flat.
4. Edges: outer rim and roof inner edge are stud-stepped ellipses; quarter-round tiles soften only the convex corners.
5. Track renders as a light blue (Medium Blue), lighter than the real track; pitch markings are 1 stud (6 m) wide.
6. Under the roof the hidden tiers are plain grey support (no seats), which is invisible in all views.
Delivered with these weak points.
| 7 | 8 | 8 | 7 | 7 | 8 | 7 | coordinator review: letters, roof ribs, slender pylons |
| 8 | 8 | 8 | 7 | 7 | 8 | 7 | final: 1,894 parts, PASS, 0 warnings, 28% specialty |

### Round 7 critique (after coordinator review of round 6)
1. The lettering read "HHPOLI": each column took its own five open rows, so where the roof edge curves forward the left columns of the
   N and A shifted rows and broke apart; and a 4-wide N on 5 rows only had a diagonal in two rows. Fix: one fixed set of five rows for
   the whole word (the roof edge is pulled back over the lettering so all five rows are open), a 5-wide N with a full diagonal, square
   A, no tall seat bricks under the letters (their faces smeared the strokes), Blue tiles behind the letters.
2. Roof: the 1/112 angular bins made blobs and zig-zags. Now 28 thin Dark Bluish Gray ribs traced as 1-stud lines from the centre
   outwards across the Light Bluish Gray tiles; the top is fully tiled.
3. Pylons were fat 2-stud Technic towers in a light grey that read as square columns. Now 28 slender 1x1 Dark Bluish Gray masts
   (round bricks) evenly spaced along the perimeter, just outside the facade, rising 2 plates above the roof.
### Round 8 critique (final, compared top view with the aerial and front view with the August 2025 exterior photo)
1. NAPOLI now reads letter for letter from the top and from the hero angle.
2. Roof ring with ribs reads like the aerial; the inner edge and the outer rim are still stud-stepped ellipses, only softened by
   quarter-round tiles on the convex corners. No wedge plates were added: every extra part pushes past the 2,000 limit.
3. Pylons are plain round-brick masts, not X-braced lattice; three of the 28 stand in the outer wall on the east side where the OSM
   outline reaches the edge of the plan.
4. Track renders light blue (Medium Blue); the apron is a 1-stud Light Bluish Gray band plus the grey walkway in front of the first row.
5. Pitch lines are 1 stud (6 m) wide; centre circle is a white disc of four quarter-round tiles.
