/**
 * Simple particle system
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { randomRange } from './utils.js';

export class Particle {
    constructor(pos, color, speed, life) {
        this.position = pos.clone();
        this.velocity = new THREE.Vector3(
            randomRange(-1, 1),
            randomRange(0.5, 2),
            randomRange(-1, 1)
        ).multiplyScalar(speed);
        
        this.life = life;
        this.maxLife = life;
        
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        gameState.scene.add(this.mesh);
        gameState.particles.push(this);
    }
    
    update(dt) {
        this.life -= dt;
        
        // Physics
        this.velocity.y += -0.1; // Heavy gravity
        this.position.add(this.velocity.clone().multiplyScalar(dt * 60));
        
        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.x += 0.1;
        this.mesh.rotation.y += 0.1;
        
        // Fade
        this.mesh.material.opacity = this.life / this.maxLife;
        
        if (this.life <= 0) {
            this.destroy();
        }
    }
    
    destroy() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        
        const idx = gameState.particles.indexOf(this);
        if (idx > -1) gameState.particles.splice(idx, 1);
    }
}