# WEIRD VR

A static A-Frame WebXR multiplayer survival prototype for Meta Quest Browser.

## Current features

- Gorilla Tag-style hand locomotion
- public and private PeerJS/WebRTC rooms for up to eight players
- host-controlled four-minute matches
- late joiners remain in the waiting room until the next round
- one authored stylized forest survival map
- six future-monster selections and fixed monster spawn locations
- no package manager, bundler, downloaded map model, or build process

## Evergreen Outpost

The active match map is **Evergreen Outpost**, a bright low-poly forest inspired by the clean, chunky readability of Compound VR. The previous procedural Black Checkered Complex and all of its module files were removed.

The forest is constructed from A-Frame shapes only when the first match begins. It is kept in memory for later matches, preventing the menu and waiting room from being delayed by map construction.

### Landmarks

- central spawn clearing
- Ranger Cabin
- Supply Shed
- creek and wooden bridge
- campfire clearing
- climbable lookout platform
- rock ridge and overlook
- ruined stone structure
- stump platforming course
- dense outer forest and scattered boulders

### Sky and lighting

The map contains a large blue sky dome, a stylized sun, bright clouds, distant low-poly mountains, strong ambient and hemisphere fill light, directional sunlight, and a few local landmark lights. Real-time shadows remain disabled for Quest performance.

### Collision policy

Every object that should stop, support, or launch the player receives locomotion collision:

- ground
- tree trunks
- rocks and ridge blocks
- cabin floors, walls, roofs, and porches
- bridge planks and rails
- camp logs and firepit base
- lookout supports, platform, railings, and steps
- ruins
- stump platforms
- invisible perimeter walls

Foliage, clouds, sun, distant mountains, water coloring, paths, text, and light entities are decorative and non-solid.

`forest-map.js` keeps an explicit runtime collider registry and refreshes the pinned Gorilla locomotion component after the forest is created and whenever VR starts.

## Match behavior

1. Players begin in the waiting room.
2. The host opens the controller menu and starts a match.
3. Current room members enter Evergreen Outpost at the same clearing.
4. Six entries are reserved from the future monster pool and assigned forest spawn points.
5. The match lasts four minutes.
6. Everyone returns to the waiting room when time expires.
7. Players joining during a match wait in the waiting room.

## Locomotion source of truth

The movement file remains copied byte-for-byte from:

- repository: `2ndsebastiantablet-hash/feeble`
- commit: `28a426aa6ade789320e2202cfa8d2fe61b46b539`
- source: `templates/gorilla-tag-locomotion/gorilla-locomotion.js`
- source Git blob SHA: `94974d406cc880f5741f3e15e94dca2ee923947b`
- destination: `gorilla-locomotion-web.js`

## GitHub Pages

`https://2ndsebastiantablet-hash.github.io/weird_vr/`

## Quest test procedure

1. Wait for GitHub Pages to redeploy.
2. Completely close every older WEIRD VR Quest Browser tab.
3. Reopen the site and confirm multiplayer reaches the ready state.
4. Create a room, enter VR, and start a match.
5. Confirm the forest, blue sky, sun, clouds, mountains, cabins, creek, bridge, camp, lookout, ridge, ruins, and stump course appear.
6. Push against the ground, tree trunks, rocks, cabin pieces, bridge, lookout, ruins, and stumps.
7. Try to leave the forest and confirm the invisible perimeter walls stop the player.
8. Allow the timer to end and confirm all players return to the waiting room.
9. Join during an active round and confirm the new player remains in the waiting room.

## Important files

- `index.html` — menus, waiting room, forest root, HUD, and controller hierarchy
- `forest-map.js` — authored forest geometry, sky, lighting, landmarks, spawn data, and runtime collisions
- `gameplay.js` — match timer, host start, late joining, forest switching, and future monster selection
- `gorilla-locomotion-web.js` — exact pinned movement source
- `multiplayer.js` — room and pose synchronization
- `app.js` — reliable Quest startup and visible startup errors
- `.github/workflows/validate.yml` — syntax, source integrity, forest, collision, lighting, and scene checks
