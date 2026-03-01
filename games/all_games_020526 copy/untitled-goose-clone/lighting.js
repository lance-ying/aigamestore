import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient - soft white/yellow for morning feel
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.6);
    gameState.scene.add(ambientLight);

    // Sun - Directional
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    
    // Shadow properties for low-poly look
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    const d = 40;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    
    gameState.scene.add(sunLight);
    
    // Subtle hemisphere light for sky/ground contrast
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x8B4513, 0.4);
    gameState.scene.add(hemiLight);
}