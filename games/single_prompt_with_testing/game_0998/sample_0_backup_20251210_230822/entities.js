import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONFIG } from './globals.js';
import { easeOutElastic } from './utils.js';

// ==========================================
// PLAYER (JELLY)
// ==========================================
export class Jelly {
    constructor(x, y, z) {
        // Jelly Geometry
        const geometry = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
        
        // Jelly Material - Translucent and shiny
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x00ffff,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.6, // Glass-like
            thickness: 1.0,
            clearcoat: 1.0,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Add internal glow (simulated with smaller mesh)
        const coreGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.mesh.add(this.core);

        gameState.scene.add(this.mesh);

        // Physics State
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.isDead = false;
        
        // Animation State
        this.scaleAnim = { x: 1, y: 1, z: 1 };
        this.jumpTimer = 0;
        this.landTimer = 0;
    }

    update(deltaTime) {
        // Handle Death
        if (this.isDead) return;

        // Apply scale animation (Squash and Stretch)
        this.updateAnimation(deltaTime);
        
        // Horizontal Movement (Air control)
        if (gameState.controlMode === "HUMAN") {
            const speed = GAME_CONFIG.MOVE_SPEED;
            if (gameState.keys.ArrowLeft || gameState.keys.KeyA) {
                this.mesh.position.x -= speed;
            }
            if (gameState.keys.ArrowRight || gameState.keys.KeyD) {
                this.mesh.position.x += speed;
            }
            
            // Limit horizontal range
            this.mesh.position.x = Math.max(-4, Math.min(4, this.mesh.position.x));
        }

        // Apply scale to mesh
        this.mesh.scale.set(this.scaleAnim.x, this.scaleAnim.y, this.scaleAnim.z);
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = GAME_CONFIG.JUMP_FORCE;
            this.onGround = false;
            
            // Stretch Animation
            this.triggerSquashStretch(0.7, 1.4, 0.7);
            
            // Particle effect
            createParticles(this.mesh.position, 5, 0x00ffff);
        }
    }
    
    land() {
        if (this.velocity.y < -0.1) { // Only squash if falling fast enough
             // Squash Animation
            this.triggerSquashStretch(1.3, 0.7, 1.3);
        }
    }
    
    triggerSquashStretch(x, y, z) {
        this.scaleAnim.x = x;
        this.scaleAnim.y = y;
        this.scaleAnim.z = z;
    }
    
    updateAnimation(dt) {
        // Return to normal scale (1,1,1) using lerp (spring-like would be better but lerp is stable)
        const restorationSpeed = 0.15;
        this.scaleAnim.x += (1 - this.scaleAnim.x) * restorationSpeed;
        this.scaleAnim.y += (1 - this.scaleAnim.y) * restorationSpeed;
        this.scaleAnim.z += (1 - this.scaleAnim.z) * restorationSpeed;
    }

    takeDamage(amount) {
        this.isDead = true;
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Explode particles
        createParticles(this.mesh.position, 20, 0x00ffff, 0.5);
    }
}

// ==========================================
// PLATFORM PAIR
// ==========================================
export class PlatformPair {
    constructor(y, isRotated) {
        this.state = 'OPEN'; // OPEN, CLOSING, CLOSED
        this.y = y;
        this.gapSize = 3;
        this.moveSpeed = GAME_CONFIG.PLATFORM_CLOSE_SPEED;
        this.targetGap = 0; // Blocks touch
        this.isRotated = isRotated; // If true, moves along Z, else along X

        const width = 10;
        const height = 1;
        const depth = 5;
        
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x666666,
            roughness: 0.5 
        });

        // Create two blocks
        this.leftBlock = new THREE.Mesh(geometry, material);
        this.rightBlock = new THREE.Mesh(geometry, material);
        
        this.leftBlock.castShadow = true;
        this.leftBlock.receiveShadow = true;
        this.rightBlock.castShadow = true;
        this.rightBlock.receiveShadow = true;

        // Position them based on rotation
        const offset = 8; // Start far apart
        if (this.isRotated) {
            // Move along Z
            this.leftBlock.rotation.y = Math.PI / 2;
            this.rightBlock.rotation.y = Math.PI / 2;
            
            this.leftBlock.position.set(0, y, -offset);
            this.rightBlock.position.set(0, y, offset);
        } else {
            // Move along X
            this.leftBlock.position.set(-offset, y, 0);
            this.rightBlock.position.set(offset, y, 0);
        }

        gameState.scene.add(this.leftBlock);
        gameState.scene.add(this.rightBlock);
        gameState.platforms.push(this);
    }

    update(deltaTime) {
        if (this.state === 'CLOSING') {
            const speed = this.moveSpeed;
            
            if (this.isRotated) {
                // Move Z towards 0
                if (this.leftBlock.position.z < -2.5) this.leftBlock.position.z += speed;
                if (this.rightBlock.position.z > 2.5) this.rightBlock.position.z -= speed;
                
                // Check if closed (blocks are 5 units deep (now width due to rotation), so meet at +/- 2.5)
                // Actually geometry is width=10, height=1, depth=5.
                // If rotated 90deg, local width is aligned with Z. 
                // We want them to meet at center.
                // Left block is at -Z, moves +Z. Right block is at +Z, moves -Z.
                // They should stop when they touch.
                
                // Let's rely on simple hardcoded limit.
                // Width 10. Center at 0. Edges at -5 and +5.
                // We want edges to meet at 0.
                // So center of left block needs to be at -5.
                
                if (this.leftBlock.position.z >= -5) {
                     this.leftBlock.position.z = -5;
                     this.state = 'CLOSED';
                }
                if (this.rightBlock.position.z <= 5) {
                    this.rightBlock.position.z = 5;
                }

            } else {
                // Move X towards 0
                if (this.leftBlock.position.x < -5) this.leftBlock.position.x += speed;
                if (this.rightBlock.position.x > 5) this.rightBlock.position.x -= speed;
                
                if (this.leftBlock.position.x >= -5) {
                    this.leftBlock.position.x = -5;
                    this.state = 'CLOSED';
                }
                if (this.rightBlock.position.x <= 5) {
                    this.rightBlock.position.x = 5;
                }
            }
        }
    }
    
    close() {
        if (this.state === 'OPEN') {
            this.state = 'CLOSING';
        }
    }
}

