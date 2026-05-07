import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

class Particle {
    constructor(pos, color) {
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: color })
        );
        this.mesh.position.copy(pos);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );
        
        this.life = 1.0;
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        this.velocity.y -= 0.02; // Gravity
        this.mesh.position.add(this.velocity);
        this.mesh.rotation.x += 0.1;
        this.mesh.rotation.y += 0.1;
        
        this.life -= deltaTime;
        this.mesh.scale.setScalar(this.life);
        
        if (this.life <= 0) return false;
        return true;
    }
    
    dispose() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}

export function createExplosion(pos, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(pos, color));
    }
}

export function updateParticles(deltaTime) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        if (!p.update(deltaTime)) {
            p.dispose();
            gameState.particles.splice(i, 1);
        }
    }
}