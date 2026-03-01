import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, TUNNEL_RADIUS, PLAYER_RADIUS, GRAVITY, JUMP_FORCE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { isJumpPressed } from './input.js';

// ==========================================
// PLAYER CLASS
// ==========================================
export class Player {
    constructor() {
        // Create mesh
        const geometry = new THREE.SphereGeometry(PLAYER_RADIUS, 32, 32);
        
        // Create a cool looking material
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.7,
            roughness: 0.1,
            emissive: 0x004444,
            emissiveIntensity: 0.5
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // State
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = false;
        this.jumpCooldown = 0;
        
        // Visual rotation for rolling effect
        this.rollAxis = new THREE.Vector3(1, 0, 0);
        
        // Add to scene
        gameState.scene.add(this.mesh);
        
        this.reset();
    }
    
    reset() {
        // Player position relative to the camera/world center
        // In this "Twist" implementation, the player stays at (0, y, z) visually mostly, 
        // but physically Z increases.
        this.mesh.position.set(0, TUNNEL_RADIUS + PLAYER_RADIUS, 0);
        this.velocity.set(0, 0, 0);
        this.onGround = true;
        this.jumpCooldown = 0;
        
        // Reset rotation
        this.mesh.rotation.set(0, 0, 0);
    }
    
    update(deltaTime) {
        // 1. Move forward (Z) logic is handled by "distanceTraveled" in game loop usually,
        // but here let's actually move the player mesh in Z and have camera follow.
        // It simplifies physics checks.
        
        const speed = gameState.currentSpeed;
        this.mesh.position.z += speed; // Move forward in world space
        
        // 2. Physics: Gravity and Jumping
        // Apply Gravity
        this.velocity.y -= GRAVITY;
        
        // Apply Velocity
        this.mesh.position.y += this.velocity.y;
        
        // Ground Collision Check happens in game.js or physics.js usually, 
        // but we can delegate to a helper here if passed the platform manager
        this.checkCollisions();
        
        // 3. Jump Input
        if (this.onGround && isJumpPressed() && this.jumpCooldown <= 0) {
            this.velocity.y = JUMP_FORCE;
            this.onGround = false;
            this.jumpCooldown = 10; // Frames
            
            // Spawn jump particles
            if(gameState.particleSystem) {
                gameState.particleSystem.emit(this.mesh.position, 10, 0x00ffff);
            }
        }
        
        if (this.jumpCooldown > 0) this.jumpCooldown--;
        
        // 4. Visual Rolling
        // Rotate the sphere mesh around X axis based on speed
        const rollSpeed = speed / PLAYER_RADIUS;
        this.mesh.rotateOnAxis(this.rollAxis, -rollSpeed);
        
        // 5. Game Over Check
        // If player falls too far below the tunnel radius
        if (this.mesh.position.y < -10) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    checkCollisions() {
        // This requires querying the Platform Manager
        // We calculate where the player IS in terms of Angle and Z
        
        const playerZ = this.mesh.position.z;
        const playerAngle = 0; // Visually, player is always at angle 0 (top)
        
        // The WORLD is rotated by gameState.worldRotation.
        // So the point on the tunnel directly below the player corresponds to angle:
        // -gameState.worldRotation
        // We need to normalize this angle to 0..2PI or -PI..PI
        
        let checkAngle = -gameState.worldRotation;
        
        // Normalize to -PI to PI
        while (checkAngle <= -Math.PI) checkAngle += Math.PI * 2;
        while (checkAngle > Math.PI) checkAngle -= Math.PI * 2;
        
        // Check if there is a platform at (playerZ, checkAngle)
        const groundHeight = gameState.platformManager.getGroundHeight(playerZ, checkAngle);
        
        if (groundHeight !== null) {
            // Platform exists below
            const feetPos = this.mesh.position.y - PLAYER_RADIUS;
            
            // If feet are falling through the ground (and we were previously above or near it)
            // Added tolerance check: only snap if feet are within 1.0 unit of the ground surface
            // This prevents "teleporting" from deep below up to the platform
            if (feetPos <= groundHeight && feetPos >= groundHeight - 1.0 && this.velocity.y <= 0) {
                // Snap to ground
                this.mesh.position.y = groundHeight + PLAYER_RADIUS;
                this.velocity.y = 0;
                this.onGround = true;
            } else {
                // We are in the air above the platform OR too far below
                this.onGround = false;
            }
        } else {
            // No platform below (gap)
            this.onGround = false;
        }
    }
}

// ==========================================
// PLATFORM MANAGER
// ==========================================
export class PlatformManager {
    constructor() {
        this.platforms = [];
        this.pool = []; // Object pool for performance
        this.chunkSize = 10;
        this.nextSpawnZ = 0;
        
        // Procedural Generation State
        this.currentAngle = 0;
        this.platformLength = 10;
        this.gapLength = 1.5; // Reduced from 3 to make platforms closer
        
        this.materials = [
            new THREE.MeshStandardMaterial({ color: 0xff0055, roughness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x55ff00, roughness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0x0055ff, roughness: 0.3 }),
            new THREE.MeshStandardMaterial({ color: 0xffff00, roughness: 0.3 })
        ];
        
        this.reset();
    }
    
