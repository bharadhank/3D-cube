import * as THREE from 'three';

export class CubeController {
  constructor(raycaster, rotationEngine, stateManager, orbitControls, audioManager) {
    this.raycaster = raycaster;
    this.rotationEngine = rotationEngine;
    this.stateManager = stateManager;
    this.orbitControls = orbitControls;
    this.audioManager = audioManager;
    
    this.isDragging = false;
    this.dragStartPoint = new THREE.Vector2();
    this.clickedFaceNormal = new THREE.Vector3();
    this.activeSticker = null;
    this.activeCubie = null;
    this.activeAxis = null;
    
    this.debugUI = document.getElementById('debug-content');
    this.lastInteractionTime = Date.now();
  }

  handleGesture(gesture) {
    this.lastInteractionTime = Date.now();
    this.updateDebugUI(gesture);

    if (gesture.type === 'ORBIT') {
      const data = gesture.data;
      const x = 1.0 - data.wrist.x;
      const y = data.wrist.y;
      
      if (!this.lastOrbitPos) {
        this.lastOrbitPos = { x, y };
      } else {
        const dx = x - this.lastOrbitPos.x;
        const dy = y - this.lastOrbitPos.y;
        
        // Use Spherical coordinates since OrbitControls lacks a set method
        const camera = this.orbitControls.object;
        const spherical = new THREE.Spherical().setFromVector3(camera.position);
        
        spherical.theta -= dx * 5.0; 
        spherical.phi -= dy * 5.0;   
        
        // Restrict polar angle (phi) to prevent flipping
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        camera.position.setFromSpherical(spherical);
        this.orbitControls.update();
        
        this.lastOrbitPos = { x, y };
      }
    } else if (gesture.type === 'ORBIT_END') {
      this.lastOrbitPos = null;
    }

    if (gesture.type === 'HOVER') {
      if (!this.isDragging) {
        this.raycaster.highlightHover(gesture.data.ndcX, gesture.data.ndcY);
      }
    }

    if (gesture.type === 'HOVER_END') {
      if (!this.isDragging) {
        this.raycaster.clearHighlight();
      }
    }

    if (gesture.type === 'PINCH_START') {
      const intersect = this.raycaster.getIntersectedSticker(gesture.data.ndcX, gesture.data.ndcY);
      
      if (intersect && !this.rotationEngine.isAnimating) {
        console.log("[CubeController] Locked onto layer.");
        this.isDragging = true;
        this.dragStartPoint.set(gesture.data.clientX, gesture.data.clientY);
        this.orbitControls.enabled = false;
        
        this.activeSticker = intersect.object;
        this.activeCubie = this.activeSticker.userData.parentCubie;
        
        // Determine face normal
        this.clickedFaceNormal.set(0, 0, 0);
        const face = this.activeSticker.userData.faceName;
        if (face === 'right') this.clickedFaceNormal.x = 1;
        if (face === 'left') this.clickedFaceNormal.x = -1;
        if (face === 'up') this.clickedFaceNormal.y = 1;
        if (face === 'down') this.clickedFaceNormal.y = -1;
        if (face === 'front') this.clickedFaceNormal.z = 1;
        if (face === 'back') this.clickedFaceNormal.z = -1;
      }
    }

    if (gesture.type === 'PINCH_TWIST') {
      if (!this.isDragging) return;

      const deltaAngle = gesture.data.deltaAngle;

      if (!this.rotationEngine.activeLayer) {
        // Require a tiny initial twist to lock the layer and prevent jitter
        if (Math.abs(deltaAngle) > 0.1) {
          if (this.audioManager) this.audioManager.playMechanicalClick();
          
          // Axis is strictly determined by the face you grabbed
          if (Math.abs(this.clickedFaceNormal.x) > 0) this.activeAxis = 'x';
          else if (Math.abs(this.clickedFaceNormal.y) > 0) this.activeAxis = 'y';
          else this.activeAxis = 'z';

          const gridValue = this.activeCubie.userData['grid' + this.activeAxis.toUpperCase()];
          const layerCubies = this.stateManager.getLayer(this.activeAxis, gridValue);
          
          this.rotationEngine.attachLayer(layerCubies, this.activeAxis);
        }
      }

      if (this.rotationEngine.activeLayer) {
        // Multiply by 1.5 to make it easier to reach 90 degrees physically
        let rotationAmount = deltaAngle * 1.5;
        
        // Reverse direction for opposite faces so clockwise twist feels right
        if (this.clickedFaceNormal.x < 0 || this.clickedFaceNormal.y < 0 || this.clickedFaceNormal.z < 0) {
          rotationAmount = -rotationAmount;
        }

        this.rotationEngine.rotate(rotationAmount);
      }
    }

    if (gesture.type === 'PINCH_END') {
      if (this.isDragging) {
        console.log("[CubeController] Releasing pinch, snapping to grid.");
        this.isDragging = false;
        this.orbitControls.enabled = true;
        
        if (this.rotationEngine.activeLayer) {
          this.rotationEngine.snap((completedLayer) => {
            this.stateManager.updateGridAfterRotation(completedLayer);
            this.activeAxis = null;
            this.activeSticker = null;
            this.activeCubie = null;
            console.log("[CubeController] State updated after rotation.");
          });
        }
      }
    }
  }

  updateDebugUI(gesture) {
    if (!this.debugUI) return;
    
    // We only update specific parts to not overwrite everything
    if (!this.debugState) {
      this.debugState = {
        camera: 'ACTIVE',
        hands: 0,
        gesture: 'NONE',
        face: 'NONE',
        layer: 'NONE',
        axis: 'NONE',
        pinch: false,
        angle: 0
      };
      this.debugUI.parentElement.style.display = 'block';
    }

    if (gesture.type === 'DEBUG_PINCH') {
      this.debugState.pinch = gesture.state;
    } else {
      this.debugState.gesture = gesture.type;
    }

    if (this.activeSticker) {
      this.debugState.face = this.activeSticker.userData.faceName.toUpperCase();
    } else if (this.raycaster.hoveredSticker) {
      this.debugState.face = this.raycaster.hoveredSticker.userData.faceName.toUpperCase() + ' (HOVER)';
    } else {
      this.debugState.face = 'NONE';
    }

    this.debugState.axis = this.activeAxis ? this.activeAxis.toUpperCase() : 'NONE';

    if (this.rotationEngine.activeAxis) {
      this.debugState.angle = (this.rotationEngine.pivot.rotation[this.rotationEngine.activeAxis] * (180/Math.PI)).toFixed(1);
    } else {
      this.debugState.angle = 0;
    }

    this.debugUI.innerHTML = `
      <div><strong>CAMERA:</strong> ${this.debugState.camera}</div>
      <div><strong>GESTURE:</strong> ${this.debugState.gesture}</div>
      <div><strong>PINCH:</strong> ${this.debugState.pinch ? '<span style="color:red">YES</span>' : 'NO'}</div>
      <hr style="border-color: rgba(0,255,0,0.3)">
      <div><strong>FACE:</strong> ${this.debugState.face}</div>
      <div><strong>AXIS:</strong> ${this.debugState.axis}</div>
      <div><strong>ANGLE:</strong> ${this.debugState.angle}°</div>
    `;
  }
}
