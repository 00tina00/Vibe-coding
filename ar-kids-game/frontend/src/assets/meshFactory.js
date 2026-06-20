import * as THREE from "three";

function addGlow(mesh, color) {
  const glow = new THREE.PointLight(color, 1.2, 4);
  glow.position.set(0, 0, 0.5);
  mesh.add(glow);
  mesh.userData.glow = glow;
}

function createStar(color) {
  const shape = new THREE.Shape();
  const outer = 0.5;
  const inner = 0.22;
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.15,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    })
  );
  addGlow(mesh, color);
  return mesh;
}

function createSun(color) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    })
  );
  group.add(core);
  for (let i = 0; i < 8; i++) {
    const ray = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.3, 8),
      new THREE.MeshStandardMaterial({
        color: "#FFE066",
        emissive: "#FFE066",
        emissiveIntensity: 0.3,
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    ray.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0);
    ray.rotation.z = angle - Math.PI / 2;
    group.add(ray);
  }
  addGlow(group, color);
  return group;
}

function createCloud(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.2,
    roughness: 0.5,
  });
  const blobs = [
    [-0.25, 0, 0.25],
    [0.2, 0.05, 0.3],
    [0, -0.05, 0.28],
    [0.45, 0, 0.22],
  ];
  blobs.forEach(([x, y, s]) => {
    const part = new THREE.Mesh(new THREE.SphereGeometry(s, 12, 12), mat.clone());
    part.position.set(x, y, 0);
    group.add(part);
  });
  addGlow(group, color);
  return group;
}

function createRainbow(color) {
  const group = new THREE.Group();
  const colors = ["#FF0000", "#FF9500", "#FFD700", "#4CAF50", "#2196F3", "#9C27B0"];
  colors.forEach((c, i) => {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.45 - i * 0.06, 0.04, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.25 })
    );
    arc.rotation.z = Math.PI;
    group.add(arc);
  });
  addGlow(group, color);
  return group;
}

function createHeart(color) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.25);
  shape.bezierCurveTo(0, 0.25, -0.25, 0, -0.25, -0.1);
  shape.bezierCurveTo(-0.25, -0.35, 0, -0.45, 0, -0.6);
  shape.bezierCurveTo(0, -0.45, 0.25, -0.35, 0.25, -0.1);
  shape.bezierCurveTo(0.25, 0, 0, 0.25, 0, 0.25);
  const mesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.15,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    }),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
  );
  mesh.scale.set(0.9, 0.9, 0.9);
  addGlow(mesh, color);
  return mesh;
}

function createRocket(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.7, 12),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
  );
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.15, 0.25, 12),
    new THREE.MeshStandardMaterial({ color: "#FF6B6B", emissive: "#FF6B6B", emissiveIntensity: 0.3 })
  );
  nose.position.y = 0.45;
  const finMat = new THREE.MeshStandardMaterial({ color: "#FFE066" });
  [-1, 1].forEach((side) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.25), finMat);
    fin.position.set(side * 0.2, -0.25, 0);
    fin.rotation.z = side * 0.4;
    group.add(fin);
  });
  group.add(body, nose);
  addGlow(group, color);
  return group;
}

function createTeddy(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.2,
    roughness: 0.6,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 14), mat);
  body.scale.set(1, 1.1, 0.9);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), mat.clone());
  head.position.y = 0.45;
  [-0.18, 0.18].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat.clone());
    ear.position.set(x, 0.65, 0);
    group.add(ear);
  });
  group.add(body, head);
  addGlow(group, color);
  return group;
}

function createButterfly(color) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.06, 0.4, 4, 8),
    new THREE.MeshStandardMaterial({ color: "#333" })
  );
  const wingMat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), wingMat.clone());
    wing.position.set(side * 0.28, 0.05, 0);
    wing.rotation.y = side * 0.3;
    group.add(wing);
  });
  group.add(body);
  addGlow(group, color);
  return group;
}

function createDinosaur(color) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.25,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), mat);
  body.scale.set(1.2, 0.9, 0.8);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), mat.clone());
  head.position.set(0.35, 0.15, 0);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), mat.clone());
  tail.position.set(-0.4, 0, 0);
  tail.rotation.z = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), mat.clone());
    spike.position.set(-0.1 + i * 0.12, 0.25, 0);
    group.add(spike);
  }
  group.add(body, head, tail);
  addGlow(group, color);
  return group;
}

const BUILDERS = {
  star: createStar,
  sun: createSun,
  cloud: createCloud,
  rainbow: createRainbow,
  heart: createHeart,
  rocket: createRocket,
  teddy: createTeddy,
  butterfly: createButterfly,
  dinosaur: createDinosaur,
};

export function createProceduralMesh(itemId, itemConfig) {
  const builder = BUILDERS[itemId];
  if (!builder) {
    return new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: itemConfig.color || "#FFD700" })
    );
  }
  const mesh = builder(itemConfig.color);
  mesh.scale.setScalar(itemConfig.scale || 1);
  return mesh;
}
