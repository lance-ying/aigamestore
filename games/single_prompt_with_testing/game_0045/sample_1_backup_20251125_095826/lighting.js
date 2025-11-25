import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, COLORS } from './globals.js';

export function setupLighting() {
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
  gameState.scene.add(ambientLight);
  gameState.ambientLight = ambientLight;
  
  // Directional light (main light source)
  const directionalLight = new THREE.DirectionalLight(0x8080ff, 0.8);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  
  // Configure shadow map
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 100;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  
  gameState.scene.add(directionalLight);
  gameState.directionalLight = directionalLight;
  
  // Add hemisphere light for sky/ground color
  const hemisphereLight = new THREE.HemisphereLight(
    0x4080ff,  // Sky color (blue)
    0x202040,  // Ground color (dark blue)
    0.4
  );
  hemisphereLight.position.set(0, 20, 0);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
  
  // Add point lights for neon effect
  createNeonPointLights();
}

function createNeonPointLights() {
  const positions = [
    { x: -10, y: 5, z: -10 },
    { x: 10, y: 5, z: -10 },
    { x: -10, y: 5, z: 10 },
    { x: 10, y: 5, z: 10 }
  ];
  
  const colors = [0xff0066, 0x00ffff, 0xffff00, 0xff00ff];
  
  positions.forEach((pos, i) => {
    const pointLight = new THREE.PointLight(colors[i], 0.8, 20);
    pointLight.position.set(pos.x, pos.y, pos.z);
    gameState.scene.add(pointLight);
    gameState.pointLights.push(pointLight);
    
    // Add visual representation
    const sphereGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: colors[i],
      transparent: true,
      opacity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(pointLight.position);
    gameState.scene.add(sphere);
  });
}

export function updateLighting() {
  // Animate point lights for dynamic effect
  gameState.pointLights.forEach((light, i) => {
    const time = gameState.frameCount * 0.01;
    light.intensity = 0.6 + Math.sin(time + i) * 0.2;
  });
}