இது இந்த project-ன் entry point / central coordinator.
#const sceneManager = new SceneManager(canvas);
Scene உருவாக்கப்படுகிறது.

Rubik's cube உருவாக்கப்படுகிறது.
#const cube = new RubiksCube();

Sound system உருவாகிறது.
#const audioManager = new AudioManager();

ஒவ்வொரு system-ம் initialize செய்யப்படுகிறது.
#const cameraManager = new CameraManager(...)
#const raycaster = new CubeRaycaster(...)
#const rotationEngine = new RotationEngine(...)
#const stateManager = new CubeStateManager(...)

இது எல்லா interaction-களையும் ஒருங்கிணைக்கிறது.
#const cubeController = new CubeController(
  raycaster,
  rotationEngine,
  stateManager,
  sceneManager.controls,
  audioManager
);

Cube.js
இது actual Rubik's Cube model.
export class RubiksCube

SceneManager.js
இது Three.js world-ஐ setup செய்கிறது.
this.scene = new THREE.Scene();



main.js
 ├── Cube code
 ├── Camera code
 ├── Hand tracking code
 ├── Gesture code
 ├── Rotation code
 ├── Mouse code
 ├── Audio code
 └── Animation code


 cube/
├── Cube.js
├── CubeController.js
├── RotationEngine.js
├── CubeRaycaster.js
└── CubeStateManager.js