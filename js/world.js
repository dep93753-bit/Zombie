// The Stage 1 test area: foggy ground, lighting and a few rocks for cover and scale.
import * as THREE from 'three';

export const ARENA_RADIUS = 45;
const FOG_COLOR = 0x8e9a94;

export function createWorld(scene) {
  scene.background = new THREE.Color(FOG_COLOR);
  scene.fog = new THREE.Fog(FOG_COLOR, 8, 55);

  const hemi = new THREE.HemisphereLight(0xc9d6e0, 0x3a4630, 1.4);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe2c0, 1.6);
  sun.position.set(20, 30, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const s = 30;
  Object.assign(sun.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 80 });
  scene.add(sun, sun.target);

  // Fog is calculated per vertex, so the ground needs many small triangles;
  // a few huge ones make nearby ground look fully fogged.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220, 80, 80),
    new THREE.MeshStandardMaterial({ color: 0x4d5a3c, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Rocks: solid for both the player and bullets.
  const obstacles = [];
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6e6f68, roughness: 0.95, flatShading: true });
  const rng = mulberry32(7);
  for (let i = 0; i < 28; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 8 + rng() * (ARENA_RADIUS - 10);
    const r = 0.6 + rng() * 1.4;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat);
    rock.position.set(Math.cos(angle) * dist, r * 0.5, Math.sin(angle) * dist);
    rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
    rock.scale.y = 0.7;
    rock.castShadow = rock.receiveShadow = true;
    scene.add(rock);
    obstacles.push({ mesh: rock, x: rock.position.x, z: rock.position.z, r: r * 0.9 });
  }

  // A ring of tall dark posts marks the edge of the play area through the fog.
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2e2a24, roughness: 1 });
  const postGeo = new THREE.CylinderGeometry(0.25, 0.35, 7, 6);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(Math.cos(a) * (ARENA_RADIUS + 2), 3.5, Math.sin(a) * (ARENA_RADIUS + 2));
    post.castShadow = true;
    scene.add(post);
  }

  return { obstacles, sun };
}

// Pushes a circle at (pos.x, pos.z) with the given radius out of rocks and back inside the arena.
export function resolveCollisions(pos, radius, obstacles) {
  for (const o of obstacles) {
    const dx = pos.x - o.x, dz = pos.z - o.z;
    const min = o.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      pos.x = o.x + (dx / d) * min;
      pos.z = o.z + (dz / d) * min;
    }
  }
  const d = Math.hypot(pos.x, pos.z);
  if (d > ARENA_RADIUS) {
    pos.x *= ARENA_RADIUS / d;
    pos.z *= ARENA_RADIUS / d;
  }
}

// Small seeded random generator so the rock layout is the same every time.
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
