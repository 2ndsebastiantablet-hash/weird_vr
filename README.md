# WEIRD VR

A static A-Frame WebXR multiplayer survival prototype for Meta Quest Browser.

## Features

- Gorilla Tag-style hand locomotion
- hand pushing against floors, walls, props, and climbable geometry
- one-hand and two-hand launch behavior
- gravity, air drag, and grounded drag
- tracked Quest controllers
- PeerJS/WebRTC peer-to-peer multiplayer
- public and private six-character rooms
- join by code or from a public-room list
- unused-code prompt that creates the entered code as public or private
- networked head and hand avatars for up to eight players
- host-controlled four-minute matches
- late joiners wait in the lobby until the active match ends
- six-monster selection hooks for the future monster pool
- no package manager, bundler, or build step

## Procedural Black Checkered Complex

Every match uses one map type: **Black Checkered Complex**. The host creates an eight-character seed and sends it with the match-start state. Every participating client reconstructs the same layout locally, so map geometry does not need to be streamed over WebRTC.

The first working modular batch is implemented:

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

The generator currently creates approximately 24 core pieces and then attaches caps to remaining usable connectors, normally producing about 29–38 total modules. It builds a mandatory main route, branches, junctions, rooms, a guaranteed transition to an upper level, platforming spaces, and sealed dead ends.

### Enclosure and escape protection

Every normal module has its own visible solid ceiling at the top of the room. The Ramp Up module is a taller enclosed shaft with a roof above its upper level. The full generation area also has a second invisible collision ceiling and tall perimeter walls as a final escape barrier.

Ceilings, floors, walls, doorway lintels, platforms, pillars, ramps, and caps all use simplified `locomotion-collider` boxes. After a new seed is generated, the Gorilla locomotion component refreshes its collider list so it uses the new map rather than deleted geometry from the previous round.

### Generation rules

- 6-meter construction grid
- one ground level and one upper level
- connector alignment and 90-degree piece rotation
- deterministic seeded random selection
- footprint and level overlap rejection
- bounded generation area
- unused connector capping or sealing
- generated navigation and monster-spawn points
- one dominant lighting color kit per match
- black-and-charcoal checkerboard floors
- dynamic point lights without real-time shadows

The complete planned 76-piece library and later dynamic modules are documented in:

`docs/PROCEDURAL_COMPLEX_PLAN.md`

## Locomotion source of truth

The movement file in this repository is copied directly from this pinned source:

- Repository: `2ndsebastiantablet-hash/feeble`
- Commit: `28a426aa6ade789320e2202cfa8d2fe61b46b539`
- Folder: `templates/gorilla-tag-locomotion`
- Source file: `templates/gorilla-tag-locomotion/gorilla-locomotion.js`
- Source Git blob SHA: `94974d406cc880f5741f3e15e94dca2ee923947b`
- Destination file: `gorilla-locomotion-web.js`

The movement implementation itself is unchanged from that pinned source. The game scene is adapted to its required structure:

- component name: `gorilla-locomotion`
- controller IDs: `left-hand` and `right-hand`
- controller component: `tracked-controls`
- camera local position: `0 0 0`
- hand visual IDs: `left-hand-visual` and `right-hand-visual`
- floor height: `0`
- player height offset: `1.15`
- collision surfaces use `locomotion-collider`

## Enable GitHub Pages

1. Open this repository on GitHub.
2. Select **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save and wait for deployment.

The site address is:

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

## Quest test procedure

1. Fully close every older WEIRD VR browser tab.
2. Reopen the GitHub Pages URL after deployment finishes.
3. Create a room and enter VR.
4. Open the controller menu and start a match.
5. Confirm the map contains connected hallways, junctions, rooms, caps, and an upper level.
6. Confirm every room and hallway has a visible ceiling.
7. Try launching upward against walls and platforming blocks and confirm the roof prevents leaving the map.
8. Travel through the Ramp Up piece and confirm the upper route is solid.
9. Start multiple matches and confirm the layout and lighting change with each seed.
10. Join from a second player and confirm both participating players receive the same layout.
11. Join during an active match and confirm the late player remains in the waiting room.

## Room behavior

Public hosts use a PeerJS ID beginning with `weird-vr-public-`. Private hosts use `weird-vr-private-`. Entering a room code checks both host types. When neither exists, the game asks whether to create that exact code publicly or privately.

The first player is the room host. Player pose data travels through WebRTC data channels. If the host leaves, the room closes.

## Networking limits

- PeerJS Cloud is used for signaling and public-room discovery.
- Free public STUN servers are configured.
- Some strict or carrier-grade NAT networks require a TURN relay.
- Public discovery depends on PeerJS allowing peer listing; direct room-code joining can still work when the public list is unavailable.
- This prototype does not yet include accounts, moderation, voice chat, host migration, or an authoritative game server.

## Important files

- `index.html` — menu, waiting room, procedural map root, HUD, and Quest controller hierarchy
- `procedural-complex.js` — module definitions, seeded placement, geometry, ceilings, lighting, collisions, and generated spawn data
- `docs/PROCEDURAL_COMPLEX_PLAN.md` — full piece catalog and generation plan
- `gameplay.js` — seeded match state, timer, late-join behavior, and generated monster-spawn selection
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room creation, discovery, joining, state synchronization, and pose synchronization
- `config.js` — signaling, ICE server, room, and player-limit settings
- `app.js` — secure-context and immersive-VR checks
- `styles.css` — menu styling
- `.github/workflows/validate.yml` — syntax, source-integrity, module, determinism, ceiling, and scene validation
