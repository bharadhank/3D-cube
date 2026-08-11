import * as THREE from 'three';

export class CubeRaycaster {
  constructor(camera, cubeGroup) {
    this.camera = camera;
    this.cubeGroup = cubeGroup;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredSticker = null;
  }

  getIntersectedSticker(ndcX, ndcY) {
    this.mouse.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cubeGroup.children, true);
    
    for (let intersect of intersects) {
      if (intersect.object.userData && intersect.object.userData.faceName) {
        return intersect;
      }
    }
    return null;
  }

  highlightHover(ndcX, ndcY) {
    const intersect = this.getIntersectedSticker(ndcX, ndcY);
    
    if (this.hoveredSticker) {
      this.hoveredSticker.material.emissive.setHex(0x000000);
      this.hoveredSticker = null;
    }

    if (intersect) {
      this.hoveredSticker = intersect.object;
      this.hoveredSticker.material.emissive.setHex(0x333333); // Glow
      return this.hoveredSticker;
    }
    return null;
  }

  clearHighlight() {
    if (this.hoveredSticker) {
      this.hoveredSticker.material.emissive.setHex(0x000000);
      this.hoveredSticker = null;
    }
  }
}
