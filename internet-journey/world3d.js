/**
 * Three.js miniature post office — floors, walls, props, character, path
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const COLORS = {
  floor: 0xc4a882,
  floorDark: 0xa89070,
  wall: 0xd9c4a8,
  wallDark: 0xb8a088,
  wood: 0x6b4f3a,
  concrete: 0x5a6068,
  accent: 0x3ecf8e,
  accentBlue: 0x4da3ff,
  glowGreen: 0x2ee87a,
  skin: 0xf0c8a0,
  jacket: 0xe87830,
  envelope: 0xf5e6c8,
};

/** Department layout on XZ plane */
export const DEPARTMENTS = [
  { id: 0, name: "Client", pos: [-42, 0, -32], size: [12, 9, 5.5] },
  { id: 1, name: "DNS", pos: [-42, 0, -14], size: [12, 9, 5.5] },
  { id: 2, name: "IP", pos: [-24, 0, -14], size: [12, 9, 5.5] },
  { id: 3, name: "Packet", pos: [-24, 0, 6], size: [12, 10, 5.5] },
  { id: 4, name: "TCP", pos: [-4, 0, 6], size: [12, 9, 5.5] },
  { id: 5, name: "Handshake", pos: [-4, 0, -10], size: [11, 9, 5] },
  { id: 6, name: "HTTP", pos: [16, 0, -24], size: [12, 9, 5.5] },
  { id: 7, name: "TLS", pos: [36, 0, -24], size: [12, 9, 5.5] },
  { id: 8, name: "Server", pos: [36, 0, 8], size: [13, 10, 6] },
  { id: 9, name: "Response", pos: [14, 0, 30], size: [14, 11, 5.5] },
];

