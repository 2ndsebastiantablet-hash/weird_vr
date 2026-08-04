# WEIRD VR

A static WebXR multiplayer playground for Meta Quest Browser.

## What is included

- A-Frame WebXR scene that runs directly from GitHub Pages
- Gorilla Tag-style hand locomotion
- PeerJS/WebRTC peer-to-peer multiplayer
- Public and private six-character rooms
- Join by room code
- Public room browser
- The requested empty-code flow: when neither a public nor private host exists for an entered code, the game asks whether to create that exact room as public or private
- Networked head and hand avatars for up to eight players
- No package manager, bundler, or build step

## GorillaLocomotion source

Another Axiom's official `GorillaLocomotion` repository is a Unity/C# project, so its `Player.cs` cannot run directly inside a web browser. `gorilla-locomotion-web.js` is a clean JavaScript/A-Frame adaptation of the official movement model, including:

- maximum arm-length clamping
- sticky hand contacts
- two-hand displacement averaging
- velocity-history launches
- jump-speed limiting
- gravity and air drag
- surface sliding
- hand unsticking

Original source: `https://github.com/Another-Axiom/GorillaLocomotion`

The original project is MIT licensed. Its license is preserved in `THIRD_PARTY_LICENSES/Another-Axiom-GorillaLocomotion-MIT.txt`.

## Turn on GitHub Pages

1. Open this repository on GitHub.
2. Select **Settings**.
3. Select **Pages** in the left sidebar.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select branch **main** and folder **/(root)**.
6. Save and wait for the deployment to finish.

The site address will be:

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

Open that HTTPS address in Meta Quest Browser and press **Enter VR**.

## Room behavior

### Public room

The host claims a PeerJS ID beginning with `weird-vr-public-`. The public-room browser calls PeerJS discovery and displays matching IDs.

### Private room

The host claims a PeerJS ID beginning with `weird-vr-private-`. It does not appear in the public-room list, but anyone with the code can join.

### Joining an unused code

The client tries the public host ID, then the private host ID. If neither exists, a dialog asks whether to create that exact code publicly or privately.

### Host ownership

The first player is the room host. All player data travels through WebRTC data channels. The host relays guest poses to the other guests. If the host leaves, the room closes.

## Important networking limits

- PeerJS Cloud is used for signaling and public-room discovery.
- WebRTC uses free public STUN servers by default.
- Some strict, school, enterprise, cellular, or carrier-grade NAT networks require a TURN relay. Add TURN credentials in `config.js` for production reliability.
- Public discovery depends on the PeerJS server allowing `listAllPeers`. Code joining still works if discovery is temporarily unavailable.
- This prototype has no accounts, moderation, voice chat, or authoritative anti-cheat server.

## Quest playtest

1. Enable GitHub Pages.
2. Open the Pages URL in Meta Quest Browser.
3. Create a room before entering VR.
4. Press **Enter VR**.
5. Put a hand sphere against the floor.
6. Push your real controller backward to move your body forward.
7. Push quickly to launch.
8. Test walls, raised blocks, and the arena boundary.
9. Open the same page on another headset or browser and join the room.

## Files

- `index.html` — menu and WebXR arena
- `styles.css` — responsive menu styling
- `config.js` — room, signaling, STUN, and player-limit configuration
- `gorilla-locomotion-web.js` — WebXR movement adaptation
- `multiplayer.js` — public/private room and pose networking
- `app.js` — startup and WebXR checks
