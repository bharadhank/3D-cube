import * as THREE from 'three';

export class GalaxyBackground {
  constructor() {
    this.group = new THREE.Group();
    
    this.createStars();
    this.createNebulaDust();
  }

  createStars() {
    const starCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const phases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 20 + Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = new THREE.Color();
      c.setHSL(Math.random(), 0.5, Math.random() * 0.5 + 0.5);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float phase;
        varying vec3 vColor;
        varying float vPhase;
        void main() {
          vColor = color;
          vPhase = phase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (2.0 + sin(phase)) * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vColor;
        varying float vPhase;
        void main() {
          // Circular particle
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float ll = length(xy);
          if (ll > 0.5) discard;
          
          float alpha = 0.5 + 0.5 * sin(time * 2.0 + vPhase);
          gl_FragColor = vec4(vColor, alpha * (1.0 - (ll * 2.0)));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, this.starMaterial);
    this.group.add(this.stars);
  }

  createNebulaDust() {
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const r = 10 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = new THREE.Color();
      c.setHSL(0.6 + Math.random() * 0.2, 0.8, 0.1 + Math.random() * 0.2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    this.dust = new THREE.Points(geometry, material);
    this.group.add(this.dust);
  }

  getGroup() {
    return this.group;
  }

  update(elapsedTime) {
    if (this.stars) {
      this.stars.rotation.y = elapsedTime * 0.02;
    }
    if (this.starMaterial) {
      this.starMaterial.uniforms.time.value = elapsedTime;
    }
    if (this.dust) {
      this.dust.rotation.y = elapsedTime * 0.01;
      this.dust.rotation.z = elapsedTime * 0.005;
    }
  }
}
