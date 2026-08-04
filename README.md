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

The host creates an eight-character seed and sends it with the match-start state. Every participating client rebuilds the same layout locally, so map geometry does not need to be streamed through WebRTC.

The generator now contains **36 modular pieces** across three batches.

### Batch 1

Spawn Hub, Short Straight Hall, Medium Straight Hall, Long Straight Hall, Corner Hall, T Junction, Four-Way Junction, Small Empty Room, Square Pillar Room, Stepping Block Room, Ramp Up, and Plain Wall Cap.

### Batch 2

Offset S Hall, Zigzag Hall, Pillar Hall, Windowed Hall, Low Beam Hall, Split-Level Hall, Wide T Junction, Offset Crossroads, Fork Junction, Double Hall Loop, Ring Junction, and Broken Crossroads.

### Batch 3

Long Chamber, Storage Block Room, Sunken Floor Room, Raised Ring Room, Twin Chamber, Divider Room, Observation Room, Column Forest Room, Edge-Light Room, Emergency Light Room, Checker Arena, and Collapsed Room.

The third batch replaces suitable connector caps after the base layout is created. This expands dead ends into larger rooms without changing the shared multiplayer seed. Pieces that cannot fit safely remain capped rather than overlapping existing geometry.

## Bright lighting system

Every generated module now receives a visible emissive ceiling fixture. The map also receives stronger ambient and hemisphere fill lighting, so hallways and rooms remain readable even between real light sources.

Actual point lights are concentrated in rooms, junctions, vertical transitions, and selected hallways. Large spaces can receive small accent lights. All real lights use short ranges and have shadows disabled to reduce the cost on Meta Quest.

The map root exposes:

- `data-lighting-mode="bright-everywhere"`
- `data-point-light-count`

## Collision policy

All current and future physical-looking map geometry must be created through the collision-first renderer and automatically receive locomotion collision.

This includes floors, upper floors, ceilings, walls, doorway lintels, dividers, pillars, window panels, low beams, storage blocks, arena platforms, collapsed debris, Ramp Up steps, connector caps, perimeter walls, and the backup escape ceiling.

Text, light entities, and thin glowing trim are decorative. Everything the player should be able to push against or stand on is solid.

The generated map appears after A-Frame begins loading. `complex-renderer.js` and `complex-batch3-renderer.js` therefore maintain runtime collider registries, install collider data on generated entities, replace the locomotion component's collider list after generation, retry registration during initialization, and refresh it again when VR starts.

## Generation rules

- 6-meter construction grid
- ground and upper levels
- 90-degree module rotation
- compatible connector alignment
- deterministic seeded selection
- footprint and level overlap rejection
- 192-meter bounded generation area
- unused connector capping or sealing
- one dominant visual color kit per match
- black-and-charcoal checkerboard surfaces
- bright emissive fixtures throughout the complex
- no real-time shadows

The complete planned 76-piece library and future dynamic modules are documented in `docs/PROCEDURAL_COMPLEX_PLAN.md`.

## Locomotion source of truth

The movement file is copied directly from this pinned source:

- Repository: `2ndsebastiantablet-hash/feeble`
- Commit: `28a426aa6ade789320e2202cfa8d2fe61b46b539`
- Source: `templates/gorilla-tag-locomotion/gorilla-locomotion.js`
- Source Git blob SHA: `94974d406cc880f5741f3e15e94dca2ee923947b`
- Destination: `gorilla-locomotion-web.js`

The pinned movement file remains unchanged.

## GitHub Pages

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

## Quest test procedure

1. Wait for GitHub Pages to redeploy.
2. Completely close every older WEIRD VR Quest Browser tab.
3. Reopen the site, create a room, enter VR, and start a match.
4. Confirm the Spawn Hub, hallways, and connector openings are brightly visible.
5. Enter several large rooms and confirm their fixtures and local lights illuminate the floor and obstacles.
6. Push against walls, ceilings, storage blocks, columns, observation panels, dividers, platforms, collapsed debris, and Ramp Up steps.
7. Try launching above the complex and confirm the ceilings stop the player.
8. Start several matches and confirm layout and visual kit changes do not create dark unplayable sections.
9. Test with a second headset and confirm both players receive the same seeded layout.

## Important files

- `complex-data.js` — batches 1 and 2 plus the deterministic base layout
- `complex-batch3.js` — batch 3 definitions and cap-replacement placement
- `complex-renderer.js` — base geometry and runtime collision registration
- `complex-batch3-renderer.js` — batch 3 interiors, bright universal lighting, and extension collision registration
- `procedural-complex.js` — public generator API used by gameplay
- `gameplay.js` — match timer, seed synchronization, late joining, and monster spawn selection
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room and pose synchronization
- `.github/workflows/validate.yml` — syntax, determinism, module, collision, lighting, and scene checks
