import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PLAYER_RADIUS, GRAVITY } from './globals.js';
import { randomColorVariant } from './utils.js';
import { applyGrapplePhysics } from './physics.js';

/**
 * Base Entity Class
 */
class Entity {
    constructor(x, y, z) {
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.mesh = null;
        this.isStatic = false;
        this.gravityScale = 1.0;
        
        // Add to global lists
        gameState.entities.push(this);
    }
    
    update(deltaTime) {
        // Base update - overridden by children
    }
}

/**
 * Player Class - The Blue Slime Ball
 */
export class Player extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.radius = PLAYER_RADIUS;
        this.isPlayer = true;
        this.onGround = false;
        this.health = 100;
        
        // Grapple State
        this.grappleTarget = null;
        this.isGrappling = false;
        this.grappleLine = null; // Visual line
        
        // Create Mesh
        // Slime/Ball appearance
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x0088ff, 
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0x001133
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.copy(this.position);
        
        gameState.scene.add(this.mesh);
        
        // Create Grapple Visual
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 });
        this.grappleLine = new THREE.Line(lineGeo, lineMat);
        this.grappleLine.visible = false;
        this.grappleLine.frustumCulled = false; // Always render if visible
        gameState.scene.add(this.grappleLine);
    }
    
    update(deltaTime) {
        // Squash and Stretch effect based on velocity
        const speed = this.velocity.length();
        if (speed > 0.1) {
            // Stretch in direction of movement
            // Made more "squishy" by increasing multiplier and max stretch
            const stretch = Math.min(1.0 + speed * 1.0, 1.6);
            const squash = 1.0 / Math.sqrt(stretch);
            
            // Reset scale then apply
            // Using non-uniform scale (squash, squash, stretch) creates a wobbly effect when rolling
            this.mesh.scale.set(squash, squash, stretch);
            
        } else {
            this.mesh.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // Handle Grapple Physics
        if (this.isGrappling && this.grappleTarget) {
            applyGrapplePhysics(this, this.grappleTarget, deltaTime);
            
            // Update visual line
            const positions = this.grappleLine.geometry.attributes.position.array;
            positions[0] = this.position.x;
            positions[1] = this.position.y;
            positions[2] = this.position.z;
            positions[3] = this.grappleTarget.position.x;
            positions[4] = this.grappleTarget.position.y;
            positions[5] = this.grappleTarget.position.z;
            this.grappleLine.geometry.attributes.position.needsUpdate = true;
            this.grappleLine.visible = true;
        } else {
            this.grappleLine.visible = false;
        }

        // Death Check
        if (this.position.y < -30) {
            this.die();
        }
        
        // Win Check (End of level ~ Z = -200)
        if (this.position.z < -gameState.levelLength) {
             gameState.gamePhase = "GAME_OVER_WIN";
        }
    }
    
    startGrapple() {
        // Find nearest grapple point in front of player
        let closestDist = 25.0; // Max range
        let bestPoint = null;
        
        // Filter points roughly in front of camera/player
        // (Simplified to distance for this implementation)
        gameState.grapplePoints.forEach(pt => {
            const dist = this.position.distanceTo(pt.position);
            if (dist < closestDist && pt.position.y > this.position.y) {
                closestDist = dist;
                bestPoint = pt;
            }
        });
        
        if (bestPoint) {
            this.isGrappling = true;
            this.grappleTarget = bestPoint;
            // Initial pull
            const dir = new THREE.Vector3().subVectors(bestPoint.position, this.position).normalize();
            this.velocity.add(dir.multiplyScalar(0.2));
        }
    }
    
    stopGrapple() {
        this.isGrappling = false;
        this.grappleTarget = null;
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = 0.8; // Increased jump impulse (was 0.6)
            this.onGround = false;
            
            // Create particle effect at feet
            createExplosion(this.position.clone().sub(new THREE.Vector3(0, 0.5, 0)), 5, 0xaaaaaa);
        }
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        this.velocity.set(0, 0, 0);
    }
}

/**
 * Platform - Can be static or crumbling
 */
