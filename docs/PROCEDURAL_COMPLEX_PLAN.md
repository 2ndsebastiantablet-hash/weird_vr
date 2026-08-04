# Black Checkered Complex — Modular Map Plan

## 1. Target experience

The match map is one enormous dark indoor complex built from reusable A-Frame geometry modules. It should feel like the current waiting room expanded into an unsettling survival facility: black and charcoal checkerboard floors, nearly black walls, readable white edge strips, sparse colored lights, long hallways, strange rooms, vertical spaces, and Gorilla-locomotion platforming.

It is not a traditional maze. Players should usually understand the local space, but the full complex should have loops, branches, shortcuts, upper paths, dead ends, and large landmarks that make each generated layout feel different.

## 2. Performance target

- Meta Quest Browser first.
- One generated map per four-minute match.
- Initial map size: 32–44 modules.
- Later maximum: 56 modules after performance testing.
- Initial vertical layers: ground level and one upper level.
- Every module is made from simple A-Frame primitives.
- No triangle-mesh collision.
- Dynamic lights do not cast real-time shadows.
- Decorative geometry never receives locomotion collision unless necessary.
- Identical repeated decorations should be pooled or generated from compact loops.

## 3. Grid and dimensions

- Base grid unit: 6 meters.
- Standard hallway width: 5 meters.
- Standard ceiling height: 5.5 meters.
- Standard module footprints use multiples of 6 meters.
- Main floor elevation: Y=0.
- Upper floor elevation: Y=6.
- Optional high platform elevation: Y=12, reserved for rare pieces.
- Walls are approximately 0.4–0.6 meters thick.
- Doorway clearance: at least 4.6 meters wide and 4.5 meters tall.

## 4. Connector system

Every piece owns named connectors. The generator joins compatible connector pairs and rotates the new piece so the connector positions and forward directions match.

### Horizontal connectors

- `H`: standard hallway connector, 5 meters wide.
- `HW`: wide connector, 9 meters wide, used for atriums and large rooms.
- `HN`: narrow connector, 3 meters wide, used only for optional side paths.
- `HB`: bridge connector, requires open space under the connection.

### Vertical connectors

- `UP`: exits at the upper layer.
- `DOWN`: enters from the upper layer.
- `DROP`: one-way drop to a lower floor; never used on the mandatory route.
- `CLIMB`: Gorilla-locomotion wall/shaft connection between layers.

### End connectors

- `CAP`: closes any unused horizontal connector.
- `SPECIAL_CAP`: closes a connector with a reward, landmark, hiding place, or monster spawn.

### Connector metadata

Each connector stores:

- local position
- local forward direction
- connector type
- floor level
- opening width and height
- whether it can be part of the mandatory route
- whether monsters can cross it
- minimum clear area in front of it

## 5. Piece metadata

Every module definition contains:

- `id`
- `category`
- footprint width and depth in grid units
- allowed rotations
- connectors
- generation weight
- minimum and maximum copies
- difficulty rating from 0–5
- tags such as `hall`, `room`, `platforming`, `vertical`, `landmark`, `dark`, or `safe`
- incompatible neighboring tags
- player spawn exclusions
- monster spawn points
- navigation points
- hiding points
- light sockets
- optional decoration variants

## 6. Required Phase 1 piece library

Phase 1 uses only static, dependable geometry. Rotation creates variations, so one corner piece can face any direction.

### A. Start and anchor pieces — 6

1. **Spawn Hub** — 18×18 meter room with four `H` connectors, central platform, strong lighting, and no monster spawn inside.
2. **Three-Way Spawn Hub** — alternative start with three `H` connectors and one sealed wall.
3. **Central Atrium** — 24×24 meter landmark with four `HW` connectors, pillars, lower floor, upper ledges, and multiple monster spawns.
4. **Upper Gallery Hub** — two-level landmark with two ground `H`, two upper `H`, one `UP`, and one `DOWN` connector.
5. **Void Core** — large square room with a central pit, ring path, four `H` connectors, and climbable inner walls.
6. **Final Anchor Room** — large landmark placed far from spawn to give the generated layout a recognizable opposite side; it does not end the match.

### B. Basic hallways — 12

7. **Short Straight Hall** — 6 meters long, two `H` connectors.
8. **Medium Straight Hall** — 12 meters long, two `H` connectors.
9. **Long Straight Hall** — 18 meters long, two `H` connectors.
10. **Wide Straight Hall** — two `HW` connectors with pillars along the sides.
11. **Narrow Service Hall** — two `HN` connectors; optional branches only.
12. **Left/Right Corner Hall** — two perpendicular `H` connectors.
13. **Offset S Hall** — two `H` connectors with a sideways offset.
14. **Zigzag Hall** — three short bends within one 12×12 footprint.
15. **Pillar Hall** — straight hall with climbable pillars and side cover.
16. **Windowed Hall** — straight hall with open viewing panels into adjacent empty space.
17. **Low Beam Hall** — standard clearance path with overhead visual beams; no crouching requirement.
18. **Split-Level Hall** — gentle platforms along one side while the main path stays level.

