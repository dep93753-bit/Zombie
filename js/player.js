// First-person player: looking, moving and health.
import * as THREE from 'three';
import { resolveCollisions } from './world.js';

const EYE_HEIGHT = 1.65;
const WALK_SPEED = 4.5;
const SPRINT_SPEED = 7.5;
const RADIUS = 0.4;
const MOUSE_SENSITIVITY = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.05;

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.camera.rotation.order = 'YXZ';
    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.bobTime = 0;
    this.moving = false;
    this.reset();
  }

  get alive() { return this.health > 0; }

  reset() {
    this.position.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.health = this.maxHealth;
  }

  update(dt, input, obstacles) {
    this.yaw -= input.lookDX * MOUSE_SENSITIVITY;
    this.pitch -= input.lookDY * MOUSE_SENSITIVITY;
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch));

    const move = input.getMove();
    const speed = move.sprint && move.y > 0 ? SPRINT_SPEED : WALK_SPEED;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    // Forward is -Z when yaw is 0.
    this.position.x += (move.x * cos - move.y * sin) * speed * dt;
    this.position.z += (-move.x * sin - move.y * cos) * speed * dt;
    resolveCollisions(this.position, RADIUS, obstacles);

    this.moving = Math.hypot(move.x, move.y) > 0.1;
    if (this.moving) this.bobTime += dt * speed * 1.6;

    const bob = this.moving ? Math.sin(this.bobTime) * 0.04 : 0;
    this.camera.position.set(this.position.x, EYE_HEIGHT + bob, this.position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}
