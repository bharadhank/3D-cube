import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import gsap from 'gsap';

export class RubiksCube {
  constructor() {
    this.group = new THREE.Group();
    this.cubies = [];
    
    this.colors = {
      up: 0xffffff,    // White
      down: 0xffd500,  // Yellow
      front: 0x009e60, // Green
      back: 0x0051ba,  // Blue
      right: 0xc41e3a, // Red
      left: 0xff5800   // Orange
    };
    
    this.initMaterial();
    this.createCube();
  }

  initMaterial() {
    this.baseMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x222222,
      metalness: 0.1,
      roughness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    
    this.faceMaterials = {};
    for (const [name, color] of Object.entries(this.colors)) {
      this.faceMaterials[name] = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      });
    }
  }

  createCube() {
    const spacing = 1.05;
    const geometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.1);
    const planeGeom = new THREE.PlaneGeometry(0.85, 0.85);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cx = x;
          const cy = y;
          const cz = z;

          const cubie = new THREE.Group();
          cubie.position.set(cx * spacing, cy * spacing, cz * spacing);
          
          // Store internal grid position (-1, 0, 1)
          cubie.userData = { gridX: cx, gridY: cy, gridZ: cz, id: `${cx}-${cy}-${cz}` };

          const core = new THREE.Mesh(geometry, this.baseMaterial);
          core.castShadow = true;
          core.receiveShadow = true;
          // Store reference back to cubie group for raycasting
          core.userData.parentCubie = cubie; 
          cubie.add(core);

          if (cx === 1) this.addSticker(cubie, planeGeom, this.faceMaterials.right, [Math.PI / 2, Math.PI / 2, 0], [0.505, 0, 0], 'right');
          if (cx === -1) this.addSticker(cubie, planeGeom, this.faceMaterials.left, [Math.PI / 2, -Math.PI / 2, 0], [-0.505, 0, 0], 'left');
          if (cy === 1) this.addSticker(cubie, planeGeom, this.faceMaterials.up, [-Math.PI / 2, 0, 0], [0, 0.505, 0], 'up');
          if (cy === -1) this.addSticker(cubie, planeGeom, this.faceMaterials.down, [Math.PI / 2, 0, 0], [0, -0.505, 0], 'down');
          if (cz === 1) this.addSticker(cubie, planeGeom, this.faceMaterials.front, [0, 0, 0], [0, 0, 0.505], 'front');
          if (cz === -1) this.addSticker(cubie, planeGeom, this.faceMaterials.back, [0, Math.PI, 0], [0, 0, -0.505], 'back');

          this.cubies.push(cubie);
          this.group.add(cubie);
        }
      }
    }
  }

  addSticker(cubie, geometry, material, rotation, position, faceName) {
    const sticker = new THREE.Mesh(geometry, material);
    sticker.rotation.set(...rotation);
    sticker.position.set(...position);
    sticker.userData.faceName = faceName;
    sticker.userData.parentCubie = cubie; // Important for raycaster to find parent group
    cubie.add(sticker);
  }

  getGroup() {
    return this.group;
  }

  update(elapsedTime) {
    // Only used for global floating effect if needed, but we handle rotation elsewhere now
    // leaving empty for pure interaction mode
  }
}
