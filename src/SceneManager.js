import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLighting();
    this.initPostProcessing();

    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('dblclick', this.resetCamera.bind(this));
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    // Add realistic environment for PBR reflections
    // We will initialize it after renderer is created, so let's defer it or handle it in a separate function.
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(4, 4, 6);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Generate environment for reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = false;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
  }

  initLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x90b0d0, 1.0);
    fillLight.position.set(-5, 0, 5);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 5, -5);
    this.scene.add(rimLight);
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.9;
    bloomPass.strength = 0.3;
    bloomPass.radius = 0.5;
    this.composer.addPass(bloomPass);

    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms['offset'].value = 1.0;
    vignettePass.uniforms['darkness'].value = 1.5;
    this.composer.addPass(vignettePass);

    const fxaaPass = new ShaderPass(FXAAShader);
    const pixelRatio = this.renderer.getPixelRatio();
    fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    this.composer.addPass(fxaaPass);
    this.fxaaPass = fxaaPass;
  }

  resetCamera() {
    this.camera.position.set(4, 4, 6);
    this.controls.target.set(0, 0, 0);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);

    const pixelRatio = this.renderer.getPixelRatio();
    if (this.fxaaPass) {
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
    }
  }

  getScene() {
    return this.scene;
  }

  update(deltaTime) {
    this.controls.update();

    // Subtle cinematic camera drift
    const time = performance.now() * 0.0005;
    this.camera.position.x += Math.sin(time) * 0.001;
    this.camera.position.y += Math.cos(time * 0.8) * 0.001;

    this.composer.render();
  }
}
