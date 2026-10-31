// Short-lived visual effects: blood and dust puffs where bullets land.
import * as THREE from 'three';

const particleGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
const materials = {
  blood: new THREE.MeshBasicMaterial({ color: 0x8a0f0f }),
  dust: new THREE.MeshBasicMaterial({ color: 0xb8b2a2 }),
};

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  // kind: 'blood' | 'dust'. normal points away from the surface that was hit.
  burst(point, normal, kind, count = 8) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(particleGeo, materials[kind]);
      mesh.position.copy(point);
      const vel = normal.clone().multiplyScalar(2 + Math.random() * 2);
      vel.x += (Math.random() - 0.5) * 3;
      vel.y += Math.random() * 2.5;
      vel.z += (Math.random() - 0.5) * 3;
      this.scene.add(mesh);
      this.particles.push({ mesh, vel, life: 0.4 + Math.random() * 0.3 });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= 9.8 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.scale.setScalar(Math.max(0.01, p.life * 2));
      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) this.scene.remove(p.mesh);
    this.particles.length = 0;
  }
}
