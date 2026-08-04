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

The previous three authored match maps and imported environment files have been removed.

Every match now uses one map type: **Black Checkered Complex**. The host creates a map seed and sends it with the match-start state. Every participating client rebuilds the complex locally from that same seed so all players receive the identical layout without transferring map geometry over WebRTC.

`procedural-complex.js` currently provides the foundation shell:

- one large black-and-charcoal checkerboard floor
- waiting-room-inspired visual language
- a four-connector Spawn Hub
- simple dynamic lighting
- locomotion collision
- map-seed display and regeneration hook

The complete connector rules, generation algorithm, 76 planned static modules, future dynamic pieces, performance limits, and implementation order are documented in:

`docs/PROCEDURAL_COMPLEX_PLAN.md`

The modular generator itself is the next implementation phase. The current shell intentionally contains only the Spawn Hub and connector markers while the piece library is designed and built.

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

## Current Quest test procedure

1. Fully close any older WEIRD VR browser tab so Quest does not reuse cached files.
2. Reopen the GitHub Pages URL.
3. Create or join a room.
4. Press **Enter VR**.
5. Confirm both hand spheres follow the Touch controllers.
6. Test floor, wall, and prop pushing in the waiting room.
7. Open the controller menu and start a match as host.
8. Confirm the Black Checkered Complex shell appears.
9. Confirm every participating player sees the same seed.
10. Join during an active match and confirm the late player remains in the waiting room.

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

- `index.html` — menu, waiting room, one procedural match-map root, HUD, and Quest controller hierarchy
- `procedural-complex.js` — checkerboard shell and future modular generator entry point
- `docs/PROCEDURAL_COMPLEX_PLAN.md` — piece catalog and complete generation plan
- `gameplay.js` — host-controlled seeded match state, timer, late-join behavior, and future monster selection
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room creation, discovery, joining, state synchronization, and pose synchronization
- `config.js` — signaling, ICE server, room, and player-limit settings
- `app.js` — secure-context and immersive-VR checks
- `styles.css` — menu styling
- `.github/workflows/validate.yml` — syntax, source-integrity, procedural-map, and scene validation
