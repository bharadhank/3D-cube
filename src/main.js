import { SceneManager } from './SceneManager.js';
import { GalaxyBackground } from './Galaxy.js';
import { RubiksCube } from './Cube.js';
import { AudioManager } from './AudioManager.js';

import { CameraManager } from './CameraManager.js';
import { HandTracker } from './HandTracker.js';
import { GestureRecognizer } from './GestureRecognizer.js';
import { CubeRaycaster } from './CubeRaycaster.js';
import { RotationEngine } from './RotationEngine.js';
import { CubeStateManager } from './CubeStateManager.js';
import { CubeController } from './CubeController.js';

import * as THREE from 'three';

const canvas = document.getElementById('app-canvas');
const videoElement = document.getElementById('webcam');
const videoContainer = document.getElementById('webcam-container');
const landmarkCanvas = document.getElementById('landmark-canvas');

const sceneManager = new SceneManager(canvas);
const scene = sceneManager.getScene();

const galaxy = new GalaxyBackground();
scene.add(galaxy.getGroup());

const cube = new RubiksCube();
scene.add(cube.getGroup());

const audioManager = new AudioManager();

// Modular AI Pipeline Initialization
const cameraManager = new CameraManager(videoElement, videoContainer);
const raycaster = new CubeRaycaster(sceneManager.camera, cube.getGroup());
const rotationEngine = new RotationEngine(cube.getGroup(), audioManager);
const stateManager = new CubeStateManager(cube);

const cubeController = new CubeController(
  raycaster, 
  rotationEngine, 
  stateManager, 
  sceneManager.controls, 
  audioManager
);

const gestureRecognizer = new GestureRecognizer((gesture) => {
  cubeController.handleGesture(gesture);
});

const handTracker = new HandTracker(videoElement, landmarkCanvas, (handData) => {
  gestureRecognizer.process(handData);
  if (handData && handData.handsDetected) {
    cubeController.lastInteractionTime = Date.now(); // Pause auto-rotation
    if (cubeController.debugState) cubeController.debugState.hands = handData.numHands;
  } else {
    if (cubeController.debugState) cubeController.debugState.hands = 0;
  }
});

// Start Camera Pipeline
cameraManager.startCamera().then((success) => {
  if (success) {
    handTracker.init();
  }
});

setTimeout(() => {
  canvas.style.opacity = 1;
}, 500);

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = clock.getDelta();

  galaxy.update(elapsedTime);
  
  // Idle Auto-Rotation Logic
  const timeSinceInteraction = Date.now() - (cubeController.lastInteractionTime || 0);
  if (timeSinceInteraction > 5000 && !cubeController.isDragging && !rotationEngine.isAnimating) {
    const group = cube.getGroup();
    group.rotation.x += 0.001;
    group.rotation.y += 0.002;
    group.rotation.z += 0.001;
  }

  sceneManager.update(deltaTime);
}

animate();
