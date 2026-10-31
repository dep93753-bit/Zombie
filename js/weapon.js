// The player's gun: the on-screen model, shooting, reloading and ammo.
import * as THREE from 'three';
import { models } from './assets.js';

// Stage 1 only has the pistol. More guns will be added as entries like this one.
const PISTOL = {
  name: 'Pistol',
  model: 'pistol',
  damage: 34,
  headshotMultiplier: 2.5,
  fireDelay: 0.16,     // seconds between shots
  automatic: false,    // pistol needs one click per shot
  magSize: 12,
  reloadTime: 1.2,
  range: 80,
  recoil: 0.06,
};

// Where the gun sits relative to the camera.
const HOLD_POSITION = new THREE.Vector3(0.2, -0.17, -0.4);

export class Weapon {
  constructor(camera, scene) {
    this.camera = camera;
    this.def = PISTOL;
    this.mag = this.def.magSize;
    this.reserve = Infinity; // Stage 1: no ammo pickups yet, so reserve ammo never runs out
    this.cooldown = 0;
    this.reloading = 0;
    this.kick = 0;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = this.def.range;

    this.holder = new THREE.Group();
    this.holder.position.copy(HOLD_POSITION);
    camera.add(this.holder);
    scene.add(camera);

    // The pistol model's barrel points along +X, so turn it to point forward (-Z).
    const gun = models[this.def.model].scene.clone();
    gun.rotation.y = Math.PI / 2 + 0.06; // angled slightly toward the crosshair
    gun.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    this.holder.add(gun);

    // Muzzle flash: a bright light and a small glowing quad at the barrel tip.
    this.muzzle = new THREE.Group();
    this.muzzle.position.set(0, 0.035, -0.16);
    this.holder.add(this.muzzle);
    this.flashLight = new THREE.PointLight(0xffc16b, 0, 6, 2);
    this.muzzle.add(this.flashLight);
    this.flashSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false }),
    );
    this.muzzle.add(this.flashSprite);
    this.flashTime = 0;
  }

  get isReloading() { return this.reloading > 0; }

  reset() {
    this.mag = this.def.magSize;
    this.cooldown = 0;
    this.reloading = 0;
  }

  startReload() {
    if (this.isReloading || this.mag === this.def.magSize || this.reserve <= 0) return;
    this.reloading = this.def.reloadTime;
  }

  // Returns the hit (or null) when a shot was fired, or undefined when no shot was fired.
  update(dt, input, targets, player) {
    this.cooldown -= dt;

    if (this.isReloading) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        const needed = this.def.magSize - this.mag;
        const taken = Math.min(needed, this.reserve);
        this.mag += taken;
        this.reserve -= taken;
        this.reloading = 0;
      }
    } else if (input.reloadPressed) {
      this.startReload();
    }

    let result;
    const wantsFire = this.def.automatic ? input.fireHeld : input.firePressed;
    if (wantsFire && !this.isReloading && this.cooldown <= 0) {
      if (this.mag > 0) {
        result = this.#fire(targets);
      } else {
        this.startReload();
      }
    }

    this.#animate(dt, player);
    return result;
  }

  #fire(targets) {
    this.mag--;
    this.cooldown = this.def.fireDelay;
    this.kick = 1;
    this.flashTime = 0.05;
    this.flashSprite.rotation.z = Math.random() * Math.PI;

    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.raycaster.intersectObjects(targets, false);
    if (this.mag === 0) this.startReload();
    return hits[0] ?? null;
  }

  #animate(dt, player) {
    // Recoil kicks the gun back and up, then it eases back.
    this.kick = Math.max(0, this.kick - dt * 8);
    const k = this.kick * this.kick;
    const bob = player.moving ? Math.sin(player.bobTime) : 0;
    const sway = player.moving ? Math.cos(player.bobTime * 0.5) : 0;
    this.holder.position.set(
      HOLD_POSITION.x + sway * 0.012,
      HOLD_POSITION.y + bob * 0.008 + k * 0.02 - (this.isReloading ? 0.12 : 0),
      HOLD_POSITION.z + k * this.def.recoil,
    );
    this.holder.rotation.x = k * 0.25 + (this.isReloading ? -0.6 : 0);

    this.flashTime -= dt;
    const on = this.flashTime > 0;
    this.flashLight.intensity = on ? 8 : 0;
    this.flashSprite.material.opacity = on ? 1 : 0;
  }
}
