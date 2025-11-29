// entities.js - Game entity classes
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, PLAYER_SPEED, PLAYER_JUMP_POWER, logPlayerInfo, FRICTION, AIR_RESISTANCE } from './globals.js';
import { getCameraDirection, getCameraRightVector } from './camera.js';

export class Player {
    constructor(x, y, z) {
        // Create player geometry - a simple capsule-like shape
        const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.3
        });
        this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Physics properties
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.speed = PLAYER_SPEED;
        this.jumpPower = PLAYER_JUMP_POWER;
        this.onGround = false;
        this.mass = 1.0;
        
        // Player dimensions
        this.radius = 0.4;
        this.height = 1.8;
        
        // State
        this.isMoving = false;
        this.lastPosition = new THREE.Vector3().copy(this.mesh.position);
        this.lastLogTime = 0;
        
        // Portal cooldown
        this.justTeleported = false;
        this.teleportCooldown = 0;
        
        // Add to scene
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        // Update teleport cooldown
        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= deltaTime;
            if (this.teleportCooldown <= 0) {
                this.justTeleported = false;
            }
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.acceleration.add(gameState.gravity);
        }
        
        // Update velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime * 60));
        
        // Apply friction/air resistance
        if (this.onGround) {
            this.velocity.x *= FRICTION;
            this.velocity.z *= FRICTION;
        } else {
            this.velocity.multiplyScalar(AIR_RESISTANCE);
        }
        
        // Update position
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime * 60));
        
        // Reset acceleration
        this.acceleration.set(0, 0, 0);
        
        // Log position periodically
        if (Date.now() - this.lastLogTime > 100) {
            logPlayerInfo(this);
            this.lastLogTime = Date.now();
        }
    }
    
    move(direction) {
        const moveDir = direction.clone().normalize();
        this.acceleration.add(moveDir.multiplyScalar(this.speed));
        this.isMoving = true;
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }
    }
    
    setOnGround(value) {
        this.onGround = value;
    }
    
    teleport(position, velocity) {
        this.mesh.position.copy(position);
        this.velocity.copy(velocity);
        this.justTeleported = true;
        this.teleportCooldown = 0.5; // 0.5 second cooldown
    }
}

export class Platform {
    constructor(x, y, z, width, height, depth, isPortalSurface = false) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: isPortalSurface ? 0xeeeeee : 0x333333,
            roughness: 0.8,
            metalness: 0.2
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.isPortalSurface = isPortalSurface;
        
        // Store for portal placement
        if (isPortalSurface) {
            gameState.portalSurfaces.push(this);
        }
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
    
    getBounds() {
        return {
            min: new THREE.Vector3(
                this.mesh.position.x - this.width / 2,
                this.mesh.position.y - this.height / 2,
                this.mesh.position.z - this.depth / 2
            ),
            max: new THREE.Vector3(
                this.mesh.position.x + this.width / 2,
                this.mesh.position.y + this.height / 2,
                this.mesh.position.z + this.depth / 2
            )
        };
    }
}

export class Portal {
    constructor(isBlue = true) {
        this.isBlue = isBlue;
        this.active = false;
        this.position = new THREE.Vector3();
        this.normal = new THREE.Vector3(0, 0, 1);
        this.surface = null;
        
        // Create portal visual
        const geometry = new THREE.RingGeometry(0.8, 1.0, 32);
        const material = new THREE.MeshBasicMaterial({
            color: isBlue ? 0x0099ff : 0xff6600,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.visible = false;
        
        // Create portal center glow
        const glowGeometry = new THREE.CircleGeometry(0.8, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: isBlue ? 0x0099ff : 0xff6600,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3
        });
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(this.glowMesh);
        
        gameState.scene.add(this.mesh);
    }
    
    place(position, normal, surface) {
        this.active = true;
        this.position.copy(position);
        this.normal.copy(normal);
        this.surface = surface;
        
        // Position portal slightly in front of surface
        this.mesh.position.copy(position).add(normal.clone().multiplyScalar(0.05));
        
        // Orient portal to face away from surface
        const up = new THREE.Vector3(0, 1, 0);
        if (Math.abs(normal.y) > 0.9) {
            up.set(0, 0, 1);
        }
        this.mesh.lookAt(this.mesh.position.clone().add(normal));
        
        this.mesh.visible = true;
    }
    
    deactivate() {
        this.active = false;
        this.mesh.visible = false;
    }
    
    update(deltaTime) {
        if (this.active) {
            // Animate portal rotation
            this.glowMesh.rotation.z += deltaTime * 2;
        }
    }
}

export class ExitDoor {
    constructor(x, y, z) {
        // Create door frame
        const frameGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.3);
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3,
            roughness: 0.5,
            metalness: 0.7
        });
        this.frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        this.frameMesh.position.set(x, y, z);
        this.frameMesh.castShadow = true;
        this.frameMesh.receiveShadow = true;
        
        // Create door center (glowing)
        const doorGeometry = new THREE.PlaneGeometry(2.0, 3.0);
        const doorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
        this.doorMesh.position.set(x, y, z + 0.1);
        
        gameState.scene.add(this.frameMesh);
        gameState.scene.add(this.doorMesh);
        
        this.position = new THREE.Vector3(x, y, z);
        this.width = 2.5;
        this.height = 3.5;
    }
    
    update(deltaTime) {
        // Animate door glow
        const intensity = 0.3 + Math.sin(gameState.frameCount * 0.05) * 0.1;
        this.frameMesh.material.emissiveIntensity = intensity;
        this.doorMesh.material.opacity = 0.3 + Math.sin(gameState.frameCount * 0.05) * 0.1;
    }
    
    checkPlayerCollision(player) {
        const distance = player.mesh.position.distanceTo(this.position);
        return distance < 2.0;
    }
}

export class Collectible {
    constructor(x, y, z) {
        const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;
        
        this.value = 10;
        this.initialY = y;
        this.collected = false;
        
        gameState.scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (this.collected) return;
        
        // Rotate
        this.mesh.rotation.y += deltaTime * 3;
        
        // Bob up and down
        this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * 0.05) * 0.2;
        
        // Check collision with player
        if (gameState.player) {
            const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
            if (distance < 1.0) {
                this.collect();
            }
        }
    }
    
    collect() {
        if (this.collected) return;
        this.collected = true;
        gameState.score += this.value;
        gameState.scene.remove(this.mesh);
    }
}