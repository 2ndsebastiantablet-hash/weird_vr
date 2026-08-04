# WEIRD VR

A static A-Frame WebXR multiplayer playground for Meta Quest Browser.

## Features

- Gorilla Tag-style hand locomotion
- hand pushing against the floor, walls, and blocks
- one-hand and two-hand launch behavior
- gravity, air drag, and grounded drag
- tracked Quest controllers
- PeerJS/WebRTC peer-to-peer multiplayer
- public and private six-character rooms
- join by code or from a public-room list
- unused-code prompt that creates the entered code as public or private
- networked head and hand avatars for up to eight players
- no package manager, bundler, or build step

## Locomotion source of truth

The movement file in this repository is copied directly from this pinned source:

- Repository: `2ndsebastiantablet-hash/feeble`
- Commit: `28a426aa6ade789320e2202cfa8d2fe61b46b539`
- Folder: `templates/gorilla-tag-locomotion`
- Source file: `templates/gorilla-tag-locomotion/gorilla-locomotion.js`
- Source Git blob SHA: `94974d406cc880f5741f3e15e94dca2ee923947b`
- Destination file: `gorilla-locomotion-web.js`

The movement implementation itself is unchanged from that pinned source. The game scene was adapted to its required structure:

- component name: `gorilla-locomotion`
- controller IDs: `left-hand` and `right-hand`
- controller component: `tracked-controls`
- camera local position: `0 0 0`
- hand visual IDs: `left-hand-visual` and `right-hand-visual`
- floor height: `0`
- player height offset: `0.68`
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

1. Fully close any older WEIRD VR browser tab so Quest does not reuse the old JavaScript.
2. Reopen the GitHub Pages URL.
3. Create or join a room.
4. Press **Enter VR**.
5. Confirm both hand spheres follow the Touch controllers.
6. Press either sphere into the floor and pull the real controller backward.
7. Test one-hand and two-hand floor launches.
8. Push against the walls and blocks.
9. Join from a second headset or browser and confirm head and hand poses synchronize.

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

- `index.html` — menu, multiplayer scene wiring, locomotion colliders, and Quest controller hierarchy
- `gorilla-locomotion-web.js` — exact pinned locomotion source
- `multiplayer.js` — room creation, discovery, joining, and pose synchronization
- `config.js` — signaling, ICE server, room, and player-limit settings
- `app.js` — secure-context and immersive-VR checks
- `styles.css` — menu styling
- `.github/workflows/validate.yml` — syntax and pinned-source validation
