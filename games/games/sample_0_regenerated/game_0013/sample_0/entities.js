import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, MIN_HEIGHT, MAX_HEIGHT, BASE_VOLUME, SHAPE_CHANGE_SPEED, PLAYER_SPEED, GRAVITY, JUMP_FORCE } from './globals.js';
import { createJellyTexture, clamp } from './utils.js';

export class Player {
    constructor() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // Move pivot to bottom so scaling works upwards
        geometry.translate(0, 0.5, 0); 
        
        const texture = createJellyTexture();
        const material = new THREE.MeshPhysicalMaterial({ 
            map: texture,
            color: 0x00ffcc,
            metalness: 0.1,
            roughness: 0.2,
            transmission: 0.6, // Glass-like
            thickness: 1.0,
            transparent: true,
            opacity: 0.9
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        this.velocity = new THREE.Vector3(0, 0, PLAYER_SPEED);
        this.position = this.mesh.position;
        this.position.y = 0; // Starts with pivot at bottom, so y=0 is floor
        
        this.scale = new THREE.Vector3(1, 1, 1);
        this.targetScaleY = 1.0;
        this.isGrounded = true;
        
        gameState.scene.add(this.mesh);
    }

    update(dt) {
        // 1. Process Input for Velocity (X) and Scale (Y)
        const moveSpeed = 8.0;
        
        // Lateral movement
        if (gameState.input.left) this.velocity.x = -moveSpeed;
        else if (gameState.input.right) this.velocity.x = moveSpeed;
        else this.velocity.x = 0;

        // Shape Shifting
        if (gameState.input.up) {
            this.targetScaleY += SHAPE_CHANGE_SPEED * dt;
        } else if (gameState.input.down) {
            this.targetScaleY -= SHAPE_CHANGE_SPEED * dt;
        }
        
        // Jump
        if (gameState.input.jump && this.isGrounded) {
            this.velocity.y = JUMP_FORCE;
            this.isGrounded = false;
        }

        // Clamp scale target
        this.targetScaleY = clamp(this.targetScaleY, MIN_HEIGHT, MAX_HEIGHT);

        // Lerp actual scale
        this.scale.y += (this.targetScaleY - this.scale.y) * 10 * dt;
        
        // Maintain volume: width * height * depth(1) = BASE_VOLUME
        // width = BASE_VOLUME / height
        this.scale.x = BASE_VOLUME / this.scale.y;
        
        // Apply Scale
        this.mesh.scale.set(this.scale.x, this.scale.y, 1);

        // 2. Physics Movement
        // Apply Gravity
        this.velocity.y += GRAVITY * dt;
        
        // Move
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt; // Constant forward speed
        
        // Ground clamping is handled in physics.js but we ensure mesh matches here
        // The mesh pivot is at the bottom, so position.y is the bottom of the player
        
        // Log info for debug
        if (gameState.frameCount % 10 === 0 && window.logs.player_info) {
             window.logs.player_info.push({
                 x: this.position.x,
                 y: this.position.y,
                 z: this.position.z,
                 scaleX: this.scale.x,
                 scaleY: this.scale.y,
                 frame: gameState.frameCount
             });
        }
    }
}

export class Obstacle {
    constructor(z, type) {
        this.position = new THREE.Vector3(0, 0, z);
        this.mesh = new THREE.Group();
        this.mesh.position.copy(this.position);
        
        this.holeWidth = 10;
        this.holeHeight = 10;
        this.holeY = 0;
        
        this.createGeometry(type);
        
        gameState.scene.add(this.mesh);
    }
    
    createGeometry(type) {
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.8 });
        
        // Dimensions of the "World" cross section
        const wallThick = 1.0;
        const totalW = 20;
        const totalH = 8;
        
        if (type === 'GATE_NARROW') {
            // Requires tall thin shape
            this.holeWidth = 0.8;
            this.holeHeight = 4.0;
            
            // Left Wall
            const w1 = (totalW - this.holeWidth) / 2;
            const left = new THREE.Mesh(new THREE.BoxGeometry(w1, totalH, wallThick), mat);
            left.position.set(-(this.holeWidth/2 + w1/2), totalH/2, 0);
            left.castShadow = true;
            this.mesh.add(left);
            
            // Right Wall
            const right = new THREE.Mesh(new THREE.BoxGeometry(w1, totalH, wallThick), mat);
            right.position.set((this.holeWidth/2 + w1/2), totalH/2, 0);
            right.castShadow = true;
            this.mesh.add(right);
            
            // Top Lintel
            const top = new THREE.Mesh(new THREE.BoxGeometry(this.holeWidth, totalH - this.holeHeight, wallThick), mat);
            top.position.set(0, this.holeHeight + (totalH - this.holeHeight)/2, 0);
            top.castShadow = true;
            this.mesh.add(top);
            
        } else if (type === 'BARRIER_LOW') {
            // Requires short wide shape
            this.holeWidth = totalW; // Full width open
            this.holeHeight = 0.6;   // Very low
            
            // Top Barrier
            const h = totalH - this.holeHeight;
            const bar = new THREE.Mesh(new THREE.BoxGeometry(totalW, h, wallThick), mat);
            bar.position.set(0, this.holeHeight + h/2, 0);
            bar.castShadow = true;
            this.mesh.add(bar);
            
        } else if (type === 'SQUARE_HOLE') {
            this.holeWidth = 1.5;
            this.holeHeight = 1.5;
            this.holeY = 1.0; // Floating hole? No, usually ground based in this game. Let's keep it ground.
            
            // Left
            const w1 = (totalW - this.holeWidth) / 2;
            const left = new THREE.Mesh(new THREE.BoxGeometry(w1, totalH, wallThick), mat);
            left.position.set(-(this.holeWidth/2 + w1/2), totalH/2, 0);
            this.mesh.add(left);
            
            // Right
            const right = new THREE.Mesh(new THREE.BoxGeometry(w1, totalH, wallThick), mat);
            right.position.set((this.holeWidth/2 + w1/2), totalH/2, 0);
            this.mesh.add(right);
            
            // Top
            const hTop = totalH - this.holeHeight;
            const top = new THREE.Mesh(new THREE.BoxGeometry(this.holeWidth, hTop, wallThick), mat);
            top.position.set(0, this.holeHeight + hTop/2, 0);
            this.mesh.add(top);
        }
    }
}

export class Collectible {
    constructor(x, y, z) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffff00, 
            emissive: 0xffaa00,
            emissiveIntensity: 0.5 
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, y, z);
        
        this.value = 100;
        this.rotSpeed = 2.0;
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.mesh.rotation.y += this.rotSpeed * dt;
        this.mesh.rotation.x += this.rotSpeed * 0.5 * dt;
    }
}