    reset() {
        // Remove active platforms
        for (const p of this.platforms) {
            gameState.scene.remove(p.mesh);
            this.pool.push(p);
        }
        this.platforms = [];
        this.nextSpawnZ = -10; // Start a bit behind
        this.currentAngle = 0;
        
        // Initial safe zone
        this.createPlatform(0, 40, 0); // 40 units long start platform
        this.nextSpawnZ = 40;
    }
    
    update(playerZ) {
        // 1. Cleanup old platforms
        const removeThreshold = playerZ - 20;
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            if (this.platforms[i].zEnd < removeThreshold) {
                const p = this.platforms[i];
                gameState.scene.remove(p.mesh);
                this.pool.push(p);
                this.platforms.splice(i, 1);
            }
        }
        
        // 2. Spawn new platforms ahead
        const spawnThreshold = playerZ + 100;
        while (this.nextSpawnZ < spawnThreshold) {
            this.spawnNextSequence();
        }
    }
    
    spawnNextSequence() {
        // Logic to generate the twisting path
        // Decide next segment properties
        const isGap = Math.random() < 0.3 && this.nextSpawnZ > 50; // 30% chance of gap, but not at start
        
        if (isGap) {
            this.nextSpawnZ += this.gapLength + Math.random() * 1.5; // Random gap size (reduced variation)
        }
        
        // Change angle for the twist
        const angleChange = (Math.random() - 0.5) * 1.5; // Rotate left or right
        this.currentAngle += angleChange;
        
        // Normalize angle
        // Keep it simple for spawning, wrap visual logic in creation
        
        const length = this.platformLength + Math.random() * 10;
        
        this.createPlatform(this.nextSpawnZ, length, this.currentAngle);
        
        // Maybe spawn a gem
        if (Math.random() < 0.5) {
            gameState.collectibleManager.spawnGem(
                this.nextSpawnZ + length / 2, 
                this.currentAngle, 
                TUNNEL_RADIUS + 1.5
            );
        }
        
        this.nextSpawnZ += length;
    }
    