### C. Junctions and loops — 10

19. **T Junction** — three `H` connectors.
20. **Wide T Junction** — one `HW` entrance and two `H` exits.
21. **Four-Way Junction** — four `H` connectors.
22. **Offset Crossroads** — four connectors that do not meet at the exact center.
23. **Fork Junction** — one entrance and two angled-looking exits built on the square grid.
24. **Double Hall Loop** — two parallel hall lanes connected at both ends.
25. **Ring Junction** — circular-looking square ring with four exits and a blocked center.
26. **Overpass Junction** — one ground hall crosses under an upper hall without connecting.
27. **Balcony Junction** — ground T junction with an upper ledge route.
28. **Broken Crossroads** — four exits with central blocks requiring players to move around or over them.

### D. Standard rooms — 14

29. **Small Empty Room** — 12×12, two or three `H` connectors.
30. **Long Chamber** — 12×18, two opposite connectors.
31. **Square Pillar Room** — 18×18, four corner pillars, two to four connectors.
32. **Storage Block Room** — climbable boxes and several hiding lanes.
33. **Sunken Floor Room** — safe ramps down into a lower central floor and back up.
34. **Raised Ring Room** — central raised ring with space below its edges.
35. **Twin Chamber** — two connected rooms with separate external connectors.
36. **Divider Room** — several partial walls that make lanes without becoming a maze.
37. **Observation Room** — one wide window wall and a raised viewing platform.
38. **Column Forest Room** — many spaced columns suitable for chasing and evasive movement.
39. **Dark Room** — minimal light, bright floor-edge strips, and multiple exits.
40. **Emergency Light Room** — pulsing red lights and broken-looking wall sections.
41. **Checker Arena** — open combat/survival space with four exits and edge platforms.
42. **Collapsed Room** — tilted-looking block piles and one partially blocked connector.

### E. Static platforming rooms — 14

43. **Stepping Block Room** — staggered blocks across an otherwise open floor.
44. **Gap Bridge Room** — two safe floor sections connected by a wide bridge.
45. **Broken Bridge Room** — multiple bridge segments with safe fall recovery below.
46. **Wall Push Chamber** — parallel walls designed for Gorilla-style repeated side pushes.
47. **Climbing Pillar Room** — tall columns and upper ledges.
48. **Ascending Block Room** — block staircase to an upper connector.
49. **Descending Block Room** — upper entrance down to ground level.
50. **Ledge Perimeter Room** — elevated route around the outside and open center floor.
51. **Central Tower Room** — climbable central tower with upper connector.
52. **Split Height Room** — half the room at ground level and half at upper level.
53. **Monkey Launch Hall** — long hall with push walls and launch platforms.
54. **Platform Spiral Room** — square spiral of static ledges around a pillar.
55. **Pit Recovery Room** — shallow pit with walls and blocks that allow escape.
56. **Ceiling Beam Room** — upper crossing route made from broad safe beams.

### F. Vertical transition pieces — 8

57. **Ramp Up** — ground `H` to upper `H` using a wide ramp.
58. **Ramp Down** — rotation/connection counterpart to Ramp Up.
59. **Stair Block Up** — chunky climbable steps from ground to upper layer.
60. **Wall Climb Shaft** — `CLIMB` connection with opposing push walls.
61. **Platform Shaft** — staggered platforms between ground and upper layers.
62. **Open Atrium Drop** — optional `DROP` from upper floor with safe landing area.
63. **Two-Level Connector Hall** — separate ground and upper routes through one footprint.
64. **Upper Bridge Transition** — upper `HB` connection across open space.

### G. Connector caps and dead ends — 12

65. **Plain Wall Cap** — simple closed end.
66. **Short Alcove Cap** — small recess with light and hiding space.
67. **Raised Platform Cap** — dead end with a climbable lookout.
68. **Block Pile Cap** — cluttered end with evasive movement space.
69. **Darkness Cap** — nearly unlit recess, used sparingly.
70. **Floodlight Cap** — bright dead end visible from far away.
71. **Broken Door Cap** — sealed doorway visual.
72. **Void Window Cap** — large dark window looking into empty space.
73. **Monster Nest Cap** — dedicated monster spawn room; never attached directly to Spawn Hub.
74. **Supply/Objective Cap** — reserved for future pickups or objectives.
75. **Upper Balcony Cap** — upper-floor overlook.
76. **Drop Pit Cap** — optional one-way drop leading to a recovery route.

