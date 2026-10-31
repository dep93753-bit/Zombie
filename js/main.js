// Game setup, screens and the main loop.
import * as THREE from 'three';
import { loadAllModels } from './assets.js';
import { Input } from './input.js';
import { createWorld } from './world.js';
import { Player } from './player.js';
import { Weapon } from './weapon.js';
import { ZombieManager } from './zombies.js';
import { Effects } from './effects.js';
import { Hud } from './hud.js';

const $ = (id) => document.getElementById(id);
const screens = {
  loading: $('screen-loading'),
  title: $('screen-title'),
  pause: $('screen-pause'),
  dead: $('screen-dead'),
};

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) el.classList.toggle('hidden', key !== name);
}

// ---------- Renderer, scene, camera ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.03, 200);

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- Game objects ----------
const input = new Input(canvas);
const hud = new Hud();
let world, player, weapon, zombies, effects;
let state = 'loading'; // loading | title | playing | paused | dead
let kills = 0;

async function init() {
  await loadAllModels((p) => {
    $('loading-text').textContent = `Loading… ${Math.round(p * 100)}%`;
  });

  world = createWorld(scene);
  player = new Player(camera);
  weapon = new Weapon(camera, scene);
  zombies = new ZombieManager(scene);
  effects = new Effects(scene);
  zombies.onPlayerHit = () => hud.damageFlash();

  updateControlsHint();
  input.onTouchDetected = updateControlsHint;
  state = 'title';
  showScreen('title');
  // Render one frame so the title screen has the world behind it.
  player.update(0, input, world.obstacles);
  renderer.render(scene, camera);
}

function updateControlsHint() {
  $('controls-hint').textContent = input.isTouch
    ? 'Left side: move · Right side: look · FIRE to shoot · R to reload'
    : 'WASD move · Mouse look · Click shoot · R reload · Shift sprint · Esc pause';
  $('touch-ui').classList.toggle('hidden', !input.isTouch);
}

// ---------- State changes ----------
function startPlaying() {
  state = 'playing';
  input.reset();
  input.enabled = true;
  showScreen(null);
  hud.show(true);
  if (!input.isTouch) canvas.requestPointerLock?.();
}

function newGame() {
  kills = 0;
  player.reset();
  weapon.reset();
  zombies.clear();
  effects.clear();
  startPlaying();
}

function pause() {
  if (state !== 'playing') return;
  state = 'paused';
  input.enabled = false;
  showScreen('pause');
}

function die() {
  state = 'dead';
  input.enabled = false;
  $('final-kills').textContent = kills;
  showScreen('dead');
  document.exitPointerLock?.();
}

$('btn-play').addEventListener('click', newGame);
$('btn-restart').addEventListener('click', newGame);
$('btn-resume').addEventListener('click', startPlaying);

// Leaving pointer lock (Esc on desktop) pauses the game.
document.addEventListener('pointerlockchange', () => {
  if (!input.pointerLocked && state === 'playing' && !input.isTouch) pause();
});
// Clicking the game while playing without pointer lock (e.g. lock was refused) retries it.
canvas.addEventListener('click', () => {
  if (state === 'playing' && !input.isTouch && !input.pointerLocked) canvas.requestPointerLock?.();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ---------- Main loop ----------
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'playing') {
    if (input.pausePressed) pause();
    update(dt);
  }
  input.endFrame();
  if (state !== 'loading') renderer.render(scene, camera);
}

function update(dt) {
  player.update(dt, input, world.obstacles);
  pushPlayerOutOfZombies();

  const targets = [...zombies.hitboxes, ...world.obstacles.map((o) => o.mesh)];
  const hit = weapon.update(dt, input, targets, player);
  if (hit) handleHit(hit);

  zombies.update(dt, player, world.obstacles);
  effects.update(dt);
  hud.update(dt, player, weapon, kills);

  if (!player.alive) die();
}

function handleHit(hit) {
  const normal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
    : new THREE.Vector3(0, 1, 0);
  const info = hit.object.userData;
  if (info.zombie) {
    const headshot = info.part === 'head';
    const dmg = weapon.def.damage * (headshot ? weapon.def.headshotMultiplier : 1);
    if (info.zombie.damage(dmg)) kills++;
    hud.hitMarker(headshot);
    effects.burst(hit.point, normal, 'blood', headshot ? 14 : 8);
  } else {
    effects.burst(hit.point, normal, 'dust', 6);
  }
}

// The player can't walk through living zombies.
function pushPlayerOutOfZombies() {
  for (const z of zombies.zombies) {
    if (z.dead) continue;
    const dx = player.position.x - z.root.position.x;
    const dz = player.position.z - z.root.position.z;
    const min = 0.4 + z.def.radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min && d2 > 1e-6) {
      const d = Math.sqrt(d2);
      player.position.x = z.root.position.x + (dx / d) * min;
      player.position.z = z.root.position.z + (dz / d) * min;
    }
  }
}

init().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Something went wrong while loading. Please refresh the page.';
});
frame();

// Exposed for automated testing in the browser console.
window.__game = { scene, camera, renderer, get player() { return player; }, get zombies() { return zombies; }, get weapon() { return weapon; } };