    createPlatform(zStart, length, angle) {
        let p;
        if (this.pool.length > 0) {
            p = this.pool.pop();
        } else {
            // Create new mesh if pool empty
            const geometry = new THREE.BoxGeometry(1, 1, 1); // Unit size, scaled later
            const mesh = new THREE.Mesh(geometry, this.materials[0]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            p = { mesh: mesh };
        }
        
        // Configure platform logic
        p.zStart = zStart;
        p.zEnd = zStart + length;
        p.angle = angle;
        p.widthAngle = 0.8; // Width in radians (approx 45 degrees)
        p.valid = true;
        
        // Configure mesh transformation
        // We want a platform at radius R, angle A.
        // It's a box.
        // Width (arc length) ~ Radius * widthAngle
        const arcWidth = TUNNEL_RADIUS * p.widthAngle;
        const thickness = 1;
        
        p.mesh.scale.set(arcWidth, thickness, length);
        
        // Position
        // Convert Cylindrical(r, theta, z) to Cartesian(x, y, z)
        // x = r * sin(theta)
        // y = r * cos(theta)
        // z = center of platform
        
        const r = TUNNEL_RADIUS;
        const x = r * Math.sin(angle);
        const y = r * Math.cos(angle);
        const z = zStart + length / 2;
        
        p.mesh.position.set(x, y, z);
        
        // Rotation
        // The box needs to face the center.
        // Z rotation = -angle
        p.mesh.rotation.set(0, 0, -angle);
        
        // Pick random color
        const matIndex = Math.floor(Math.random() * this.materials.length);
        p.mesh.material = this.materials[matIndex];
        
        gameState.scene.add(p.mesh);
        this.platforms.push(p);
    }
    
    getGroundHeight(z, checkAngle) {
        // Find platform at z
        for (const p of this.platforms) {
            if (z >= p.zStart && z <= p.zEnd) {
                // Check angle overlap
                // We need to handle angle wrapping (e.g. PI and -PI are close)
                
                let diff = checkAngle - p.angle;
                // Normalize diff to -PI..PI
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                if (Math.abs(diff) < p.widthAngle / 2) {
                    // Collision!
                    // Return the surface height. 
                    // Since the platforms form a tunnel, the "height" is relative to the radius.
                    // The player logic expects a Y value. 
                    // But wait, the player moves in world space Y? 
                    // Actually, the player's Y is checked against the ROTATED world.
                    // If we rotate the world so the platform is down, the platform surface is at TUNNEL_RADIUS + thickness/2.
                    return TUNNEL_RADIUS + 0.5; // Box height is 1, so surface is at +0.5 from center
                }
            }
        }
        return null; // Gap
    }
}

// ==========================================
// COLLECTIBLE MANAGER
// ==========================================
export class CollectibleManager {
    constructor() {
        this.gems = [];
        this.geometry = new THREE.OctahedronGeometry(0.5, 0);
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0xff00ff,
            emissive: 0xff00ff,
            emissiveIntensity: 0.8,
            metalness: 0.8,
            roughness: 0.2
        });
    }
    
    reset() {
        for (const g of this.gems) {
            gameState.scene.remove(g.mesh);
        }
        this.gems = [];
    }
    
    spawnGem(z, angle, radius) {
        const mesh = new THREE.Mesh(this.geometry, this.material);
        
        const x = radius * Math.sin(angle);
        const y = radius * Math.cos(angle);
        
        mesh.position.set(x, y, z);
        mesh.rotation.z = -angle; // Align with surface
        
        // Store logical data
        const gem = {
            mesh: mesh,
            z: z,
            angle: angle,
            radius: radius,
            active: true
        };
        
        gameState.scene.add(mesh);
        this.gems.push(gem);
    }
    
    update(deltaTime, player) {
        const rotationSpeed = 2.0;
        
        // Update gems
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const gem = this.gems[i];
            
            // Animate
            gem.mesh.rotation.y += rotationSpeed * deltaTime;
            
            // Check Collision
            // Simple distance check if player is close in Z
            if (Math.abs(gem.z - player.mesh.position.z) < 1.0) {
                // Check angular distance (is player rotated correctly?)
                let checkAngle = -gameState.worldRotation;
                while (checkAngle <= -Math.PI) checkAngle += Math.PI * 2;
                while (checkAngle > Math.PI) checkAngle -= Math.PI * 2;
                
                let diff = checkAngle - gem.angle;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                
                // If aligned and height matches (player y vs gem radius)
                // Player Y is typically TUNNEL_RADIUS when grounded
                // Gem is at TUNNEL_RADIUS + 1.5
                // Player jumps to ~ TUNNEL_RADIUS + 3.0
                
                const distY = Math.abs(player.mesh.position.y - gem.radius);
                
                if (Math.abs(diff) < 0.5 && distY < 1.5) {
                    // Collected!
                    this.collect(i);
                }
            }
            
            // Remove if passed
            if (gem.z < player.mesh.position.z - 10) {
                gameState.scene.remove(gem.mesh);
                this.gems.splice(i, 1);
            }
        }
    }
    
    collect(index) {
        const gem = this.gems[index];
        gameState.scene.remove(gem.mesh);
        this.gems.splice(index, 1);
        
        gameState.score += 50;
        
        // Particles
        if (gameState.particleSystem) {
            gameState.particleSystem.emit(gem.mesh.position, 20, 0xff00ff);
        }
    }
}

// ==========================================
// PARTICLE SYSTEM
// ==========================================
export class ParticleSystem {
    constructor() {
        this.particles = [];
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
            size: 0.2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        // We'll use individual meshes for simplicity in this constraints context 
        // or a shared geometry if we wanted to be very optimized.
        // Given constraints "make visual assets using code", let's use simple meshes for particles
        // actually THREE.Points is better.
        
        // Let's stick to a simple object pool of Meshes for "chunky" particles
        this.pool = [];
        this.active = [];
        this.geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    }
    
    reset() {
        for (const p of this.active) {
            gameState.scene.remove(p.mesh);
            this.pool.push(p);
        }
        this.active = [];
    }
    
    emit(position, count, colorHex) {
        for (let i = 0; i < count; i++) {
            let p;
            if (this.pool.length > 0) {
                p = this.pool.pop();
            } else {
                p = {
                    mesh: new THREE.Mesh(
                        this.geometry, 
                        new THREE.MeshBasicMaterial()
                    ),
                    velocity: new THREE.Vector3(),
                    life: 0
                };
            }
            
            p.mesh.position.copy(position);
            
            // Random velocity explosion
            p.velocity.set(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5 + 0.2, // Upward bias
                (Math.random() - 0.5) * 0.5
            );
            
            p.life = 1.0;
            p.mesh.material.color.setHex(colorHex);
            p.mesh.visible = true;
            
            gameState.scene.add(p.mesh);
            this.active.push(p);
        }
    }
    
    update(deltaTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            
            p.life -= deltaTime * 2.0; // Fade out speed
            
            if (p.life <= 0) {
                gameState.scene.remove(p.mesh);
                this.pool.push(p);
                this.active.splice(i, 1);
                continue;
            }
            
            // Physics
            p.velocity.y -= GRAVITY * 0.5;
            p.mesh.position.add(p.velocity);
            
            // Rotate particle
            p.mesh.rotation.x += 0.1;
            p.mesh.rotation.y += 0.1;
            
            // Scale/Fade
            p.mesh.scale.setScalar(p.life);
        }
    }
}