Phase 1 total: **76 module definitions**, with rotations and decoration variants producing many more visible combinations.

## 7. Phase 2 dynamic pieces

These are added only after the static generator is stable on Quest.

1. slow moving platform room
2. side-to-side moving blocks
3. rotating bridge
4. rotating wall sweeper
5. timed opening shutter hall
6. rising platform shaft
7. falling-but-resetting blocks
8. launch pad room
9. air-lift/fan shaft
10. conveyor hall
11. swinging obstacle room
12. pulsing laser-looking visual barriers that do not damage yet
13. light blackout room
14. changing wall lane room
15. rotating pillar room
16. elevator platform transition

Dynamic pieces must never appear on the only mandatory route until they are proven reliable.

## 8. Visual variants

Geometry stays structurally identical, but each piece can receive one visual kit:

- **Clean Black:** black walls, dark checker floor, white trim.
- **Purple Waiting-Room:** violet lights and purple climb blocks.
- **Emergency Red:** red strips, flickering fixtures, darker floor.
- **Cold Blue:** blue-white lighting and metallic accents.
- **Abandoned Green:** dim green lamps and grime-colored blocks.
- **Void:** almost black with bright edge outlines.

One match uses a dominant kit plus occasional accent rooms so the complex feels coherent rather than random colors everywhere.

## 9. Generation algorithm

### Step 1: Host creates the seed

The host generates a 32-bit seed and includes it in the match-start message. Every client uses the same deterministic random-number generator.

### Step 2: Build the layout graph first

Before creating A-Frame entities, generate an abstract graph:

- Spawn Hub
- mandatory main route of 12–16 modules
- one far anchor room
- 3–5 side branches
- 1–2 loops reconnecting branches
- 3–6 platforming rooms
- 1–3 vertical transitions
- remaining connectors receive caps

### Step 3: Place pieces on the grid

For every open connector:

1. collect pieces with a compatible connector
2. rotate each candidate into alignment
3. calculate its occupied grid cells
4. reject overlap, boundary violations, impossible height, or adjacency conflicts
5. use weighted random selection among valid candidates
6. reserve all occupied cells and expose the new unused connectors

### Step 4: Repair failures

If placement fails repeatedly:

- try a smaller hallway
- try a corner
- try a cap
- backtrack up to three recent placements
- regenerate from the seed with an incremented attempt number if the mandatory route cannot finish

### Step 5: Validate the graph

The generator must confirm:

- all mandatory-route modules are reachable from spawn
- no required connector is left open
- every upper area has a valid way up and down
- no player spawn is inside collision
- monster spawns are outside the Spawn Hub safety radius
- the map contains at least one loop
- platforming cannot permanently trap a player

### Step 6: Build the scene

Only after validation should the system create A-Frame entities and locomotion colliders.

## 10. Per-match composition targets

For the first playable generator:

- 1 Spawn Hub
- 1 large anchor room
- 10–14 hallways
- 4–7 junctions
- 6–9 standard rooms
- 4–6 platforming rooms
- 1–2 vertical transitions
- 4–9 caps
- total 32–44 pieces

The same piece should normally appear no more than three times, except basic straight halls, corners, and caps.

## 11. Monster support

Each module supplies local monster spawn points. The host chooses six monsters for the match and assigns their initial spawn points after the map is generated.

Spawn rules:

- no monster inside Spawn Hub
- no monster within 18 meters of player spawn
- large monsters require wide-room or wide-hall tags
- climbing monsters may use upper and vertical points
- regular monsters remain on navigation points marked as ground-accessible
- monsters should be distributed across different branches instead of clustered together

The host controls monster AI. Other players receive monster position, rotation, animation state, and important actions.

## 12. Build order

1. Remove all previous authored maps and GLB map references.
2. Add one procedural map root and deterministic seed to match state.
3. Implement connector, piece, and occupancy-grid data structures.
4. Build the first 12 essential modules: Spawn Hub, three halls, corner, T, four-way, basic room, pillar room, stepping room, ramp, and wall cap.
5. Generate and validate a 12–18 piece ground-only map.
6. Test locomotion, collision, synchronized seed generation, and Quest performance.
7. Expand to the full Phase 1 piece library in batches.
8. Add loops and branches.
9. Add upper-floor generation.
10. Add monster spawn metadata.
11. Add visual variant kits.
12. Add Phase 2 dynamic pieces only after the static system is stable.
