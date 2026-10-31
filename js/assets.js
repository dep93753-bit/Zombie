// Loads GLB models and resizes them to real-world sizes (1 unit = 1 meter).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// size: the model's largest dimension along `axis` after loading, in meters.
// ground: move the model so its lowest point sits at y = 0 and it is centered on x/z.
const MODELS = {
  walker: { url: 'assets/models/zombies/walker.glb', size: 1.8, axis: 'y', ground: true },
  pistol: { url: 'assets/models/weapons/pistol.glb', size: 0.24, axis: 'x', ground: false },
};

export const models = {};

export async function loadAllModels(onProgress) {
  const loader = new GLTFLoader();
  const names = Object.keys(MODELS);
  let done = 0;

  await Promise.all(names.map(async (name) => {
    const def = MODELS[name];
    const gltf = await loader.loadAsync(def.url);
    const root = gltf.scene;
    normalize(root, def);
    root.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        // Skinned meshes move away from their bind pose, so skip frustum culling
        // rather than have limbs pop out of view at screen edges.
        if (obj.isSkinnedMesh) obj.frustumCulled = false;
      }
    });
    models[name] = { scene: root, animations: gltf.animations };
    done++;
    onProgress?.(done / names.length);
  }));
}

function normalize(root, def) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  root.scale.multiplyScalar(def.size / size[def.axis]);
  root.updateMatrixWorld(true);

  box.setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= def.ground ? box.min.y : center.y;
}

// Finds an animation clip by its short name, ignoring armature prefixes
// such as "CharacterArmature|Walk".
export function findClip(animations, name) {
  return animations.find((c) => c.name === name)
    ?? animations.find((c) => c.name.endsWith('|' + name));
}