const PATH_POINTS = DEPARTMENTS.map((d) => new THREE.Vector3(d.pos[0], 0.15, d.pos[2]));

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class PostOfficeWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.departments = [];
    this.animations = [];
    this.activeStage = 0;
    this.pathProgress = 0.1;
    this.isWalking = false;
    this.focusAnim = null;
    this.handshakeGroup = null;
  }

  init() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x121820);
    this.scene.fog = null;

    this.camera = new THREE.PerspectiveCamera(42, w / h, 0.5, 400);
    this.camera.position.set(55, 48, 55);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 18;
    this.controls.maxDistance = 120;
    this.controls.maxPolarAngle = Math.PI / 2.15;
    this.controls.target.set(0, 2, 0);
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    this._lights();
    this._ground();
    this._buildDepartments();
    this._buildPath();
    this._buildConnectors();
    this.character = this._createCharacter();
    this.scene.add(this.character);
    this.placeCharacterAt(0);

    this.focusStage(0, false);
    this._loop = this._animate.bind(this);
    this._loop();
  }

  _lights() {
    /* Even fill from all directions — stable at every zoom & orbit angle */
    const hemi = new THREE.HemisphereLight(0xfff8ee, 0xc4b8a8, 1.05);
    this.scene.add(hemi);

    const amb = new THREE.AmbientLight(0xffffff, 0.62);
    this.scene.add(amb);

    const sun = new THREE.DirectionalLight(0xfff5e8, 0.55);
    sun.position.set(40, 70, 35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0003;
    sun.shadow.normalBias = 0.04;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 140;
    sun.shadow.camera.left = -65;
    sun.shadow.camera.right = 65;
    sun.shadow.camera.top = 65;
    sun.shadow.camera.bottom = -65;
    this.scene.add(sun);
    this.sun = sun;

    const fillPositions = [
      [-55, 40, -45],
      [55, 38, 45],
      [-50, 35, 50],
      [50, 35, -50],
      [0, 50, -60],
      [0, 45, 60],
    ];
    fillPositions.forEach(([x, y, z]) => {
      const fill = new THREE.DirectionalLight(0xffeedd, 0.32);
      fill.position.set(x, y, z);
      this.scene.add(fill);
    });
  }

  _ground() {
    const g = new THREE.PlaneGeometry(160, 160);
    const m = new THREE.MeshStandardMaterial({
      color: 0x2a3040,
      roughness: 0.88,
      metalness: 0.04,
      emissive: 0x151820,
      emissiveIntensity: 0.15,
    });
    const floor = new THREE.Mesh(g, m);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  _mat(color, opts = {}) {
    const baseEmissive =
      opts.emissive !== undefined ? opts.emissive : 0x1a1814;
    const baseIntensity =
      opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 0.06;
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.72,
      metalness: opts.metalness ?? 0.08,
      emissive: baseEmissive,
      emissiveIntensity: baseIntensity,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    });
  }

  _box(w, h, d, mat, x, y, z, parent, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Cutaway room: floor + 3 walls + ceiling strip + room light */
  _createRoomShell(parent, w, d, h) {
    const floor = this._box(w, 0.25, d, this._mat(COLORS.floor), 0, 0.12, 0, parent);
    floor.material.color.setHex(COLORS.floor);

    this._box(w, h, 0.2, this._mat(COLORS.wall), 0, h / 2 + 0.25, -d / 2, parent);
    this._box(0.2, h, d, this._mat(COLORS.wallDark), -w / 2, h / 2 + 0.25, 0, parent);
    this._box(0.2, h, d, this._mat(COLORS.wallDark, { opacity: 0.6, transparent: true }), w / 2, h / 2 + 0.25, 0, parent, false);

    const ceil = this._box(w, 0.12, d, this._mat(0x2a3040, { opacity: 0.35, transparent: true }), 0, h + 0.3, 0, parent, false);

    const light = new THREE.PointLight(0xffe8c8, 1.35, 28);
    light.position.set(0, h + 1.5, 0);
    parent.add(light);

    return { floor, light, shellMeshes: [floor] };
  }

  _buildDepartments() {
    const types = [
      "client",
      "dns",
      "ip",
      "packet",
      "tcp",
      "handshake",
      "http",
      "tls",
      "server",
      "response",
    ];

    DEPARTMENTS.forEach((dep, i) => {
      const group = new THREE.Group();
      group.position.set(dep.pos[0], dep.pos[1], dep.pos[2]);
      const [w, d, h] = dep.size;
      const shell = this._createRoomShell(group, w, d, h);
      const props = new THREE.Group();
      props.position.y = 0.25;
      group.add(props);
      this._addProps(props, types[i], w, d, h);

      const label = this._makeLabel(`${i + 1}. ${dep.name}`);
      label.position.set(0, h + 2.2, 0);
      group.add(label);

      group.userData = { stageId: i, shell, props, label, baseEmissive: 0 };
      this.scene.add(group);
      this.departments.push(group);
    });
  }

  _makeLabel(text) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(4, 4, 248, 56);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Vazirmatn, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 38);
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(8, 2, 1);
    return sprite;
  }

  _addProps(parent, type, w, d, h) {
    switch (type) {
      case "client":
        this._box(2.2, 0.9, 1.4, this._mat(COLORS.wood), -2, 0.45, 1, parent);
        this._lamp(parent, 2.5, 1.5);
        break;
      case "dns":
        for (let i = 0; i < 4; i++) {
          this._box(0.5, 2.2, 0.35, this._mat(0xd4a84b), -3 + i * 1.2, 1.1, -2.5, parent);
        }
        this._box(3, 2, 0.15, this._mat(0x2a4a6a, { emissive: 0x1a3050, emissiveIntensity: 0.3 }), 0, 1.2, -3.8, parent);
        this._worker(parent, 2.5, 2, 0x4a6a8a);
        break;
      case "ip":
        this._box(5, 2.8, 0.2, this._mat(0x0d1f14, { emissive: COLORS.glowGreen, emissiveIntensity: 0.35 }), 0, 1.6, -3.5, parent);
        for (let i = 0; i < 3; i++) {
          const tl = this._box(0.35, 0.35, 0.35, this._mat(i !== 1 ? COLORS.glowGreen : 0x333333, { emissive: i !== 1 ? COLORS.glowGreen : 0, emissiveIntensity: 0.8 }), -2 + i, 0.5, 1.5, parent);
          tl.userData.blink = true;
        }
        this._worker(parent, 2, 2.2, 0x5a4a3a);
        break;
      case "packet": {
        const belt = this._box(6, 0.3, 1.2, this._mat(0x555555), 0, 0.35, 0, parent);
        belt.userData.conveyor = true;
        this._box(1.4, 0.9, 1, this._mat(COLORS.envelope), -1.5, 0.7, 0, parent).userData.packetBig = true;
        for (let i = 0; i < 4; i++) {
          this._box(0.45, 0.35, 0.35, this._mat(COLORS.envelope), -2 + i * 0.9, 0.5, 1.2, parent).userData.miniPacket = true;
        }
        break;
      }
      case "tcp":
        this._box(1.2, 3.5, 0.8, this._mat(0x1a1a22), -3.5, 1.75, -2, parent);
        for (let i = 0; i < 3; i++) {
          this._box(1.8, 1.2, 0.12, this._mat(0x0a1628, { emissive: COLORS.accentBlue, emissiveIntensity: 0.5 }), -1 + i * 2, 1.5, -3.2, parent).userData.screen = true;
        }
        break;
      case "handshake": {
        this._createHandshakeScene(parent);
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.7),
          this._mat(COLORS.accentBlue, { emissive: COLORS.accentBlue, emissiveIntensity: 0.5, transparent: true, opacity: 0.6 })
        );
        cube.position.set(0, 1.6, 0.2);
        cube.userData.holo = true;
        parent.add(cube);
        break;
      }
      case "http":
        this._box(2.5, 2, 0.15, this._mat(0xc8b090), -2, 1.2, -3, parent);
        this._box(0.9, 0.9, 0.2, this._mat(0xe85d5d), 1.5, 0.6, 1, parent);
        this._box(1.2, 0.9, 0.8, this._mat(0xffffff), 2.5, 0.5, 1.5, parent);
        break;
      case "tls": {
        this._createLock3D(parent);
        this._worker(parent, 3.2, 1.8, 0x1a1a22);
        break;
      }
      case "server":
        for (let i = 0; i < 5; i++) {
          this._box(0.7, 3.2, 0.6, this._mat(0x0a0e14, { emissive: COLORS.glowGreen, emissiveIntensity: 0.15 }), -4 + i * 1.6, 1.6, -2, parent).userData.server = true;
        }
        break;
      case "response": {
        const truck = new THREE.Group();
        this._box(2.2, 1.2, 1.4, this._mat(0xf0f0f0), 0.8, 0.6, 0, truck);
        this._box(1.2, 1, 1.2, this._mat(0xe85d5d), -1.2, 0.55, 0, truck);
        truck.position.set(-3, 0, 2);
        truck.userData.truck = true;
        parent.add(truck);
        this._box(2, 1.4, 0.1, this._mat(0xffffff), 2, 0.9, -2, parent);
        break;
      }
      default:
        break;
    }
  }

  _lamp(parent, x, z) {
    const bulb = new THREE.PointLight(0xffcc88, 0.85, 12);
    bulb.position.set(x, 2.5, z);
    parent.add(bulb);
    this._box(0.25, 0.5, 0.25, this._mat(0xffcc66, { emissive: 0xffaa44, emissiveIntensity: 0.8 }), x, 1.2, z, parent);
  }

  _addBaseballCap(parent, headY) {
    const capMat = this._mat(0x1a4a8a, { roughness: 0.55 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 20), capMat);
    brim.position.set(0, headY + 0.1, 0.06);
    brim.rotation.x = 0.12;
    parent.add(brim);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      capMat
    );
    dome.position.set(0, headY + 0.18, -0.02);
    parent.add(dome);
  }

  _createPerson(suitColor = 0x2a3a4a, withCap = false) {
    const g = new THREE.Group();
    const suit = this._mat(suitColor);
    const skin = this._mat(COLORS.skin);

    this._box(0.52, 0.95, 0.38, suit, 0, 0.48, 0, g);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), skin);
    head.position.y = 1.18;
    head.castShadow = true;
    g.add(head);

    if (withCap) this._addBaseballCap(g, 1.18);

    const legL = this._box(0.2, 0.5, 0.2, this._mat(0x2a4a6a), -0.14, 0.25, 0, g);
    const legR = this._box(0.2, 0.5, 0.2, this._mat(0x2a4a6a), 0.14, 0.25, 0, g);
    legL.userData.leg = "l";
    legR.userData.leg = "r";

    const armL = new THREE.Group();
    armL.position.set(-0.34, 0.92, 0);
    const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), suit);
    armLMesh.position.y = -0.28;
    armLMesh.castShadow = true;
    armL.add(armLMesh);
    g.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.34, 0.92, 0);
    const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.55, 0.16), suit);
    armRMesh.position.y = -0.28;
    armRMesh.castShadow = true;
    armR.add(armRMesh);
    g.add(armR);

    g.userData.armL = armL;
    g.userData.armR = armR;
    g.userData.legs = [legL, legR];
    return g;
  }

  _worker(parent, x, z, color) {
    const g = this._createPerson(color, false);
    g.position.set(x, 0, z);
    parent.add(g);
    return g;
  }

  _createHandshakeScene(parent) {
    const group = new THREE.Group();
    group.userData.handshake = true;

    const spots = [
      { x: -2.4, z: -0.5, ry: 0.35 },
      { x: 2.4, z: -0.5, ry: -0.35 },
      { x: 0, z: 2.2, ry: Math.PI },
    ];

    const persons = spots.map((spot) => {
      const person = this._createPerson(0x2a3a4a, true);
      person.position.set(spot.x, 0, spot.z);
      person.rotation.y = spot.ry;
      person.userData.armL.rotation.x = -0.55;
      person.userData.armL.rotation.z = 0.35;
      person.userData.armR.rotation.x = -0.55;
      person.userData.armR.rotation.z = -0.35;
      group.add(person);
      return person;
    });

    group.userData.persons = persons;
    parent.add(group);
    this.handshakeGroup = group;
    return group;
  }

  _createLock3D(parent) {
    const g = new THREE.Group();
    g.position.set(0, 1.4, -0.5);
    g.userData.lock3d = true;

    const gold = this._mat(0xd4af37, { metalness: 0.65, roughness: 0.35 });
    const metal = this._mat(0x8a9098, { metalness: 0.75, roughness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.55), gold);
    body.position.y = 0.8;
    body.castShadow = true;
    g.add(body);

    const shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.1, 10, 24, Math.PI),
      metal
    );
    shackle.rotation.x = Math.PI;
    shackle.rotation.z = Math.PI;
    shackle.position.set(0, 1.75, 0);
    g.add(shackle);

    const keyhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12),
      this._mat(0x1a1a22)
    );
    keyhole.rotation.x = Math.PI / 2;
    keyhole.position.set(0, 0.85, 0.3);
    g.add(keyhole);

    this._box(0.06, 0.35, 0.06, this._mat(0x0a0a10), 0, 0.65, 0.32, g);

    const glow = new THREE.PointLight(0x4da3ff, 0.6, 8);
    glow.position.set(0, 1.2, 0.8);
    g.add(glow);

    parent.add(g);
    return g;
  }

  _createCharacter() {
    const g = this._createPerson(COLORS.jacket, true);
    g.scale.setScalar(1.42);

    const env = this._box(0.38, 0.28, 0.1, this._mat(COLORS.envelope), 0.4, 0.95, 0.22, g);
    env.userData.carry = true;

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 16),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.05;
    g.add(shadow);

    g.userData.carry = env;
    return g;
  }

  _buildPath() {
    const curve = new THREE.CatmullRomCurve3(PATH_POINTS, false, "catmullrom", 0.3);
    const pts = curve.getPoints(120);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.pathBase = new THREE.Line(
      geo,
      new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.8, gapSize: 0.5, opacity: 0.2, transparent: true })
    );
    this.pathBase.computeLineDistances();
    this.scene.add(this.pathBase);

    this.pathCurve = curve;
    this.pathGlow = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 100, 0.12, 6, false),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
    );
    this.pathGlow.position.y = 0.2;
    this.scene.add(this.pathGlow);
  }

  _buildConnectors() {
    const tubeMat = this._mat(0x6a707a, { metalness: 0.35, roughness: 0.5 });
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < PATH_POINTS.length - 1; i++) {
      const a = PATH_POINTS[i].clone().setY(0.35);
      const b = PATH_POINTS[i + 1].clone().setY(0.35);
      const dir = b.clone().sub(a);
      const len = dir.length();
      if (len < 0.1) continue;
      dir.normalize();

      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, len, 8), tubeMat);
      tube.position.copy(a).addScaledVector(dir, len / 2);
      tube.quaternion.setFromUnitVectors(up, dir);
      tube.castShadow = true;
      this.scene.add(tube);
    }
  }

  placeCharacterAt(stageIndex) {
    const p = PATH_POINTS[stageIndex];
    this.character.position.copy(p);
    this.character.position.y = 0;
  }

  setActiveStage(index) {
    this.activeStage = index;
    this.departments.forEach((dep, i) => {
      const active = i === index;
      const done = i < index;
      dep.traverse((obj) => {
        if (obj.isMesh && obj.material?.emissive) {
          if (active) {
            obj.material.emissive.setHex(0x3a2a10);
            obj.material.emissiveIntensity = 0.12;
          } else if (done) {
            obj.material.emissive.setHex(0x000000);
            obj.material.emissiveIntensity = 0;
          } else {
            obj.material.emissiveIntensity = 0;
          }
        }
      });
      dep.scale.setScalar(active ? 1.02 : 1);
      if (dep.userData.label) dep.userData.label.material.opacity = active ? 1 : 0.88;
    });
    this.pathProgress = (index + 1) / DEPARTMENTS.length;
    if (this.pathGlow) {
      this.pathGlow.material.opacity = 0.25 + this.pathProgress * 0.35;
    }
  }

  focusStage(index, animate = true) {
    const dep = DEPARTMENTS[index];
    const target = new THREE.Vector3(dep.pos[0], 2.5, dep.pos[2]);
    const offset = new THREE.Vector3(22, 20, 22);
    const desiredPos = target.clone().add(offset);

    if (!animate) {
      this.controls.target.copy(target);
      this.camera.position.copy(desiredPos);
      this.controls.update();
      return;
    }

    const startTarget = this.controls.target.clone();
    const startPos = this.camera.position.clone();
    const startTime = performance.now();
    const duration = 1400;

    if (this.focusAnim) cancelAnimationFrame(this.focusAnim);

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const e = easeInOutCubic(t);
      this.controls.target.lerpVectors(startTarget, target, e);
      this.camera.position.lerpVectors(startPos, desiredPos, e);
      this.controls.update();
      if (t < 1) this.focusAnim = requestAnimationFrame(step);
      else this.focusAnim = null;
    };
    this.focusAnim = requestAnimationFrame(step);
  }

  walkToStage(fromIndex, targetIndex, onComplete) {
    if (this.isWalking) return;
    this.isWalking = true;
    const start = fromIndex;

    const segments = [];
    if (targetIndex > start) {
      for (let i = start; i < targetIndex; i++) {
        segments.push({ a: PATH_POINTS[i], b: PATH_POINTS[i + 1] });
      }
    } else if (targetIndex < start) {
      for (let i = start; i > targetIndex; i--) {
        segments.push({ a: PATH_POINTS[i], b: PATH_POINTS[i - 1] });
      }
    } else {
      segments.push({ a: PATH_POINTS[start], b: PATH_POINTS[targetIndex] });
    }

    let seg = 0;
    let segStart = null;
    const DUR = 850;

    const tick = (now) => {
      if (!segStart) segStart = now;
      const s = segments[seg];
      const t = Math.min(1, (now - segStart) / DUR);
      const e = easeInOutCubic(t);
      this.character.position.lerpVectors(s.a, s.b, e);
      this.character.position.y = Math.sin(t * Math.PI * 4) * 0.06;
      const dir = s.b.clone().sub(s.a);
      if (dir.lengthSq() > 0.01) this.character.rotation.y = Math.atan2(dir.x, dir.z);

      const walk = Math.sin(now * 0.012) * 0.4;
      this.character.userData.legs?.forEach((leg, i) => {
        leg.rotation.x = (i === 0 ? 1 : -1) * walk;
      });

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        seg++;
        segStart = null;
        if (seg < segments.length) requestAnimationFrame(tick);
        else {
          this.isWalking = false;
          this.character.position.y = 0;
          this.character.userData.legs?.forEach((leg) => (leg.rotation.x = 0));
          if (onComplete) onComplete();
        }
      }
    };
    requestAnimationFrame(tick);
  }

  setCarryVisible(visible) {
    if (this.character?.userData.carry) {
      this.character.userData.carry.visible = visible;
    }
  }

  zoomBy(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.multiplyScalar(factor);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  resetView(stageIndex = 0) {
    this.controls.reset();
    this.focusStage(stageIndex, false);
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  _animate() {
    requestAnimationFrame(this._loop);
    const dt = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    this.controls.update();

    if (this.handshakeGroup && this.activeStage === 5) {
      this.handshakeGroup.userData.persons?.forEach((person, idx) => {
        const phase = t * 2.2 + idx * 0.7;
        const shake = Math.sin(phase) * 0.12;
        person.userData.armL.rotation.x = -0.55 + shake;
        person.userData.armR.rotation.x = -0.55 - shake;
        person.userData.armL.rotation.z = 0.35 + Math.sin(phase * 0.5) * 0.08;
        person.userData.armR.rotation.z = -0.35 - Math.sin(phase * 0.5) * 0.08;
      });
    }

    this.departments.forEach((dep, i) => {
      dep.traverse((obj) => {
        if (obj.userData.holo) {
          obj.rotation.y = t * 0.8;
          obj.rotation.x = Math.sin(t) * 0.15;
        }
        if (obj.userData.lock3d && i === this.activeStage) {
          if (obj.userData.baseY === undefined) obj.userData.baseY = obj.position.y;
          obj.rotation.y = Math.sin(t * 0.5) * 0.08;
          obj.position.y = obj.userData.baseY + Math.sin(t * 1.2) * 0.06;
        }
        if (obj.userData.screen) {
          obj.material.emissiveIntensity = 0.35 + Math.sin(t * 3 + obj.id) * 0.2;
        }
        if (obj.userData.server) {
          obj.material.emissiveIntensity = 0.1 + Math.sin(t * 5 + obj.id) * 0.15;
        }
        if (obj.isGroup && obj.userData.truck && i === this.activeStage) {
          obj.position.x = -3 + Math.sin(t * 0.8) * 1.5;
        }
        if (obj.userData.conveyor) {
          obj.position.z = Math.sin(t * 2) * 0.05;
        }
      });
    });

    if (!this.isWalking) {
      this.character.position.y = Math.sin(t * 2) * 0.03;
    }

    if (this.pathGlow) {
      this.pathGlow.material.opacity = 0.2 + this.pathProgress * 0.4 + Math.sin(t * 2) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
