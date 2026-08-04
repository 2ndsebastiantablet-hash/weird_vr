(function () {
  "use strict";

  const byId = id => document.getElementById(id);

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

  function box(parent, position, size, color, options = {}) {
    return make("a-box", {
      position,
      width: size[0],
      height: size[1],
      depth: size[2],
      color,
      material: options.material,
      rotation: options.rotation,
      visible: options.visible,
      "locomotion-collider": options.collider === false ? null : `type:box;size:${size.join(" ")}`
    }, parent);
  }

  function cylinder(parent, position, radius, height, color, options = {}) {
    return make("a-cylinder", {
      position,
      radius,
      height,
      color,
      material: options.material,
      rotation: options.rotation,
      "locomotion-collider": options.collider === false ? null : `type:box;size:${radius * 2} ${height} ${radius * 2}`
    }, parent);
  }

  function plane(parent, position, width, height, color, options = {}) {
    return make("a-plane", {
      position,
      rotation: options.rotation || "-90 0 0",
      width,
      height,
      color,
      material: options.material,
      "locomotion-collider": options.collider ? `type:floor;size:${width} 0 ${height}` : null
    }, parent);
  }

  function light(parent, type, color, intensity, position, extra = "") {
    return make("a-entity", {
      position,
      light: `type:${type};color:${color};intensity:${intensity};castShadow:false${extra ? ";" + extra : ""}`
    }, parent);
  }

  function boundary(parent, halfSize, height = 6) {
    box(parent, `0 ${height / 2} -${halfSize}`, [halfSize * 2, height, .5], "#000000", {visible: false});
    box(parent, `0 ${height / 2} ${halfSize}`, [halfSize * 2, height, .5], "#000000", {visible: false});
    box(parent, `-${halfSize} ${height / 2} 0`, [.5, height, halfSize * 2], "#000000", {visible: false});
    box(parent, `${halfSize} ${height / 2} 0`, [.5, height, halfSize * 2], "#000000", {visible: false});
  }

  if (window.AFRAME && !AFRAME.components["light-flicker"]) {
    AFRAME.registerComponent("light-flicker", {
      schema: {
        base: {default: 2.5},
        amount: {default: .7},
        speed: {default: 7}
      },
      init() {
        this.seed = Math.random() * Math.PI * 2;
      },
      tick(time) {
        const lightComponent = this.el.components.light;
        if (!lightComponent || !lightComponent.light) return;
        const wave = Math.sin(time * .001 * this.data.speed + this.seed);
        const jitter = Math.sin(time * .0037 * this.data.speed + this.seed * 2.17) * .35;
        lightComponent.light.intensity = Math.max(.05, this.data.base + (wave + jitter) * this.data.amount);
      }
    });
  }

  function resetMap(id) {
    const root = byId(id);
    if (!root) return null;
    root.replaceChildren();
    return root;
  }

  function buildStreet() {
    const root = resetMap("match-map-street");
    if (!root) return;

    light(root, "hemisphere", "#8eb9ff", .82, "0 8 0", "groundColor:#191622");
    light(root, "directional", "#b7d3ff", 1.0, "-8 14 7");
    const pinkLight = light(root, "point", "#ff3ea5", 3.1, "-10 4 -8", "distance:24;decay:2");
    pinkLight.setAttribute("animation__pulse", "property:light.intensity;from:2.2;to:3.8;dur:1500;dir:alternate;loop:true;easing:easeInOutSine");
    const blueLight = light(root, "point", "#20d9ff", 3.0, "11 4 8", "distance:24;decay:2");
    blueLight.setAttribute("animation__pulse", "property:light.intensity;from:2.1;to:3.5;dur:1900;dir:alternate;loop:true;easing:easeInOutSine");
    const sweep = light(root, "point", "#ffd36a", 2.4, "-12 4 0", "distance:18;decay:2");
    sweep.setAttribute("animation__sweep", "property:position;from:-12 4 0;to:12 4 0;dur:7000;dir:alternate;loop:true;easing:easeInOutSine");

    plane(root, "0 0 0", 52, 52, "#181b24", {collider: true, material: "roughness:1"});
    plane(root, "0 .012 0", 11, 52, "#252a34", {collider: false});
    plane(root, "0 .014 0", 11, 52, "#252a34", {collider: false, rotation: "-90 0 90"});
    box(root, "-7 .12 0", [.25, .05, 52], "#f4d66b", {collider: false});
    box(root, "7 .12 0", [.25, .05, 52], "#f4d66b", {collider: false});
    box(root, "0 .12 -7", [52, .05, .25], "#f4d66b", {collider: false});
    box(root, "0 .12 7", [52, .05, .25], "#f4d66b", {collider: false});

    for (const x of [-4, -2.4, -.8, .8, 2.4, 4]) {
      box(root, `${x} .04 11`, [.7, .04, 4], "#d9e1ee", {collider: false});
      box(root, `${x} .04 -11`, [.7, .04, 4], "#d9e1ee", {collider: false});
    }

    const buildings = [
      {p:"-16 4 -16", s:[9,8,9], c:"#34384a", accent:"#ff3ea5", sign:"NIGHT BYTE"},
      {p:"16 5 -16", s:[9,10,9], c:"#2d3444", accent:"#20d9ff", sign:"ARCADE"},
      {p:"-16 5 16", s:[9,10,9], c:"#303a3e", accent:"#8eff9b", sign:"NOODLES"},
      {p:"16 3.5 16", s:[9,7,9], c:"#413641", accent:"#ffbe62", sign:"MARKET"},
      {p:"-19 2 1", s:[6,4,9], c:"#3c3148", accent:"#a58cff", sign:"CLUB"},
      {p:"19 2 -1", s:[6,4,9], c:"#31414b", accent:"#52f1df", sign:"MOTEL"}
    ];

    for (const building of buildings) {
      box(root, building.p, building.s, building.c, {material:"roughness:.76;metalness:.08"});
      const [px, py, pz] = building.p.split(" ").map(Number);
      const frontZ = pz + (pz < 0 ? building.s[2] / 2 + .03 : -building.s[2] / 2 - .03);
      box(root, `${px} ${Math.max(2.5, py)} ${frontZ}`, [Math.min(5.5, building.s[0] - 1), 1.0, .07], building.accent, {
        collider:false,
        material:`color:${building.accent};emissive:${building.accent};emissiveIntensity:1.9`
      });
      make("a-text", {
        value: building.sign,
        align: "center",
        width: "4.2",
        color: "#ffffff",
        position: `${px} ${Math.max(2.5, py)} ${frontZ + (pz < 0 ? .05 : -.05)}`,
        rotation: pz < 0 ? "0 0 0" : "0 180 0"
      }, root);

      const rows = Math.max(1, Math.floor(building.s[1] / 2.5));
      for (let row = 0; row < rows; row++) {
        for (const offset of [-2.4, 0, 2.4]) {
          box(root,
            `${px + Math.max(-building.s[0]/2 + .8, Math.min(building.s[0]/2 - .8, offset))} ${1.5 + row * 2.1} ${frontZ + (pz < 0 ? .01 : -.01)}`,
            [1.25, 1.25, .045],
            "#7dbdff",
            {collider:false, material:"color:#7dbdff;emissive:#3d7cff;emissiveIntensity:.85"});
        }
      }
    }

    box(root, "-8 .6 4", [3,1.2,2], "#485466");
    box(root, "9 .8 -4", [4,1.6,2.2], "#54415d");
    box(root, "-4 1.2 -11", [2.4,2.4,2.4], "#31515c");
    box(root, "4 .45 12", [5,.9,2], "#78495c");
    cylinder(root, "0 1 0", 2.3, 2, "#30364b");
    make("a-torus", {
      position:"0 2.15 0",
      radius:"2",
      "radius-tubular":".12",
      rotation:"90 0 0",
      material:"color:#ff4dc4;emissive:#ff179f;emissiveIntensity:2",
      animation:"property:rotation;to:90 360 0;dur:6500;loop:true;easing:linear"
    }, root);

    const lampData = [
      ["-8 0 -8","#ff5fb8"],
      ["8 0 8","#5deaff"],
      ["-8 0 8","#ffd56d"],
      ["8 0 -8","#a58cff"]
    ];
    for (const [position, color] of lampData) {
      const lamp = make("a-entity", {position}, root);
      cylinder(lamp, "0 2 0", .08, 4, "#11141d", {collider:false});
      make("a-sphere", {
        radius:".18",
        position:"0 4.05 0",
        material:`color:${color};emissive:${color};emissiveIntensity:2`
      }, lamp);
    }

    boundary(root, 26);
  }

  function buildMansion() {
    const root = resetMap("match-map-mansion");
    if (!root) return;

    light(root, "hemisphere", "#66769b", .56, "0 8 0", "groundColor:#1a1112");
    light(root, "directional", "#9fb8ff", .72, "-10 12 -8");
    const chandelierLight = light(root, "point", "#ffb86a", 3.3, "0 5 -2", "distance:23;decay:2");
    chandelierLight.setAttribute("light-flicker", "base:3.2;amount:.45;speed:2.5");
    const fireLight = light(root, "point", "#ff5a36", 3.1, "-16.5 2 -12", "distance:16;decay:2");
    fireLight.setAttribute("light-flicker", "base:3;amount:.8;speed:8");
    const ghostLight = light(root, "point", "#6d78ff", 2.6, "9 2.8 9", "distance:18;decay:2");
    ghostLight.setAttribute("animation__wander", "property:position;from:9 2.8 9;to:4 4 -7;dur:9000;dir:alternate;loop:true;easing:easeInOutSine");

    plane(root, "0 0 0", 48, 48, "#281d1b", {collider:true, material:"roughness:.94"});
    plane(root, "0 .016 -1", 5, 36, "#6e1730", {collider:false});

    box(root, "0 2.2 -23.7", [48,4.4,.6], "#413632");
    box(root, "-23.7 2.2 0", [.6,4.4,48], "#413632");
    box(root, "23.7 2.2 0", [.6,4.4,48], "#413632");
    box(root, "-14 2.2 12", [.5,4.4,23], "#544843");
    box(root, "14 2.2 10", [.5,4.4,27], "#544843");
    box(root, "-7 2.2 -11", [.5,4.4,17], "#544843");
    box(root, "7 2.2 -11", [.5,4.4,17], "#544843");

    const steps = [
      ["-3.8 .3 -7",[3.6,.6,4]],["-3.8 .75 -10",[3.6,1.5,2]],["-3.8 1.25 -12",[3.6,2.5,2]],
      ["3.8 .3 -7",[3.6,.6,4]],["3.8 .75 -10",[3.6,1.5,2]],["3.8 1.25 -12",[3.6,2.5,2]]
    ];
    for (const [position, size] of steps) box(root, position, size, "#51433a");
    box(root, "0 2.75 -15.5", [14,.5,5], "#4a3b34");
    box(root, "0 3.3 -12.9", [14,1.1,.18], "#21191a");

    cylinder(root, "0 5.7 -2", .06, 3.2, "#171213", {collider:false});
    make("a-torus", {position:"0 4.25 -2",radius:"1.4","radius-tubular":".09",color:"#a88752",rotation:"90 0 0"}, root);
    for (const position of ["1.4 4.25 -2","-1.4 4.25 -2","0 4.25 -.6","0 4.25 -3.4"]) {
      make("a-sphere", {position,radius:".13",material:"color:#ffd69b;emissive:#ffb35c;emissiveIntensity:2"}, root);
    }

    box(root, "-16.5 1.8 -13", [6.5,3.6,.8], "#302a2a");
    box(root, "-16.5 .9 -12.55", [2.8,1.8,.2], "#090909", {collider:false});
    make("a-cone", {
      position:"-16.9 .7 -12.35",
      "radius-bottom":".55",
      "radius-top":".08",
      height:"1.2",
      material:"color:#ff7a28;emissive:#ff3d12;emissiveIntensity:2",
      animation__flame:"property:scale;from:1 .75 1;to:.7 1.15 .7;dur:360;dir:alternate;loop:true;easing:easeInOutSine"
    }, root);
    make("a-cone", {
      position:"-16.1 .65 -12.35",
      "radius-bottom":".45",
      "radius-top":".05",
      height:"1",
      material:"color:#ffd04b;emissive:#ff8a18;emissiveIntensity:2",
      animation__flame:"property:scale;from:.8 1.15 .8;to:1 .7 1;dur:430;dir:alternate;loop:true;easing:easeInOutSine"
    }, root);

    box(root, "18 1.6 -15", [1.2,3.2,12], "#3d241c");
    box(root, "15 1.6 -19", [5,3.2,1.2], "#3d241c");
    box(root, "8 .65 12", [7,1.3,3], "#4a2f26");
    cylinder(root, "5 .65 12", .25, 1.3, "#261a17", {collider:false});
    cylinder(root, "11 .65 12", .25, 1.3, "#261a17", {collider:false});
    box(root, "8 .55 8.5", [2,1.1,2], "#4d3830");
    box(root, "8 .55 15.5", [2,1.1,2], "#4d3830");

    for (const position of ["-9 2.4 0","9 2.4 0","-9 2.4 -8","9 2.4 -8"]) {
      cylinder(root, position, .55, 4.8, "#7f746b");
    }
    cylinder(root, "-18 .5 10", .75, 1, "#5a535a");
    make("a-sphere", {position:"-18 1.35 10",radius:"1.2",color:"#77717d","locomotion-collider":"type:box;size:2.4 2.4 2.4"}, root);

    for (const [position, rotation] of [["-23.35 2.7 -9","0 90 0"],["23.35 2.7 9","0 -90 0"]]) {
      make("a-circle", {
        position,
        rotation,
        radius:"1.6",
        material:"color:#6b7cff;emissive:#273d9e;emissiveIntensity:1.3"
      }, root);
    }

    box(root, "0 3 24", [48,6,.5], "#000000", {visible:false});
  }

  function pine(parent, position, scale = 1, colors = ["#174b2e","#1d6037"]) {
    const tree = make("a-entity", {position, scale:`${scale} ${scale} ${scale}`}, parent);
    cylinder(tree, "0 3 0", .42, 6, "#553923");
    make("a-cone", {"radius-bottom":"3","radius-top":".15",height:"7",position:"0 7.5 0",color:colors[0]}, tree);
    make("a-cone", {"radius-bottom":"2.3","radius-top":".1",height:"5.5",position:"0 10.2 0",color:colors[1]}, tree);
    return tree;
  }

  function buildForest() {
    const root = resetMap("match-map-forest");
    if (!root) return;

    light(root, "hemisphere", "#789fd0", .7, "0 9 0", "groundColor:#101d17");
    light(root, "directional", "#a9cfff", 1.25, "-12 18 -8");
    const fireLight = light(root, "point", "#ff8c36", 3.8, "0 1.7 7", "distance:19;decay:2");
    fireLight.setAttribute("light-flicker", "base:3.7;amount:.9;speed:7");
    const spiritLight = light(root, "point", "#66e6ff", 2.4, "-12 2.7 -10", "distance:18;decay:2");
    spiritLight.setAttribute("animation__drift", "property:position;from:-12 2.7 -10;to:10 4 5;dur:11000;dir:alternate;loop:true;easing:easeInOutSine");

    plane(root, "0 0 0", 56, 56, "#182d22", {collider:true, material:"roughness:1"});
    make("a-circle", {position:"0 .018 7",rotation:"-90 0 0",radius:"6",color:"#493c2c"}, root);
    plane(root, "-10 .025 0", 5, 52, "#203d48", {collider:false, material:"opacity:.85;transparent:true"});
    box(root, "-10 .22 7", [7,.44,3], "#594532");
    box(root, "-10 .48 4.8", [7,.35,.35], "#30251d", {collider:false});
    box(root, "-10 .48 9.2", [7,.35,.35], "#30251d", {collider:false});

    cylinder(root, "0 .28 7", 1.1, .45, "#3b3330");
    make("a-cone", {
      position:"-.32 1.05 7",
      "radius-bottom":".65",
      "radius-top":".05",
      height:"1.7",
      material:"color:#ff6a24;emissive:#ff3514;emissiveIntensity:2.2",
      animation__flame:"property:scale;from:.8 .8 .8;to:1.05 1.2 1.05;dur:360;dir:alternate;loop:true;easing:easeInOutSine"
    }, root);
    make("a-cone", {
      position:".35 .9 7.1",
      "radius-bottom":".5",
      "radius-top":".04",
      height:"1.4",
      material:"color:#ffd94f;emissive:#ff8a1e;emissiveIntensity:2.4",
      animation__flame:"property:scale;from:1 1.15 1;to:.75 .75 .75;dur:410;dir:alternate;loop:true;easing:easeInOutSine"
    }, root);

    const trees = [
      ["-18 0 -14",1],["-8 0 -18",.9],["6 0 -18",1.08],["19 0 -12",.95],
      ["-22 0 3",.88],["21 0 5",1],["-18 0 19",.82],["15 0 21",.94],
      ["4 0 24",.8],["-2 0 -24",.92],["24 0 18",.78],["-25 0 -9",.86]
    ];
    trees.forEach((tree, index) => pine(root, tree[0], tree[1], index % 2 ? ["#1a5131","#236a3c"] : ["#174b2e","#1d6037"]));

    box(root, "11 .35 -5", [9,.7,7], "#394445");
    box(root, "8 2.4 -7", [.8,4.8,.8], "#596363");
    box(root, "14 2.4 -7", [.8,4.8,.8], "#596363");
    box(root, "11 4.55 -7", [7,.7,.9], "#596363");
    make("a-torus", {
      position:"11 2.1 -6.7",
      radius:"1.5",
      "radius-tubular":".18",
      material:"color:#58a1a5;emissive:#1c6d78;emissiveIntensity:1.4",
      animation:"property:rotation;to:0 360 0;dur:10000;loop:true;easing:linear"
    }, root);

    const rocks = [
      ["a-dodecahedron",{position:"-3 1 -8",radius:"1.7",color:"#465051","locomotion-collider":"type:box;size:3 2.4 3"}],
      ["a-dodecahedron",{position:"-1 .6 -11",radius:"1.1",color:"#3c4647","locomotion-collider":"type:box;size:2 1.5 2"}],
      ["a-dodecahedron",{position:"18 1.2 11",radius:"2",color:"#404b4c","locomotion-collider":"type:box;size:3.5 2.8 3.5"}]
    ];
    rocks.forEach(([tag, attrs]) => make(tag, attrs, root));
    box(root, "-16 .7 11", [5,1.4,3], "#4a4e45", {rotation:"0 18 0"});
    box(root, "5 .45 15", [5,.9,2.4], "#4c4639", {rotation:"0 -22 0"});

    const fireflies = [
      ["-4 1.5 4","-1 3.4 1","#b8ff86",4200],
      ["5 2 2","8 4 -2","#8fffff",5300],
      ["-8 1.5 13","-5 3.2 16","#d6ff8a",4800],
      ["13 2 14","9 3.7 10","#89dfff",6100]
    ];
    for (const [from, to, color, duration] of fireflies) {
      make("a-sphere", {
        radius:".06",
        position:from,
        material:`color:${color};emissive:${color};emissiveIntensity:2`,
        animation:`property:position;from:${from};to:${to};dur:${duration};dir:alternate;loop:true;easing:easeInOutSine`
      }, root);
    }

    make("a-sphere", {
      position:"-18 19 -24",
      radius:"3.2",
      material:"color:#d8e8ff;emissive:#7da4e8;emissiveIntensity:1.3"
    }, root);
    make("a-cone", {position:"-25 6 -25","radius-bottom":"8","radius-top":"0",height:"12",color:"#101c20"}, root);
    make("a-cone", {position:"0 7 -28","radius-bottom":"10","radius-top":"0",height:"14",color:"#0e191e"}, root);
    make("a-cone", {position:"25 5 -25","radius-bottom":"7","radius-top":"0",height:"10",color:"#111d20"}, root);

    boundary(root, 28);
  }

  function buildAllMaps() {
    buildStreet();
    buildMansion();
    buildForest();
    console.info("[WEIRD VR] Rebuilt all match maps with optimized A-Frame geometry.");
  }

  buildAllMaps();
}());
