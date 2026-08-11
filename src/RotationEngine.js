import * as THREE from 'three';
import gsap from 'gsap';

export class RotationEngine {
  constructor(cubeGroup, audioManager) {
    this.cubeGroup = cubeGroup;
    this.audioManager = audioManager;
    this.pivot = new THREE.Object3D();
    this.cubeGroup.add(this.pivot);
    
    this.isAnimating = false;
    this.activeAxis = null;
    this.activeLayer = null;
  }

  attachLayer(layerCubies, axis) {
    if (this.isAnimating) return false;
    
    this.activeAxis = axis;
    this.activeLayer = layerCubies;
    this.pivot.rotation.set(0, 0, 0);
    
    this.activeLayer.forEach(cubie => this.pivot.attach(cubie));
    return true;
  }

  rotate(delta) {
    if (this.isAnimating || !this.activeAxis) return;
    this.pivot.rotation[this.activeAxis] = delta;
  }

  snap(onComplete) {
    if (this.isAnimating || !this.activeAxis) return;
    this.isAnimating = true;

    const currentRotation = this.pivot.rotation[this.activeAxis];
    const snapAngle = Math.round(currentRotation / (Math.PI / 2)) * (Math.PI / 2);

    gsap.to(this.pivot.rotation, {
      [this.activeAxis]: snapAngle,
      duration: 0.4,
      ease: "power3.out",
      onComplete: () => {
        if (this.audioManager) this.audioManager.playMagneticSnap();
        this.pivot.updateMatrixWorld();
        
        // Re-attach to main group
        this.activeLayer.forEach(cubie => {
          this.cubeGroup.attach(cubie);
        });

        const completedLayer = this.activeLayer;
        
        this.activeLayer = null;
        this.activeAxis = null;
        this.isAnimating = false;
        
        if (onComplete) onComplete(completedLayer);
      }
    });
  }
}
