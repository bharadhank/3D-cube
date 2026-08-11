import * as THREE from 'three';
import gsap from 'gsap';

export class InteractionManager {
  constructor(camera, renderer, sceneManager, cube, audioManager) {
    this.camera = camera;
    this.renderer = renderer;
    this.sceneManager = sceneManager;
    this.cube = cube;
    this.audioManager = audioManager;
    this.controls = sceneManager.controls;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.isRotatingLayer = false;
    this.activeLayer = null;
    this.activeAxis = null;
    this.dragStartPoint = new THREE.Vector2();
    this.clickedFaceNormal = new THREE.Vector3();
    this.pivot = new THREE.Object3D();
    cube.getGroup().add(this.pivot);

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    
    this.lastInteractionTime = Date.now();
  }

  getIntersectedSticker(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.cube.getGroup().children, true);
    
    for (let intersect of intersects) {
      if (intersect.object.userData && intersect.object.userData.faceName) {
        return intersect;
      }
    }
    return null;
  }

  onPointerDown(e) {
    this.lastInteractionTime = Date.now();
    const intersect = this.getIntersectedSticker(e);

    if (intersect && !this.isRotatingLayer && !this.cube.isAnimating) {
      this.isDragging = true;
      this.dragStartPoint.set(e.clientX, e.clientY);
      this.controls.enabled = false;
      this.activeSticker = intersect.object;
      this.activeCubie = this.activeSticker.userData.parentCubie;
      
      // Determine face normal based on the faceName
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

  onPointerMove(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.dragStartPoint.x;
    const dy = e.clientY - this.dragStartPoint.y;

    if (!this.isRotatingLayer) {
      // Determine rotation axis based on drag direction
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        this.isRotatingLayer = true;
        this.audioManager.playMechanicalClick();
        
        // Simplified logic: figure out which axis to rotate based on face and drag delta
        if (Math.abs(this.clickedFaceNormal.x) > 0) {
          this.activeAxis = Math.abs(dy) > Math.abs(dx) ? 'z' : 'y';
        } else if (Math.abs(this.clickedFaceNormal.y) > 0) {
          this.activeAxis = Math.abs(dx) > Math.abs(dy) ? 'z' : 'x';
        } else {
          this.activeAxis = Math.abs(dy) > Math.abs(dx) ? 'x' : 'y';
        }

        // Gather cubies in the same layer
        const gridValue = this.activeCubie.userData['grid' + this.activeAxis.toUpperCase()];
        this.activeLayer = this.cube.cubies.filter(c => c.userData['grid' + this.activeAxis.toUpperCase()] === gridValue);
        
        // Attach to pivot
        this.pivot.rotation.set(0, 0, 0);
        this.activeLayer.forEach(c => this.pivot.attach(c));
      }
    }

    if (this.isRotatingLayer) {
      // Calculate rotation amount based on drag delta
      let delta = 0;
      if (this.activeAxis === 'x') delta = dy * 0.01;
      if (this.activeAxis === 'y') delta = dx * 0.01;
      if (this.activeAxis === 'z') delta = dx * 0.01;
      
      this.pivot.rotation[this.activeAxis] = delta;
    }
  }

  onPointerUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.controls.enabled = true;
    this.lastInteractionTime = Date.now();

    if (this.isRotatingLayer) {
      this.cube.isAnimating = true;
      const currentRotation = this.pivot.rotation[this.activeAxis];
      const snapAngle = Math.round(currentRotation / (Math.PI / 2)) * (Math.PI / 2);
      
      gsap.to(this.pivot.rotation, {
        [this.activeAxis]: snapAngle,
        duration: 0.4,
        ease: "power3.out",
        onComplete: () => {
          this.audioManager.playMagneticSnap();
          this.pivot.updateMatrixWorld();
          
          this.activeLayer.forEach(c => {
            this.cube.getGroup().attach(c);
            const p = c.position;
            c.userData.gridX = Math.round(p.x / 1.05);
            c.userData.gridY = Math.round(p.y / 1.05);
            c.userData.gridZ = Math.round(p.z / 1.05);
          });
          
          this.isRotatingLayer = false;
          this.activeLayer = null;
          this.cube.isAnimating = false;
        }
      });
    }
  }

  // AI HAND TRACKING INTEGRATION
  handleHandData(handData) {
    if (!handData) return;
    const { left, right, handsDetected } = handData;

    // LEFT HAND: Orbit Camera
    if (left) {
      const x = 1.0 - left.wrist.x; // mirror x
      const y = left.wrist.y;
      
      if (!this.lastLeftHand) {
        this.lastLeftHand = { x, y };
      } else {
        const dx = x - this.lastLeftHand.x;
        const dy = y - this.lastLeftHand.y;
        
        // Feed into orbit controls roughly
        this.controls.setAzimuthalAngle(this.controls.getAzimuthalAngle() - dx * 2.0);
        this.controls.setPolarAngle(this.controls.getPolarAngle() + dy * 2.0);
        
        this.lastLeftHand = { x, y };
      }
    } else {
      this.lastLeftHand = null;
    }

    // RIGHT HAND: Pinch to Rotate
    if (right) {
      // Mirror X so it matches screen space (since user acts like looking in mirror)
      const mirrorX = 1.0 - right.indexTip.x;
      const ndcX = (mirrorX * 2) - 1;
      const ndcY = -(right.indexTip.y * 2) + 1;
      
      this.mouse.set(ndcX, ndcY);

      const dx = right.indexTip.x - right.thumbTip.x;
      const dy = right.indexTip.y - right.thumbTip.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isPinching = dist < 0.05;

      // Glow effect on hover when not pinching
      if (!this.isDragging && !isPinching) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.cube.getGroup().children, true);
        
        if (this.hoveredSticker) {
          this.hoveredSticker.material.emissive.setHex(0x000000);
          this.hoveredSticker = null;
        }

        for (let intersect of intersects) {
          if (intersect.object.userData && intersect.object.userData.faceName) {
            this.hoveredSticker = intersect.object;
            this.hoveredSticker.material.emissive.setHex(0x333333); // Glow
            break;
          }
        }
      }

      // Convert virtual NDC coordinates back to pixel-like coordinates for drag logic
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const vClientX = (ndcX + 1) / 2 * screenW;
      const vClientY = (-ndcY + 1) / 2 * screenH;

      if (isPinching && !this.wasPinching) {
        // Pinch Start
        this.onPointerDown({ clientX: vClientX, clientY: vClientY });
      } else if (isPinching && this.wasPinching) {
        // Pinch Drag
        this.onPointerMove({ clientX: vClientX, clientY: vClientY });
      } else if (!isPinching && this.wasPinching) {
        // Pinch Release
        this.onPointerUp({});
      }

      this.wasPinching = isPinching;
    } else {
      if (this.wasPinching) {
        this.onPointerUp({});
        this.wasPinching = false;
      }
      if (this.hoveredSticker) {
        this.hoveredSticker.material.emissive.setHex(0x000000);
        this.hoveredSticker = null;
      }
    }
  }
}
