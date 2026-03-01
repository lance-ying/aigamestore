import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, DIRECTION, JUMP_FORCE, PLATFORM_WIDTH, PLATFORM_HEIGHT } from './globals.js';
import { setGamePhase } from './input.js';

export class Player {
    constructor() {
        this.radius = 0.4;
        this.mass = 1.0;
        
        // Geometry & Material
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: gameState.palette.player,
            roughness: 0.1,
            metalness: 0.2
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.mesh.position.set(0, 2, 0); // Start high
        
        // Physics State
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = DIRECTION.NORTH; // Moving -Z initially
        this.speed = gameState.currentSpeed;
        this.onGround = false;
        
        // Visuals
        this.rotationAxis = new THREE.Vector3(1, 0, 0);
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        // Constant forward movement based on direction
        this.speed = gameState.currentSpeed;
        
        // Set horizontal velocity based on direction
        // We override horizontal velocity but keep vertical velocity (gravity)
        const vY = this.velocity.y;
        
        switch(this.direction) {
            case DIRECTION.NORTH: this.velocity.set(0, vY, -this.speed); break;
            case DIRECTION.SOUTH: this.velocity.set(0, vY, this.speed); break;
            case DIRECTION.EAST:  this.velocity.set(this.speed, vY, 0); break;
            case DIRECTION.WEST:  this.velocity.set(-this.speed, vY, 0); break;
        }
        
        // Roll the ball visually
        const rollSpeed = this.speed / this.radius;
        // Rotation axis is perpendicular to velocity
        const moveDir = new THREE.Vector3(this.velocity.x, 0, this.velocity.z).normalize();
        const axis = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), moveDir).normalize();
        this.mesh.rotateOnWorldAxis(axis, rollSpeed);
        
        // Update trailing particles or effects if any
        if (gameState.frameCount % 5 === 0 && this.onGround) {
            spawnDust(this.mesh.position.clone().sub(new THREE.Vector3(0, this.radius - 0.1, 0)));
        }
    }
    
    jump() {
        if (this.onGround) {
            this.velocity.y = JUMP_FORCE;
            this.onGround = false;
            
            // Visual squash/stretch could go here
            spawnDust(this.mesh.position.clone().sub(new THREE.Vector3(0, this.radius, 0)), 5);
        }
    }
    
    turn(dir) {
        // Change direction 90 degrees relative to current
        // dir is "LEFT" or "RIGHT"
        
        // Map current direction to index 0-3 (N, E, S, W)
        // North=0, East=1, South=2, West=3
        
        let change = (dir === "RIGHT") ? 1 : -1;
        let newDirIdx = (this.direction + change);
        
        // Wrap around
        if (newDirIdx < 0) newDirIdx = 3;
        if (newDirIdx > 3) newDirIdx = 0;
        
        this.direction = newDirIdx;
        
        // Align mesh to center of tile momentarily? 
        // No, adds skill to turn at the right time.
    }
    
    die() {
        setGamePhase("GAME_OVER_LOSE");
        // Spawn death particles
        for (let i = 0; i < 20; i++) {
            const p = new Particle(this.mesh.position, gameState.palette.player);
            p.velocity.multiplyScalar(3);
            gameState.particles.push(p);
        }
        gameState.scene.remove(this.mesh);
    }
}

export class Platform {
    constructor(x, y, z, length, axis) {
        // axis: 'x' or 'z' determines orientation
        this.width = PLATFORM_WIDTH;
        this.height = PLATFORM_HEIGHT;
        this.length = length;
        
        let dimX, dimZ;
        if (axis === 'z') {
            dimX = this.width;
            dimZ = this.length;
        } else {
            dimX = this.length;
            dimZ = this.width;
        }
        
        const geometry = new THREE.BoxGeometry(dimX, this.height, dimZ);
        
        // Use different colors for top and sides using materials array
        const topMat = new THREE.MeshStandardMaterial({ color: gameState.palette.platformTop });
        const sideMat = new THREE.MeshStandardMaterial({ color: gameState.palette.platformSide });
        
        // Material Order: px, nx, py, ny, pz, nz
        // py is top, ny is bottom
        const materials = [
            sideMat, sideMat, // x
            topMat, sideMat,  // y
            sideMat, sideMat  // z
        ];
        
        this.mesh = new THREE.Mesh(geometry, materials);
        this.mesh.position.set(x, y, z);
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        
        gameState.scene.add(this.mesh);
        gameState.platforms.push(this);
    }
    
    remove() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        // Materials are shared, don't dispose them
    }
}

export class Collectible {
    constructor(x, y, z) {
        this.radius = 0.3;
        const geometry = new THREE.OctahedronGeometry(this.radius, 0);
        const material = new THREE.MeshPhongMaterial({ 
            color: gameState.palette.gem,
            emissive: 0x222222,
            shininess: 100
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y + 0.5, z);
        this.mesh.castShadow = true;
        
        this.initialY = y + 0.5;
        this.bobOffset = Math.random() * Math.PI * 2;
        
        gameState.scene.add(this.mesh);
        gameState.collectibles.push(this);
    }
    
    update(dt) {
        this.mesh.rotation.y += 0.05;
        this.mesh.position.y = this.initialY + Math.sin(gameState.frameCount * 0.1 + this.bobOffset) * 0.2;
    }
    
    collect() {
        gameState.score += 50;
        gameState.gemsCollected++;
        gameState.currentSpeed += SPEED_INCREMENT * 5; // Slight boost
        
        // Spawn particles
        for (let i = 0; i < 10; i++) {
            gameState.particles.push(new Particle(this.mesh.position, gameState.palette.gem));
        }
        
        this.remove();
    }
    
    remove() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        const idx = gameState.collectibles.indexOf(this);
        if (idx > -1) gameState.collectibles.splice(idx, 1);
    }
}

export class Particle {
    constructor(pos, color) {
        const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(pos);
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.2,
            Math.random() * 0.2 + 0.1,
            (Math.random() - 0.5) * 0.2
        );
        
        this.life = 1.0;
        this.decay = 0.02;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.life -= this.decay;
        this.mesh.position.add(this.velocity);
        this.velocity.y -= 0.01; // Gravity
        
        // Scale down
        this.mesh.scale.setScalar(this.life);
        
        if (this.life <= 0) {
            this.remove();
        }
    }
    
    remove() {
        gameState.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        const idx = gameState.particles.indexOf(this);
        if (idx > -1) gameState.particles.splice(idx, 1);
    }
}

function spawnDust(pos, count = 3) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(pos, 0xFFFFFF));
    }
}