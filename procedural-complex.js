(function () {
  "use strict";

  const ROOT_ID = "match-map-complex";
  const GRID_UNIT = 6;
  const MAP_SIZE = 156;
  const HALF_SIZE = MAP_SIZE / 2;
  const LEVEL_HEIGHT = 6;
  const WALL_HEIGHT = 6;
  const DOOR_WIDTH = 5;
  const DOOR_HEIGHT = 4.7;
  const CEILING_THICKNESS = 0.45;
  const TARGET_PIECES = 24;
  const MAIN_ROUTE_LENGTH = 15;
  const MAX_LEVEL = 1;

  const DIRECTIONS = Object.freeze({
    N: {x: 0, z: -1, opposite: "S"},
    E: {x: 1, z: 0, opposite: "W"},
    S: {x: 0, z: 1, opposite: "N"},
    W: {x: -1, z: 0, opposite: "E"}
  });

  const VISUAL_KITS = Object.freeze([
    {id: "purple", accent: "#8177ff", emissive: "#4d42d8", trim: "#b8b4ff", wall: "#101218", ceiling: "#07080b"},
    {id: "red", accent: "#ff4f69", emissive: "#bb223c", trim: "#ffc0c9", wall: "#141014", ceiling: "#090709"},
    {id: "blue", accent: "#54c8ff", emissive: "#247fbd", trim: "#c5eeff", wall: "#0d1218", ceiling: "#06090c"},
    {id: "green", accent: "#63df9a", emissive: "#238454", trim: "#c6f7dc", wall: "#0d1512", ceiling: "#060a08"},
    {id: "white", accent: "#dce6ff", emissive: "#7489b8", trim: "#ffffff", wall: "#111318", ceiling: "#08090c"}
  ]);

  function connector(dir, x, z, levelOffset) {
    return {dir, x, z, levelOffset: levelOffset || 0, type: "H"};
  }

  const PIECES = Object.freeze({
    spawnHub: {
      id: "spawnHub",
      name: "Spawn Hub",
      category: "start",
      width: 18,
      depth: 18,
      weight: 0,
      rotations: [0],
      connectors: [
        connector("N", 0, -9), connector("E", 9, 0),
        connector("S", 0, 9), connector("W", -9, 0)
      ],
      render: "spawn"
    },
    shortStraight: {
      id: "shortStraight",
      name: "Short Straight Hall",
      category: "hall",
      width: 6,
      depth: 6,
      weight: 11,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -3), connector("S", 0, 3)],
      render: "hall"
    },
    mediumStraight: {
      id: "mediumStraight",
      name: "Medium Straight Hall",
      category: "hall",
      width: 6,
      depth: 12,
      weight: 10,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -6), connector("S", 0, 6)],
      render: "hall"
    },
    longStraight: {
      id: "longStraight",
      name: "Long Straight Hall",
      category: "hall",
      width: 6,
      depth: 18,
      weight: 6,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -9), connector("S", 0, 9)],
      render: "hall"
    },
    cornerHall: {
      id: "cornerHall",
      name: "Corner Hall",
      category: "hall",
      width: 6,
      depth: 6,
      weight: 10,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -3), connector("E", 3, 0)],
      render: "corner"
    },
    tJunction: {
      id: "tJunction",
      name: "T Junction",
      category: "junction",
      width: 12,
      depth: 12,
      weight: 5,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -6), connector("E", 6, 0), connector("W", -6, 0)],
      render: "junction"
    },
    fourWay: {
      id: "fourWay",
      name: "Four-Way Junction",
      category: "junction",
      width: 12,
      depth: 12,
      weight: 3,
      rotations: [0, 90, 180, 270],
      connectors: [
        connector("N", 0, -6), connector("E", 6, 0),
        connector("S", 0, 6), connector("W", -6, 0)
      ],
      render: "junction"
    },
    smallRoom: {
      id: "smallRoom",
      name: "Small Empty Room",
      category: "room",
      width: 12,
      depth: 12,
      weight: 8,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -6), connector("S", 0, 6)],
      render: "room"
    },
    pillarRoom: {
      id: "pillarRoom",
      name: "Square Pillar Room",
      category: "room",
      width: 18,
      depth: 18,
      weight: 4,
      rotations: [0, 90, 180, 270],
      connectors: [
        connector("N", 0, -9), connector("E", 9, 0),
        connector("S", 0, 9), connector("W", -9, 0)
      ],
      render: "pillars"
    },
    steppingRoom: {
      id: "steppingRoom",
      name: "Stepping Block Room",
      category: "platforming",
      width: 18,
      depth: 12,
      weight: 5,
      rotations: [0, 90, 180, 270],
      connectors: [connector("N", 0, -6), connector("S", 0, 6)],
      render: "steps"
    },
    rampUp: {
      id: "rampUp",
      name: "Ramp Up",
      category: "vertical",
      width: 6,
      depth: 12,
      weight: 1,
      rotations: [0, 90, 180, 270],
      connectors: [connector("S", 0, 6, 0), connector("N", 0, -6, 1)],
      render: "ramp",
      occupiedLevelOffsets: [0, 1]
    },
    wallCap: {
      id: "wallCap",
      name: "Plain Wall Cap",
      category: "cap",
      width: 6,
      depth: 6,
      weight: 0,
      rotations: [0, 90, 180, 270],
      connectors: [connector("S", 0, 3)],
      render: "cap"
    }
  });

  const EXPANSION_POOL = [
    PIECES.shortStraight,
    PIECES.mediumStraight,
    PIECES.longStraight,
    PIECES.cornerHall,
    PIECES.tJunction,
    PIECES.fourWay,
    PIECES.smallRoom,
    PIECES.pillarRoom,
    PIECES.steppingRoom
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function make(tag, attributes, parent) {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes || {})) {
      if (value !== undefined && value !== null && value !== "") {
        element.setAttribute(name, String(value));
      }
    }
    if (parent) parent.appendChild(element);
    return element;
  }

  function hashSeed(value) {
    const text = String(value || "preview");
    let hash = 2166136261 >>> 0;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let state = hashSeed(seed) || 0x6d2b79f5;
    return function random() {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rotatePoint(x, z, rotation) {
    const normalized = ((rotation % 360) + 360) % 360;
    if (normalized === 90) return {x: -z, z: x};
    if (normalized === 180) return {x: -x, z: -z};
    if (normalized === 270) return {x: z, z: -x};
    return {x, z};
  }

  function rotateDirection(direction, rotation) {
    const order = ["N", "E", "S", "W"];
    const turns = ((((rotation % 360) + 360) % 360) / 90) | 0;
    return order[(order.indexOf(direction) + turns) % 4];
  }

  function rotatedDimensions(definition, rotation) {
    const normalized = ((rotation % 360) + 360) % 360;
    return normalized === 90 || normalized === 270
      ? {width: definition.depth, depth: definition.width}
      : {width: definition.width, depth: definition.depth};
  }

  function weightedOrder(values, random) {
    return values
      .map(value => {
        const weight = Math.max(0.1, Number(value.weight) || 1);
        return {value, score: -Math.log(Math.max(0.000001, random())) / weight};
      })
      .sort((a, b) => a.score - b.score)
      .map(entry => entry.value);
  }

  function shuffled(values, random) {
    const copy = values.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }

  function createPlacedPiece(definition, x, z, baseLevel, rotation) {
    const dimensions = rotatedDimensions(definition, rotation);
    const placed = {
      id: `${definition.id}-${Math.random().toString(36).slice(2)}`,
      definition,
      x,
      z,
      baseLevel,
      rotation,
      width: dimensions.width,
      depth: dimensions.depth,
      connectors: []
    };

    placed.connectors = definition.connectors.map((source, index) => {
      const point = rotatePoint(source.x, source.z, rotation);
      return {
        id: `${placed.id}-connector-${index}`,
        piece: placed,
        source,
        x: x + point.x,
        z: z + point.z,
        dir: rotateDirection(source.dir, rotation),
        level: baseLevel + source.levelOffset,
        status: "open",
        connectedTo: null
      };
    });

    return placed;
  }

  function occupiedLevels(piece) {
    const offsets = piece.definition.occupiedLevelOffsets || [0];
    return offsets.map(offset => piece.baseLevel + offset);
  }

  function rectanglesOverlap(a, b) {
    const epsilon = 0.08;
    return (
      Math.abs(a.x - b.x) * 2 < a.width + b.width - epsilon &&
      Math.abs(a.z - b.z) * 2 < a.depth + b.depth - epsilon
    );
  }

  function canPlace(piece, placedPieces) {
    if (piece.baseLevel < 0 || piece.baseLevel > MAX_LEVEL) return false;
    if (piece.x - piece.width / 2 < -HALF_SIZE + 3) return false;
    if (piece.x + piece.width / 2 > HALF_SIZE - 3) return false;
    if (piece.z - piece.depth / 2 < -HALF_SIZE + 3) return false;
    if (piece.z + piece.depth / 2 > HALF_SIZE - 3) return false;

    const levels = occupiedLevels(piece);
    for (const existing of placedPieces) {
      const sharesLevel = occupiedLevels(existing).some(level => levels.includes(level));
      if (sharesLevel && rectanglesOverlap(piece, existing)) return false;
    }
    return true;
  }

  function opposite(direction) {
    return DIRECTIONS[direction].opposite;
  }

  function tryPlaceDefinition(target, definition, layout, random) {
    const rotations = shuffled(definition.rotations, random);
    for (const rotation of rotations) {
      const connectorIndexes = shuffled(definition.connectors.map((_, index) => index), random);
      for (const connectorIndex of connectorIndexes) {
        const source = definition.connectors[connectorIndex];
        const rotatedDir = rotateDirection(source.dir, rotation);
        if (rotatedDir !== opposite(target.dir)) continue;

        const baseLevel = target.level - source.levelOffset;
        if (definition === PIECES.rampUp && baseLevel !== 0) continue;
        const rotatedPoint = rotatePoint(source.x, source.z, rotation);
        const candidate = createPlacedPiece(
          definition,
          target.x - rotatedPoint.x,
          target.z - rotatedPoint.z,
          baseLevel,
          rotation
        );

        if (!canPlace(candidate, layout.pieces)) continue;

        const matching = candidate.connectors[connectorIndex];
        target.status = "connected";
        target.connectedTo = matching;
        matching.status = "connected";
        matching.connectedTo = target;
        layout.pieces.push(candidate);
        return {piece: candidate, entry: matching};
      }
    }
    return null;
  }

  function placeFromPool(target, pool, layout, random) {
    const ordered = weightedOrder(pool, random);
    for (const definition of ordered) {
      const result = tryPlaceDefinition(target, definition, layout, random);
      if (result) return result;
    }
    return null;
  }

  function openConnectors(layout) {
    const output = [];
    for (const piece of layout.pieces) {
      for (const connectorInstance of piece.connectors) {
        if (connectorInstance.status === "open") output.push(connectorInstance);
      }
    }
    return output;
  }

  function chooseContinuation(piece, entry, random) {
    const options = piece.connectors.filter(item => item !== entry && item.status === "open");
    if (!options.length) return null;
    const forward = options.filter(item => item.dir !== opposite(entry.dir));
    const pool = forward.length ? forward : options;
    return pool[Math.floor(random() * pool.length)];
  }

  function pairTouchingConnectors(layout) {
    const connectors = openConnectors(layout);
    for (let firstIndex = 0; firstIndex < connectors.length; firstIndex += 1) {
      const first = connectors[firstIndex];
      if (first.status !== "open") continue;
      for (let secondIndex = firstIndex + 1; secondIndex < connectors.length; secondIndex += 1) {
        const second = connectors[secondIndex];
        if (second.status !== "open" || first.piece === second.piece) continue;
        if (first.level !== second.level || first.dir !== opposite(second.dir)) continue;
        if (Math.abs(first.x - second.x) > 0.05 || Math.abs(first.z - second.z) > 0.05) continue;
        first.status = "connected";
        second.status = "connected";
        first.connectedTo = second;
        second.connectedTo = first;
        break;
      }
    }
  }

  function capConnectors(layout, random) {
    const pending = shuffled(openConnectors(layout), random);
    for (const target of pending) {
      if (target.status !== "open") continue;
      const result = tryPlaceDefinition(target, PIECES.wallCap, layout, random);
      if (!result) target.status = "sealed";
    }
  }

  function buildLayout(seed) {
    const random = createRandom(seed);
    const layout = {
      seed: String(seed || "preview"),
      random,
      pieces: [],
      kit: VISUAL_KITS[Math.floor(random() * VISUAL_KITS.length)],
      monsterSpawns: [],
      navigationPoints: []
    };

    const spawn = createPlacedPiece(PIECES.spawnHub, 0, 0, 0, 0);
    layout.pieces.push(spawn);

    let current = spawn.connectors[0];
    let usedRamp = false;

    for (let step = 0; step < MAIN_ROUTE_LENGTH && current; step += 1) {
      let result = null;
      if (step === 0) {
        result = tryPlaceDefinition(current, PIECES.mediumStraight, layout, random);
      } else if (!usedRamp && step === 1 && current.level === 0) {
        result = tryPlaceDefinition(current, PIECES.rampUp, layout, random);
        usedRamp = !!result;
      } else if (!usedRamp && current.level === 0) {
        result = tryPlaceDefinition(current, PIECES.rampUp, layout, random);
        usedRamp = !!result;
      }
      if (!result) result = placeFromPool(current, EXPANSION_POOL, layout, random);
      if (!result) {
        current.status = "sealed";
        break;
      }
      current = chooseContinuation(result.piece, result.entry, random);
    }

    let guard = 0;
    while (layout.pieces.length < TARGET_PIECES && guard < 180) {
      guard += 1;
      const frontier = openConnectors(layout);
      if (!frontier.length) break;
      const target = frontier[Math.floor(random() * frontier.length)];
      const result = placeFromPool(target, EXPANSION_POOL, layout, random);
      if (!result) target.status = "sealed";
    }

    pairTouchingConnectors(layout);
    capConnectors(layout, random);

    for (const piece of layout.pieces) {
      if (piece.definition.category === "cap" || piece.definition.category === "start") continue;
      const baseY = piece.baseLevel * LEVEL_HEIGHT;
      layout.navigationPoints.push([piece.x, baseY, piece.z]);
      if (piece.definition.category === "room" || piece.definition.category === "junction" || piece.definition.category === "platforming") {
        layout.monsterSpawns.push([piece.x, baseY, piece.z]);
      }
    }

    return layout;
  }

  function ensureCheckerTexture() {
    let canvas = byId("complex-checker-texture");
    if (canvas) return canvas;

    canvas = document.createElement("canvas");
    canvas.id = "complex-checker-texture";
    canvas.width = 256;
    canvas.height = 256;
    canvas.hidden = true;

    const context = canvas.getContext("2d");
    context.fillStyle = "#030303";
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = "#17191e";
    context.fillRect(0, 0, 128, 128);
    context.fillRect(128, 128, 128, 128);
    document.body.appendChild(canvas);
    return canvas;
  }

  function box(parent, position, size, color, options) {
    const config = options || {};
    return make("a-box", {
      position,
      width: size[0],
      height: size[1],
      depth: size[2],
      color,
      material: config.material,
      visible: config.visible,
      "locomotion-collider": config.collider === false ? null : `type:box;size:${size.join(" ")}`
    }, parent);
  }

  function worldPoint(piece, localX, localZ) {
    const rotated = rotatePoint(localX, localZ, piece.rotation);
    return {x: piece.x + rotated.x, z: piece.z + rotated.z};
  }

  function worldBox(piece, root, localX, y, localZ, sizeX, sizeY, sizeZ, color, options) {
    const point = worldPoint(piece, localX, localZ);
    const normalized = ((piece.rotation % 360) + 360) % 360;
    const rotated = normalized === 90 || normalized === 270;
    return box(
      root,
      `${point.x} ${y} ${point.z}`,
      rotated ? [sizeZ, sizeY, sizeX] : [sizeX, sizeY, sizeZ],
      color,
      options
    );
  }

  function addFloorAndCeiling(root, piece, kit) {
    const baseY = piece.baseLevel * LEVEL_HEIGHT;
    if (piece.baseLevel > 0) {
      box(root, `${piece.x} ${baseY - 0.2} ${piece.z}`, [piece.width, 0.4, piece.depth], "#07080a", {
        material: "roughness:1"
      });
    }

    make("a-plane", {
      position: `${piece.x} ${baseY + 0.015} ${piece.z}`,
      rotation: "-90 0 0",
      width: piece.width,
      height: piece.depth,
      material: `src:#complex-checker-texture;repeat:${Math.max(1, piece.width / GRID_UNIT)} ${Math.max(1, piece.depth / GRID_UNIT)};roughness:1;metalness:0`
    }, root);

    box(
      root,
      `${piece.x} ${baseY + WALL_HEIGHT + CEILING_THICKNESS / 2} ${piece.z}`,
      [piece.width, CEILING_THICKNESS, piece.depth],
      kit.ceiling,
      {material: "roughness:.96;metalness:.02"}
    );
  }

  function edgeOpenings(piece, direction) {
    return piece.connectors
      .filter(item => item.dir === direction && item.status === "connected")
      .map(item => direction === "N" || direction === "S" ? item.x - piece.x : item.z - piece.z)
      .sort((a, b) => a - b);
  }

  function wallSegment(root, direction, fixed, center, length, baseY, kit) {
    if (length <= 0.08) return;
    const position = direction === "N" || direction === "S"
      ? `${center} ${baseY + WALL_HEIGHT / 2} ${fixed}`
      : `${fixed} ${baseY + WALL_HEIGHT / 2} ${center}`;
    const size = direction === "N" || direction === "S"
      ? [length, WALL_HEIGHT, 0.5]
      : [0.5, WALL_HEIGHT, length];
    box(root, position, size, kit.wall, {material: "roughness:.9;metalness:.06"});
  }

  function doorwayLintel(root, direction, fixed, center, baseY, kit) {
    const lintelHeight = WALL_HEIGHT - DOOR_HEIGHT;
    const position = direction === "N" || direction === "S"
      ? `${center} ${baseY + DOOR_HEIGHT + lintelHeight / 2} ${fixed}`
      : `${fixed} ${baseY + DOOR_HEIGHT + lintelHeight / 2} ${center}`;
    const size = direction === "N" || direction === "S"
      ? [DOOR_WIDTH, lintelHeight, 0.5]
      : [0.5, lintelHeight, DOOR_WIDTH];
    box(root, position, size, kit.wall, {material: "roughness:.9;metalness:.06"});

    const trimPosition = direction === "N" || direction === "S"
      ? `${center} ${baseY + DOOR_HEIGHT - 0.08} ${fixed + (direction === "N" ? 0.27 : -0.27)}`
      : `${fixed + (direction === "E" ? -0.27 : 0.27)} ${baseY + DOOR_HEIGHT - 0.08} ${center}`;
    const trimSize = direction === "N" || direction === "S"
      ? [DOOR_WIDTH, 0.08, 0.06]
      : [0.06, 0.08, DOOR_WIDTH];
    box(root, trimPosition, trimSize, kit.accent, {
      collider: false,
      material: `color:${kit.accent};emissive:${kit.emissive};emissiveIntensity:1.2`
    });
  }

  function renderEdge(root, piece, direction, kit) {
    const isHorizontal = direction === "N" || direction === "S";
    const length = isHorizontal ? piece.width : piece.depth;
    const fixed = direction === "N" ? piece.z - piece.depth / 2
      : direction === "S" ? piece.z + piece.depth / 2
      : direction === "W" ? piece.x - piece.width / 2
      : piece.x + piece.width / 2;
    const centerBase = isHorizontal ? piece.x : piece.z;
    const openings = edgeOpenings(piece, direction);
    let cursor = centerBase - length / 2;

    for (const openingCenter of openings) {
      const openingStart = openingCenter - DOOR_WIDTH / 2;
      wallSegment(root, direction, fixed, (cursor + openingStart) / 2, openingStart - cursor, piece.baseLevel * LEVEL_HEIGHT, kit);
      doorwayLintel(root, direction, fixed, openingCenter, piece.baseLevel * LEVEL_HEIGHT, kit);
      cursor = openingCenter + DOOR_WIDTH / 2;
    }

    const edgeEnd = centerBase + length / 2;
    wallSegment(root, direction, fixed, (cursor + edgeEnd) / 2, edgeEnd - cursor, piece.baseLevel * LEVEL_HEIGHT, kit);
  }

  function addCeilingLight(root, piece, kit, index) {
    if (piece.definition.category === "cap" || index % 3 !== 0) return;
    const baseY = piece.baseLevel * LEVEL_HEIGHT;
    box(root, `${piece.x} ${baseY + WALL_HEIGHT - 0.18} ${piece.z}`, [1.8, 0.08, 0.35], kit.accent, {
      collider: false,
      material: `color:${kit.accent};emissive:${kit.emissive};emissiveIntensity:1.7`
    });
    make("a-entity", {
      position: `${piece.x} ${baseY + WALL_HEIGHT - 0.45} ${piece.z}`,
      light: `type:point;color:${kit.accent};intensity:1.45;distance:12;decay:2;castShadow:false`
    }, root);
  }

  function renderNormalPiece(root, piece, kit, index, seed) {
    addFloorAndCeiling(root, piece, kit);
    for (const direction of ["N", "E", "S", "W"]) renderEdge(root, piece, direction, kit);
    addCeilingLight(root, piece, kit, index);

    const baseY = piece.baseLevel * LEVEL_HEIGHT;
    if (piece.definition.render === "spawn") {
      for (const [x, z] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
        worldBox(piece, root, x, baseY + 1.15, z, 2.1, 2.3, 2.1, "#282d38", {material: "roughness:.74;metalness:.1"});
      }
      worldBox(piece, root, 0, baseY + 0.3, 0, 5, 0.6, 5, "#343a4b", {material: "roughness:.68;metalness:.1"});
      make("a-torus", {
        position: `${piece.x} ${baseY + 3} ${piece.z}`,
        radius: "2.3",
        "radius-tubular": ".1",
        material: `color:${kit.accent};emissive:${kit.emissive};emissiveIntensity:1.5`,
        animation: "property:rotation;to:0 360 0;dur:9000;loop:true;easing:linear"
      }, root);
      make("a-text", {
        value: "BLACK CHECKERED COMPLEX",
        align: "center",
        width: "6",
        color: "#ffffff",
        position: `${piece.x} ${baseY + 4.2} ${piece.z - 8.72}`
      }, root);
      make("a-text", {
        value: `SEED ${String(seed).toUpperCase()}`,
        align: "center",
        width: "3",
        color: kit.trim,
        position: `${piece.x} ${baseY + 3.45} ${piece.z - 8.73}`
      }, root);
    } else if (piece.definition.render === "pillars") {
      for (const [x, z] of [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]) {
        worldBox(piece, root, x, baseY + 2.5, z, 1.4, 5, 1.4, "#2b3039", {material: "roughness:.78;metalness:.08"});
      }
    } else if (piece.definition.render === "steps") {
      const blocks = [
        [-5.2, -2.6, 2.6, 0.65, 2.6],
        [-1.8, 1.3, 2.8, 1.25, 2.8],
        [1.9, -1.2, 2.5, 1.85, 2.5],
        [5.2, 2.4, 2.6, 2.45, 2.6]
      ];
      for (const [x, z, width, height, depth] of blocks) {
        worldBox(piece, root, x, baseY + height / 2, z, width, height, depth, "#343a49", {material: "roughness:.7;metalness:.08"});
      }
    } else if (piece.definition.render === "junction") {
      worldBox(piece, root, 0, baseY + 0.25, 0, 2.8, 0.5, 2.8, "#303541", {material: "roughness:.72"});
    } else if (piece.definition.render === "room") {
      worldBox(piece, root, 0, baseY + 0.35, 0, 3.4, 0.7, 3.4, "#252a34", {material: "roughness:.82"});
    } else if (piece.definition.render === "cap") {
      worldBox(piece, root, 0, baseY + 1.2, -0.6, 3.7, 2.4, 1.4, "#242933", {material: "roughness:.82"});
      worldBox(piece, root, 0, baseY + 2.7, -1.35, 3.8, 0.12, 0.08, kit.accent, {
        collider: false,
        material: `color:${kit.accent};emissive:${kit.emissive};emissiveIntensity:1.35`
      });
    }
  }

  function renderRampEdge(root, piece, direction, connectorInstance, kit) {
    const dimensions = rotatedDimensions(piece.definition, piece.rotation);
    const isHorizontal = direction === "N" || direction === "S";
    const length = isHorizontal ? dimensions.width : dimensions.depth;
    const fixed = direction === "N" ? piece.z - dimensions.depth / 2
      : direction === "S" ? piece.z + dimensions.depth / 2
      : direction === "W" ? piece.x - dimensions.width / 2
      : piece.x + dimensions.width / 2;
    const center = isHorizontal ? piece.x : piece.z;
    const leftLength = (length - DOOR_WIDTH) / 2;

    if (!connectorInstance || connectorInstance.status !== "connected") {
      const size = isHorizontal ? [length, 12, 0.5] : [0.5, 12, length];
      box(root, isHorizontal ? `${center} 6 ${fixed}` : `${fixed} 6 ${center}`, size, kit.wall, {material: "roughness:.9"});
      return;
    }

    if (leftLength > 0.05) {
      const firstCenter = center - DOOR_WIDTH / 2 - leftLength / 2;
      const secondCenter = center + DOOR_WIDTH / 2 + leftLength / 2;
      const sideSize = isHorizontal ? [leftLength, 12, 0.5] : [0.5, 12, leftLength];
      box(root, isHorizontal ? `${firstCenter} 6 ${fixed}` : `${fixed} 6 ${firstCenter}`, sideSize, kit.wall, {material: "roughness:.9"});
      box(root, isHorizontal ? `${secondCenter} 6 ${fixed}` : `${fixed} 6 ${secondCenter}`, sideSize, kit.wall, {material: "roughness:.9"});
    }

    if (connectorInstance.level === 0) {
      const upperHeight = 12 - DOOR_HEIGHT;
      const size = isHorizontal ? [DOOR_WIDTH, upperHeight, 0.5] : [0.5, upperHeight, DOOR_WIDTH];
      box(root, isHorizontal ? `${center} ${DOOR_HEIGHT + upperHeight / 2} ${fixed}` : `${fixed} ${DOOR_HEIGHT + upperHeight / 2} ${center}`, size, kit.wall, {material: "roughness:.9"});
    } else {
      const lowerHeight = LEVEL_HEIGHT;
      const topHeight = 12 - (LEVEL_HEIGHT + DOOR_HEIGHT);
      const lowerSize = isHorizontal ? [DOOR_WIDTH, lowerHeight, 0.5] : [0.5, lowerHeight, DOOR_WIDTH];
      box(root, isHorizontal ? `${center} ${lowerHeight / 2} ${fixed}` : `${fixed} ${lowerHeight / 2} ${center}`, lowerSize, kit.wall, {material: "roughness:.9"});
      if (topHeight > 0.05) {
        const topSize = isHorizontal ? [DOOR_WIDTH, topHeight, 0.5] : [0.5, topHeight, DOOR_WIDTH];
        box(root, isHorizontal ? `${center} ${LEVEL_HEIGHT + DOOR_HEIGHT + topHeight / 2} ${fixed}` : `${fixed} ${LEVEL_HEIGHT + DOOR_HEIGHT + topHeight / 2} ${center}`, topSize, kit.wall, {material: "roughness:.9"});
      }
    }
  }

  function renderRamp(root, piece, kit, index) {
    make("a-plane", {
      position: `${piece.x} 0.015 ${piece.z}`,
      rotation: "-90 0 0",
      width: piece.width,
      height: piece.depth,
      material: `src:#complex-checker-texture;repeat:${Math.max(1, piece.width / GRID_UNIT)} ${Math.max(1, piece.depth / GRID_UNIT)};roughness:1`
    }, root);

    box(root, `${piece.x} ${12 + CEILING_THICKNESS / 2} ${piece.z}`, [piece.width, CEILING_THICKNESS, piece.depth], kit.ceiling, {material: "roughness:.96"});

    for (const direction of ["N", "E", "S", "W"]) {
      const edgeConnector = piece.connectors.find(item => item.dir === direction);
      renderRampEdge(root, piece, direction, edgeConnector, kit);
    }

    for (let step = 0; step < 6; step += 1) {
      const height = step + 1;
      const localZ = 5 - step * 2;
      worldBox(piece, root, 0, height / 2, localZ, 5.4, height, 2.02, "#303642", {material: "roughness:.78;metalness:.05"});
    }

    worldBox(piece, root, 0, 6.08, -5.15, 5.4, 0.16, 1.7, kit.accent, {
      collider: false,
      material: `color:${kit.accent};emissive:${kit.emissive};emissiveIntensity:1.4`
    });
    addCeilingLight(root, piece, kit, index);
  }

  function addWorldShell(root) {
    const height = LEVEL_HEIGHT * 2 + 2;
    box(root, `0 ${height / 2} -${HALF_SIZE}`, [MAP_SIZE, height, 0.7], "#030405", {material: "roughness:1"});
    box(root, `0 ${height / 2} ${HALF_SIZE}`, [MAP_SIZE, height, 0.7], "#030405", {material: "roughness:1"});
    box(root, `-${HALF_SIZE} ${height / 2} 0`, [0.7, height, MAP_SIZE], "#030405", {material: "roughness:1"});
    box(root, `${HALF_SIZE} ${height / 2} 0`, [0.7, height, MAP_SIZE], "#030405", {material: "roughness:1"});

    box(root, `0 ${height + 0.35} 0`, [MAP_SIZE, 0.7, MAP_SIZE], "#000000", {visible: false});
  }

  function refreshLocomotionColliders() {
    const refresh = function () {
      const rig = byId("player-rig");
      const scene = byId("game-scene");
      const component = rig && rig.components && rig.components["gorilla-locomotion"];
      if (component && scene) {
        component.colliders = Array.from(scene.querySelectorAll("[locomotion-collider]"));
      }
    };

    const scene = byId("game-scene");
    if (scene && scene.hasLoaded) {
      requestAnimationFrame(refresh);
    } else if (scene) {
      scene.addEventListener("loaded", refresh, {once: true});
    }
  }

  function renderLayout(layout) {
    const root = byId(ROOT_ID);
    if (!root) return;
    ensureCheckerTexture();
    root.replaceChildren();
    root.dataset.mapSeed = layout.seed;
    root.dataset.pieceCount = String(layout.pieces.length);
    root.dataset.visualKit = layout.kit.id;

    make("a-entity", {
      light: "type:hemisphere;color:#8593ad;groundColor:#030304;intensity:.5"
    }, root);
    make("a-entity", {
      position: "-18 22 10",
      light: "type:directional;color:#b6c7ea;intensity:.5;castShadow:false"
    }, root);

    addWorldShell(root);

    layout.pieces.forEach((piece, index) => {
      if (piece.definition.render === "ramp") renderRamp(root, piece, layout.kit, index);
      else renderNormalPiece(root, piece, layout.kit, index, layout.seed);
    });

    refreshLocomotionColliders();
  }

  function summarizeLayout(layout, offsets) {
    const offsetX = offsets && Number.isFinite(offsets.x) ? offsets.x : 100;
    const offsetY = offsets && Number.isFinite(offsets.y) ? offsets.y : 0;
    const offsetZ = offsets && Number.isFinite(offsets.z) ? offsets.z : 0;
    return {
      seed: layout.seed,
      pieceCount: layout.pieces.length,
      pieceIds: layout.pieces.map(piece => piece.definition.id),
      visualKit: layout.kit.id,
      monsterSpawns: layout.monsterSpawns.map(point => [point[0] + offsetX, point[1] + offsetY, point[2] + offsetZ]),
      navigationPoints: layout.navigationPoints.map(point => [point[0] + offsetX, point[1] + offsetY, point[2] + offsetZ])
    };
  }

  function inspect(seed) {
    return summarizeLayout(buildLayout(seed || "preview"), {x: 0, y: 0, z: 0});
  }

  function generate(seed) {
    const layout = buildLayout(seed || "preview");
    renderLayout(layout);
    const origin = byId(ROOT_ID);
    let offsetX = 100;
    let offsetY = 0;
    let offsetZ = 0;
    if (origin && origin.object3D && origin.object3D.position) {
      offsetX = origin.object3D.position.x;
      offsetY = origin.object3D.position.y;
      offsetZ = origin.object3D.position.z;
    } else if (origin) {
      const position = String(origin.getAttribute("position") || "100 0 0").split(/\s+/).map(Number);
      offsetX = Number.isFinite(position[0]) ? position[0] : 100;
      offsetY = Number.isFinite(position[1]) ? position[1] : 0;
      offsetZ = Number.isFinite(position[2]) ? position[2] : 0;
    }
    return summarizeLayout(layout, {x: offsetX, y: offsetY, z: offsetZ});
  }

  window.WEIRD_VR_COMPLEX = Object.freeze({
    rootId: ROOT_ID,
    gridUnit: GRID_UNIT,
    mapSize: MAP_SIZE,
    ceilingHeight: LEVEL_HEIGHT,
    pieceDefinitions: PIECES,
    inspect,
    generate
  });

  const initialize = function () {
    generate("preview");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {once: true});
  } else {
    initialize();
  }
}());