// ==========================================
// LIQUID
// ==========================================
export class Liquid {
    constructor() {
        // Large plane or box
        const geometry = new THREE.BoxGeometry(50, 50, 50);
        const material = new THREE.MeshStandardMaterial({
            color: 0x220033, // Dark purple
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.9
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, -26, 0); // Start way below
        this.mesh.receiveShadow = true;
        
        gameState.scene.add(this.mesh);
        
        this.baseSpeed = GAME_CONFIG.LIQUID_RISE_SPEED_BASE;
        this.currentSpeed = this.baseSpeed;
    }
    
    update(deltaTime) {
        // Accelerate slowly based on game progression
        this.currentSpeed += GAME_CONFIG.LIQUID_RISE_ACCELERATION * 0.01;
        this.mesh.position.y += this.currentSpeed;
        
        // Visual wave effect (rotation)
        this.mesh.rotation.x = Math.sin(gameState.frameCount * 0.01) * 0.05;
        this.mesh.rotation.z = Math.cos(gameState.frameCount * 0.013) * 0.05;
    }
}

// ==========================================
// COLLECTIBLE
// ==========================================
export class Collectible {
    constructor(x, y, z) {
        const geometry = new THREE.OctahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            roughness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        this.initialY = y;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
    }
    
    update(deltaTime) {
        // Rotate
        this.mesh.rotation.y += 0.05;
        this.mesh.rotation.z += 0.02;
        
        // Bob
        this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * 0.05) * 0.2;
        
        // Collision check
        if (gameState.player) {
            if (this.mesh.position.distanceTo(gameState.player.mesh.position) < 1.0) {
                this.collect();
            }
        }
        
        // Check if below liquid
        if (gameState.liquid && this.mesh.position.y < gameState.liquid.mesh.position.y) {
            this.remove();
        }
    }
    
    collect() {
        gameState.score += 50;
        createParticles(this.mesh.position, 10, 0xffff00, 0.5);
        this.remove();
    }
    
    remove() {
        gameState.scene.remove(this.mesh);
        const index = gameState.collectibles.indexOf(this);
        if (index > -1) gameState.collectibles.splice(index, 1);
    }
}

// ==========================================
// PARTICLES
// ==========================================
export function createParticles(pos, count, color, scale = 1.0) {
    const geometry = new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.1 * scale);
    const material = new THREE.MeshBasicMaterial({ color: color });
    
    for (let i = 0; i < count; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(pos);
        
        // Random velocity
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3 + 0.2, // Upward bias
            (Math.random() - 0.5) * 0.3
        );
        
        particle.life = 1.0; // Seconds
        
        gameState.scene.add(particle);
        gameState.particles.push(particle);
    }
}

export function updateParticles(deltaTime) {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        
        p.position.add(p.velocity);
        p.velocity.y += GAME_CONFIG.GRAVITY * 0.5; // lighter gravity
        p.life -= deltaTime * 0.02; // Decay
        
        p.rotation.x += 0.1;
        p.rotation.y += 0.1;
        
        if (p.life <= 0) {
            gameState.scene.remove(p);
            gameState.particles.splice(i, 1);
        }
    }
}