# WEIRD VR

A static A-Frame WebXR multiplayer survival prototype for Meta Quest Browser.

## Features

- Gorilla Tag-style hand locomotion
- PeerJS/WebRTC multiplayer for up to eight players
- public and private room codes
- host-controlled four-minute matches
- late joiners wait in the lobby until the next match
- one deterministic procedural Black Checkered Complex per match
- generated navigation points and future monster spawn positions
- no package manager, bundler, or build step

## Procedural Black Checkered Complex

The host creates an eight-character map seed and sends it with the match-start state. Every participating client rebuilds the same layout locally, so the map does not need to be streamed through WebRTC.

The generator now has **24 modular pieces**.

### First batch

1. Spawn Hub
2. Short Straight Hall
3. Medium Straight Hall
4. Long Straight Hall
5. Corner Hall
6. T Junction
7. Four-Way Junction
8. Small Empty Room
9. Square Pillar Room
10. Stepping Block Room
11. Ramp Up
12. Plain Wall Cap

### Second batch

13. Offset S Hall
14. Zigzag Hall
15. Pillar Hall
16. Windowed Hall
17. Low Beam Hall
18. Split-Level Hall
19. Wide T Junction
20. Offset Crossroads
21. Fork Junction
22. Double Hall Loop
23. Ring Junction
24. Broken Crossroads

The layout builder creates a mandatory main route, a guaranteed Ramp Up to the upper level, side branches, junctions, rooms, platforming spaces, loops, and sealed dead ends. It attempts to place every second-batch piece in each generated map before filling remaining space with weighted random modules.

## Collision policy

All current and future gameplay geometry follows one rule: **physical-looking map geometry is created through the collision-first renderer and automatically receives a locomotion collider**.

This includes:

- floors and upper floors
- ceilings and the backup escape ceiling
- exterior and interior walls
- doorway lintels
- hallway dividers
- pillars and windows
- stepping blocks and raised platforms
- low overhead beams
- Ramp Up steps and shaft walls
- connector caps
- perimeter escape walls

Pure text and light entities are decorative and do not receive collision.

The procedural map is created after the A-Frame scene begins loading, so relying only on normal component discovery left the Gorilla locomotion component with its old startup collider list. `complex-renderer.js` now maintains an explicit runtime collider registry. It installs collider data directly, replaces the locomotion component's collider list after every generation, retries registration while A-Frame initializes the new entities, and refreshes again when VR starts.

The map root exposes these debugging values after generation:

- `data-collider-count`
- `data-active-collider-count`
- `data-collision-ready`

## Generation rules

- 6-meter construction grid
- ground and upper levels
- 90-degree module rotation
- compatible connector alignment
- deterministic seeded selection
- footprint and level overlap rejection
- 192-meter bounded generation area
- unused connector capping or sealing
- one dominant lighting kit per match
- black-and-charcoal checkerboard surfaces
- dynamic lights without real-time shadows

The full planned 76-piece library and later dynamic modules are documented in `docs/PROCEDURAL_COMPLEX_PLAN.md`.

## Locomotion source of truth

The movement file is copied directly from this pinned source:

- Repository: `2ndsebastiantablet-hash/feeble`
- Commit: `28a426aa6ade789320e2202cfa8d2fe61b46b539`
- Source: `templates/gorilla-tag-locomotion/gorilla-locomotion.js`
- Source Git blob SHA: `94974d406cc880f5741f3e15e94dca2ee923947b`
- Destination: `gorilla-locomotion-web.js`

The pinned locomotion file itself remains unchanged. The procedural renderer registers compatible `locomotion-collider` boxes around the generated geometry.

## GitHub Pages

The site address is:

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

## Quest test procedure

1. Wait for GitHub Pages to redeploy.
2. Completely close every older WEIRD VR Quest Browser tab.
3. Reopen the site, create a room, and enter VR.
4. Start a match from the controller menu.
5. Push against the Spawn Hub walls, floor blocks, and ceiling.
6. Test straight halls, corners, walls, doorway sides, and lintels.
7. Push against the stepping blocks, pillars, window panels, dividers, beams, and raised platforms.
8. Travel through the Ramp Up and test every step, side wall, upper doorway, and roof.
9. Try launching above the map and confirm the module ceilings and backup escape ceiling stop the player.
10. Start several matches and confirm the layout changes while collisions remain active.
11. Test from a second headset and confirm both players receive the same seeded layout.

## Important files

- `index.html` — UI, waiting room, procedural map root, HUD, and script order
- `complex-data.js` — all 24 module definitions and deterministic connector placement
- `complex-renderer.js` — visible geometry, lighting, ceilings, runtime collider registration, and spawn summaries
- `procedural-complex.js` — public generator API used by gameplay
- `gameplay.js` — match timer, seed synchronization, late joining, and monster spawn selection
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room and pose synchronization
- `docs/PROCEDURAL_COMPLEX_PLAN.md` — complete modular-map plan
- `.github/workflows/validate.yml` — syntax, determinism, module, collision, and scene checks