export class Platform extends Entity {
    constructor(x, y, z, width, depth, type = 'NORMAL') {
        super(x, y, z);
        this.width = width;
        this.height = 1; // Standard thickness
        this.depth = depth;
        this.halfSize = new THREE.Vector3(width/2, 0.5, depth/2);
        this.isStatic = true; // Starts static
        this.type = type; // 'NORMAL', 'CRUMBLE', 'FALLING'
        
        // Crumble Logic
        this.crumbleTimer = 0;
        this.crumbleDuration = 0.8; // Time before falling
        this.isShaking = false;
        this.initialPos = this.position.clone();
        
        // Mesh
        const geometry = new THREE.BoxGeometry(width, 1, depth);
        let color = type === 'CRUMBLE' ? 0xffaa00 : 0x44cc44;
        if (type === 'START') color = 0x888888;
        if (type === 'FINISH') color = 0xff0000;
        
        const material = new THREE.MeshStandardMaterial({ 
            color: color,
            roughness: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
    
    triggerCrumble() {
        if (this.type === 'CRUMBLE' && !this.isShaking && this.isStatic) {
            this.isShaking = true;
            // Flash color
            this.mesh.material.emissive.setHex(0x550000);
        }
    }
    
    update(deltaTime) {
        if (this.isShaking) {
            this.crumbleTimer += deltaTime;
            
            // Shake effect
            const shakeAmount = 0.1 * (this.crumbleTimer / this.crumbleDuration);
            this.mesh.position.set(
                this.initialPos.x + (Math.random() - 0.5) * shakeAmount,
                this.initialPos.y + (Math.random() - 0.5) * shakeAmount,
                this.initialPos.z + (Math.random() - 0.5) * shakeAmount
            );
            
            // Start falling
            if (this.crumbleTimer >= this.crumbleDuration) {
                this.isShaking = false;
                this.isStatic = false; // Enables physics gravity
                this.type = 'FALLING';
                this.mesh.material.color.setHex(0x555555); // Turn grey
                this.mesh.material.emissive.setHex(0x000000);
                
                // Add initial angular velocity for chaotic fall
                this.velocity.x = (Math.random() - 0.5) * 0.1;
                this.velocity.z = (Math.random() - 0.5) * 0.1;
                
                // Spawn particles
                createExplosion(this.position, 8, 0xffaa00);
            }
        }
        
        // Update physics if falling
        if (!this.isStatic) {
            // Handled by global physics loop for position/velocity
            // We just rotate slightly for effect
            this.mesh.rotation.x += deltaTime * 0.5;
            this.mesh.rotation.z += deltaTime * 0.3;
        }
    }
}

/**
 * Grapple Point - Static floating orb
 */
export class GrapplePoint extends Entity {
    constructor(x, y, z) {
        super(x, y, z);
        this.isStatic = true;
        
        const geometry = new THREE.IcosahedronGeometry(0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        gameState.scene.add(this.mesh);
        gameState.grapplePoints.push(this);
        
        // Animation offset
        this.timeOffset = Math.random() * 100;
    }
    
    update(deltaTime) {
        // Floating animation
        this.mesh.position.y = this.position.y + Math.sin(gameState.frameCount * 0.05 + this.timeOffset) * 0.2;
        this.mesh.rotation.y += 0.02;
        this.mesh.rotation.z += 0.01;
    }
}

/**
 * Particle System Helper
 */
export class Particle extends Entity {
    constructor(pos, color) {
        super(pos.x, pos.y, pos.z);
        this.lifetime = 1.0;
        this.age = 0;
        
        const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        
        // Random velocity
        this.velocity.set(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3 + 0.2,
            (Math.random() - 0.5) * 0.3
        );
        
        gameState.scene.add(this.mesh);
        gameState.entities.push(this);
    }
    
    update(deltaTime) {
        this.age += deltaTime;
        if (this.age > this.lifetime) {
            // Destroy
            gameState.scene.remove(this.mesh);
            const idx = gameState.entities.indexOf(this);
            if (idx > -1) gameState.entities.splice(idx, 1);
            return;
        }
        
        // Shrink
        const scale = 1 - (this.age / this.lifetime);
        this.mesh.scale.set(scale, scale, scale);
    }
}

export function createExplosion(pos, count, color) {
    for (let i = 0; i < count; i++) {
        new Particle(pos, color);
    }
}