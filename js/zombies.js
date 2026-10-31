// Zombies: spawning, chasing the player, attacking, getting hit and dying.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { models, findClip } from './assets.js';
import { resolveCollisions } from './world.js';

const WALKER = {
  model: 'walker',
  health: 100,
  speed: 1.3,
  walkAnimSpeed: 1.0,  // the Walk clip covers about 1.3 m/s at timeScale 1
  attackRange: 1.4,
  attackDamage: 15,
  attackCooldown: 1.3,
  attackHitDelay: 0.45, // seconds into the punch when the damage lands
  radius: 0.4,
};

const SPAWN_MIN_DIST = 22;
const SPAWN_MAX_DIST = 32;
const CORPSE_TIME = 4;

// Invisible shapes used for bullet hits. Bullets test these instead of the
// animated mesh, which is cheaper and more reliable.
const bodyHitGeo = new THREE.BoxGeometry(0.7, 1.3, 0.5);
const headHitGeo = new THREE.SphereGeometry(0.22, 8, 6);
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

class Zombie {
  constructor(def, scene) {
    this.def = def;
    this.health = def.health;
    this.dead = false;
    this.deadTime = 0;
    this.attackTimer = 0;
    this.pendingHit = -1;
    this.stagger = 0;

    this.root = new THREE.Group();
    const model = SkeletonUtils.clone(models[def.model].scene);
    this.root.add(model);

    const body = new THREE.Mesh(bodyHitGeo, hitMat);
    body.position.y = 0.75;
    const head = new THREE.Mesh(headHitGeo, hitMat);
    head.position.y = 1.58;
    head.position.z = 0.08;
    body.userData = { zombie: this, part: 'body' };
    head.userData = { zombie: this, part: 'head' };
    this.root.add(body, head);
    this.hitboxes = [body, head];

    this.mixer = new THREE.AnimationMixer(model);
    const clips = models[def.model].animations;
    const action = (name, once) => {
      const a = this.mixer.clipAction(findClip(clips, name));
      if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      return a;
    };
    this.actions = {
      walk: action('Walk'),
      attack: action('Punch', true),
      hit: action('HitReact', true),
      death: action('Death', true),
    };
    this.actions.walk.timeScale = def.walkAnimSpeed;
    // Start each zombie's walk at a random point so a crowd doesn't move in sync.
    this.actions.walk.time = Math.random() * this.actions.walk.getClip().duration;
    this.actions.walk.play();
    this.current = this.actions.walk;

    scene.add(this.root);
  }

  play(name, fade = 0.15) {
    const next = this.actions[name];
    if (next === this.current && name !== 'attack' && name !== 'hit') return;
    next.reset().play();
    if (this.current !== next) this.current.crossFadeTo(next, fade, false);
    this.current = next;
  }

  update(dt, player, obstacles) {
    this.mixer.update(dt);

    if (this.dead) {
      this.deadTime += dt;
      // After lying still for a while, sink into the ground.
      if (this.deadTime > CORPSE_TIME - 1) this.root.position.y -= dt * 0.8;
      return;
    }

    const toPlayer = new THREE.Vector3(
      player.position.x - this.root.position.x, 0,
      player.position.z - this.root.position.z,
    );
    const dist = toPlayer.length();
    // Models face +Z, so this angle turns them toward the player.
    this.root.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    this.attackTimer -= dt;
    this.stagger -= dt;

    if (this.pendingHit >= 0) {
      this.pendingHit -= dt;
      if (this.pendingHit < 0 && dist < this.def.attackRange + 0.4 && player.alive) {
        player.takeDamage(this.def.attackDamage);
        this.onHitPlayer?.();
      }
    }

    if (this.stagger > 0) return;

    if (dist < this.def.attackRange) {
      if (this.attackTimer <= 0) {
        this.attackTimer = this.def.attackCooldown;
        this.pendingHit = this.def.attackHitDelay;
        this.play('attack');
      }
    } else if (this.attackTimer < this.def.attackCooldown - 0.8) {
      // Only walk again once the punch animation has mostly finished.
      this.play('walk', 0.25);
      toPlayer.normalize();
      this.root.position.addScaledVector(toPlayer, this.def.speed * dt);
      resolveCollisions(this.root.position, this.def.radius, obstacles);
    }
  }

  // Returns true if this hit killed the zombie.
  damage(amount) {
    if (this.dead) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.dead = true;
      this.pendingHit = -1;
      this.play('death', 0.1);
      return true;
    }
    this.stagger = 0.35;
    this.play('hit', 0.08);
    return false;
  }

  dispose(scene) {
    scene.remove(this.root);
    this.mixer.stopAllAction();
  }
}

export class ZombieManager {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
    this.spawnTimer = 2;
    this.elapsed = 0;
    this.onPlayerHit = null;
  }

  // Bullet targets for every living zombie.
  get hitboxes() {
    const list = [];
    for (const z of this.zombies) if (!z.dead) list.push(...z.hitboxes);
    return list;
  }

  // Stage 1: an endless trickle that slowly ramps up. Waves arrive in Stage 2.
  get maxAlive() {
    return Math.min(10, 2 + Math.floor(this.elapsed / 20));
  }

  update(dt, player, obstacles) {
    this.elapsed += dt;
    this.spawnTimer -= dt;
    const alive = this.zombies.filter((z) => !z.dead).length;
    if (this.spawnTimer <= 0 && alive < this.maxAlive) {
      this.spawn(player, obstacles);
      this.spawnTimer = 1.5 + Math.random() * 1.5;
    }

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.update(dt, player, obstacles);
      if (z.dead && z.deadTime > CORPSE_TIME) {
        z.dispose(this.scene);
        this.zombies.splice(i, 1);
      }
    }
    this.#separate();
  }

  spawn(player, obstacles) {
    const z = new Zombie(WALKER, this.scene);
    const angle = Math.random() * Math.PI * 2;
    const dist = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
    z.root.position.set(
      player.position.x + Math.cos(angle) * dist, 0,
      player.position.z + Math.sin(angle) * dist,
    );
    resolveCollisions(z.root.position, WALKER.radius, obstacles);
    z.onHitPlayer = () => this.onPlayerHit?.();
    this.zombies.push(z);
  }

  // Keeps zombies from walking inside each other.
  #separate() {
    const list = this.zombies.filter((z) => !z.dead);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i].root.position, b = list[j].root.position;
        const dx = b.x - a.x, dz = b.z - a.z;
        const min = list[i].def.radius + list[j].def.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = (min - d) / 2;
          a.x -= (dx / d) * push; a.z -= (dz / d) * push;
          b.x += (dx / d) * push; b.z += (dz / d) * push;
        }
      }
    }
  }

  clear() {
    for (const z of this.zombies) z.dispose(this.scene);
    this.zombies.length = 0;
    this.spawnTimer = 2;
    this.elapsed = 0;
  }
}
