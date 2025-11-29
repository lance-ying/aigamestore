import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function handleCollisions() {
    if (!gameState.player) return;
    
    const car = gameState.player;
    const carPos = car.mesh.position;
    
    // Car vs Props (Simple Circle Collision)
    const carRadius = 1.5;
    
    gameState.props.forEach(prop => {
        if (!prop.active) return;
        
        const dist = new THREE.Vector2(carPos.x, carPos.z).distanceTo(new THREE.Vector2(prop.mesh.position.x, prop.mesh.position.z));
        const minDist = carRadius + (prop.radius || 1.0);
        
        if (dist < minDist) {
            // Collision Response: Bounce back
            const pushDir = new THREE.Vector3(carPos.x - prop.mesh.position.x, 0, carPos.z - prop.mesh.position.z).normalize();
            
            // Stop velocity towards object
            car.velocity.multiplyScalar(0.5);
            car.velocity.add(pushDir.multiplyScalar(10)); // Bounce
            
            // Move out of collision
            const overlap = minDist - dist;
            car.mesh.position.add(pushDir.multiplyScalar(overlap));
        }
    });
    
    // Bounds Checking (World Borders)
    const limit = 98; // 200x200 map
    if (Math.abs(carPos.x) > limit) {
        carPos.x = Math.sign(carPos.x) * limit;
        car.velocity.x *= -0.5; // Bounce off wall
    }
    if (Math.abs(carPos.z) > limit) {
        carPos.z = Math.sign(carPos.z) * limit;
        car.velocity.z *= -0.5;
    }
}