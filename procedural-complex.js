(function () {
  "use strict";

  const ROOT_ID = "match-map-complex";
  const MAP_SIZE = 72;
  const HALF_SIZE = MAP_SIZE / 2;
  const GRID_UNIT = 6;
  const WALL_HEIGHT = 6;

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

  function ensureCheckerTexture() {
    let canvas = byId("complex-checker-texture");
    if (canvas) return canvas;

    canvas = document.createElement("canvas");
    canvas.id = "complex-checker-texture";
    canvas.width = 256;
    canvas.height = 256;
    canvas.hidden = true;

    const context = canvas.getContext("2d");
    context.fillStyle = "#050505";
    context.fillRect(0, 0, 256, 256);
    context.fillStyle = "#16181d";
    context.fillRect(0, 0, 128, 128);
    context.fillRect(128, 128, 128, 128);

    document.body.appendChild(canvas);
    return canvas;
  }

  function box(parent, position, size, color, options = {}) {
    return make("a-box", {
      position,
      width: size[0],
      height: size[1],
      depth: size[2],
      color,
      material: options.material,
      visible: options.visible,
      "locomotion-collider": options.collider === false ? null : `type:box;size:${size.join(" ")}`
    }, parent);
  }

  function addBoundary(root) {
    box(root, `0 ${WALL_HEIGHT / 2} -${HALF_SIZE}`, [MAP_SIZE, WALL_HEIGHT, .6], "#050608");
    box(root, `0 ${WALL_HEIGHT / 2} ${HALF_SIZE}`, [MAP_SIZE, WALL_HEIGHT, .6], "#050608");
    box(root, `-${HALF_SIZE} ${WALL_HEIGHT / 2} 0`, [.6, WALL_HEIGHT, MAP_SIZE], "#050608");
    box(root, `${HALF_SIZE} ${WALL_HEIGHT / 2} 0`, [.6, WALL_HEIGHT, MAP_SIZE], "#050608");
  }

  function addWallWithOpening(root, axis, fixed, openingCenter, openingWidth, length) {
    const half = length / 2;
    const leftLength = openingCenter - openingWidth / 2 + half;
    const rightStart = openingCenter + openingWidth / 2;
    const rightLength = half - rightStart;

    if (leftLength > .1) {
      const center = -half + leftLength / 2;
      const position = axis === "x" ? `${center} 3 ${fixed}` : `${fixed} 3 ${center}`;
      const size = axis === "x" ? [leftLength, 6, .45] : [.45, 6, leftLength];
      box(root, position, size, "#11141a", {material: "roughness:.92;metalness:.04"});
    }

    if (rightLength > .1) {
      const center = rightStart + rightLength / 2;
      const position = axis === "x" ? `${center} 3 ${fixed}` : `${fixed} 3 ${center}`;
      const size = axis === "x" ? [rightLength, 6, .45] : [.45, 6, rightLength];
      box(root, position, size, "#11141a", {material: "roughness:.92;metalness:.04"});
    }
  }

  function buildStartHub(root) {
    const hubSize = 18;
    const doorway = 5;
    const half = hubSize / 2;

    addWallWithOpening(root, "x", -half, 0, doorway, hubSize);
    addWallWithOpening(root, "x", half, 0, doorway, hubSize);
    addWallWithOpening(root, "z", -half, 0, doorway, hubSize);
    addWallWithOpening(root, "z", half, 0, doorway, hubSize);

    for (const position of ["-6 1.25 -6", "6 1.25 -6", "-6 1.25 6", "6 1.25 6"]) {
      box(root, position, [2.2, 2.5, 2.2], "#262b37", {
        material: "roughness:.72;metalness:.12"
      });
    }

    box(root, "0 .35 0", [5, .7, 5], "#303749", {
      material: "roughness:.68;metalness:.1"
    });

    make("a-torus", {
      position: "0 3 0",
      radius: "2.3",
      "radius-tubular": ".1",
      material: "color:#7068ff;emissive:#3d35cc;emissiveIntensity:1.5",
      animation: "property:rotation;to:0 360 0;dur:9000;loop:true;easing:linear"
    }, root);

    make("a-text", {
      value: "PROCEDURAL COMPLEX",
      align: "center",
      width: "6",
      color: "#ffffff",
      position: "0 4.8 -8.7"
    }, root);
  }

  function buildConnectorMarkers(root) {
    const markers = [
      {position: "0 .05 -12", rotation: "-90 0 0"},
      {position: "0 .05 12", rotation: "-90 0 0"},
      {position: "-12 .05 0", rotation: "-90 0 0"},
      {position: "12 .05 0", rotation: "-90 0 0"}
    ];

    for (const marker of markers) {
      make("a-ring", {
        position: marker.position,
        rotation: marker.rotation,
        "radius-inner": "1.8",
        "radius-outer": "2.1",
        material: "color:#7f78ff;emissive:#4840d6;emissiveIntensity:1.4"
      }, root);
    }
  }

  function generate(seed) {
    const root = byId(ROOT_ID);
    if (!root) return;

    ensureCheckerTexture();
    root.replaceChildren();
    root.dataset.mapSeed = String(seed || "preview");

    make("a-entity", {
      light: "type:hemisphere;color:#8f9cb7;groundColor:#060608;intensity:.68"
    }, root);
    make("a-entity", {
      position: "-12 18 8",
      light: "type:directional;color:#cbd8ff;intensity:.82;castShadow:false"
    }, root);
    make("a-entity", {
      position: "0 5 0",
      light: "type:point;color:#7168ff;intensity:2.2;distance:26;decay:2",
      animation__pulse: "property:light.intensity;from:1.7;to:2.6;dur:1800;dir:alternate;loop:true;easing:easeInOutSine"
    }, root);

    make("a-plane", {
      position: "0 0 0",
      rotation: "-90 0 0",
      width: MAP_SIZE,
      height: MAP_SIZE,
      material: "src:#complex-checker-texture;repeat:12 12;roughness:1;metalness:0",
      "locomotion-collider": `type:floor;size:${MAP_SIZE} 0 ${MAP_SIZE}`
    }, root);

    addBoundary(root);
    buildStartHub(root);
    buildConnectorMarkers(root);

    make("a-text", {
      value: `SEED ${String(seed || "PREVIEW").toUpperCase()}`,
      align: "center",
      width: "3.4",
      color: "#9aa7cc",
      position: "0 2.1 -8.72"
    }, root);
  }

  window.WEIRD_VR_COMPLEX = Object.freeze({
    rootId: ROOT_ID,
    gridUnit: GRID_UNIT,
    mapSize: MAP_SIZE,
    generate
  });

  const initialize = () => generate("preview");
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, {once: true});
  } else {
    initialize();
  }
}());
