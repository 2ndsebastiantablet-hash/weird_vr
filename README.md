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

## Shape-built match maps

The match maps use A-Frame geometry rather than imported environment models. `map-loader.js` clears the three empty map roots and builds each environment before A-Frame initializes the scene.

- **Neon Crossroads** — a nighttime city intersection with buildings, rooftop routes, neon storefronts, moving colored lights, street props, and a central rotating portal.
- **Blackwood Manor** — a haunted mansion floor with divided rooms, a grand staircase and balcony, fireplace, library, dining space, statues, moon windows, a flickering chandelier, and a moving ghost light.
- **Moonpine Forest** — a moonlit forest with pine trees, creek and bridge, campfire, ruined shrine, climbable rocks, mountains, animated fireflies, firelight, and a drifting spirit light.

Each map includes simplified locomotion colliders that match its visible floors, walls, buildings, trees, and major props. Dynamic point lights are animated without expensive real-time shadows to keep the scene practical for Quest Browser.

The old uploaded GLB environment files are no longer referenced by the game.

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

The multiplayer system reads nested `left-hand-follower` and `right-hand-follower` spheres so the pinned locomotion component can control the hand visuals while network pose synchronization continues to work.

## Enable GitHub Pages

1. Open this repository on GitHub.
2. Select **Settings**.
3. Select **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save and wait for deployment.

The site address is:

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

Open the HTTPS address in Meta Quest Browser and press **Enter VR**.

## Quest test procedure

1. Fully close any older WEIRD VR browser tab so Quest does not reuse cached files.
2. Reopen the GitHub Pages URL.
3. Create or join a room.
4. Press **Enter VR**.
5. Confirm both hand spheres follow the Touch controllers.
6. Test floor, wall, and prop pushing in the waiting room.
7. Open the controller menu and start a match as host.
8. Confirm the selected map is visible, lit, and solid.
9. Test all three maps across repeated matches.
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

- `index.html` — menu, waiting room, empty match-map roots, HUD, and Quest controller hierarchy
- `map-loader.js` — builds the three geometry maps, their colliders, atmosphere, and dynamic lighting
- `gameplay.js` — host-controlled match state, map selection, timer, late-join behavior, and future monster selection
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room creation, discovery, joining, state synchronization, and pose synchronization
- `config.js` — signaling, ICE server, room, and player-limit settings
- `app.js` — secure-context and immersive-VR checks
- `styles.css` — menu styling
- `.github/workflows/validate.yml` — syntax, source-integrity, map, and scene validation
