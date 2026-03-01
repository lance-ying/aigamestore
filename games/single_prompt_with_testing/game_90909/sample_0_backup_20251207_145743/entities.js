import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_WIDTH, GRAVITY, JUMP_FORCE, TILE_SIZE } from './globals.js';
import { createWoodTexture } from './utils.js';

export class Player {
    constructor() {
        // Player Group
        this.mesh = new THREE.Group();
        
        // Body
        const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green shirt
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 1.2;
        this.mesh.add(this.body);
        
        // Head
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Skin
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 2.1;
        this.mesh.add(this.head);
        
        // Legs (visual only for running animation)
        const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.3);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x000088 }); // Blue pants
        this.legL = new THREE.Mesh(legGeo, legMat);
        this.legR = new THREE.Mesh(legGeo, legMat);
        this.legL.position.set(-0.2, 0.4, 0);
        this.legR.position.set(0.2, 0.4, 0);
        this.mesh.add(this.legL);
        this.mesh.add(this.legR);

        this.mesh.castShadow = true;
        
        // Physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.direction = new THREE.Vector3(0, 0, -1); // Facing -Z initially
        this.currentLane = 0; // -1, 0, 1
        this.isJumping = false;
        this.isSliding = false;
        this.slideTimer = 0;
        
        // Bounds for collision
        this.collider = new THREE.Box3();
        
        gameState.scene.add(this.mesh);
    }

    update(dt) {
        // Run Animation
        const runSpeed = 15;
        this.legL.rotation.x = Math.sin(gameState.frameCount * 0.2) * 0.5;
        this.legR.rotation.x = Math.cos(gameState.frameCount * 0.2) * 0.5;
        
        // Gravity
        if (this.mesh.position.y > 0) {
            this.velocity.y += GRAVITY * dt;
        } else if (this.mesh.position.y <= 0 && !this.isDead) {
            // Ground collision
            this.mesh.position.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }

        // Apply Velocity
        this.mesh.position.y += this.velocity.y * dt;
        
        // Move forward constantly based on direction
        const moveStep = this.direction.clone().multiplyScalar(gameState.speed * dt);
        this.mesh.position.add(moveStep);
        
        // Lane Smoothing
        // Calculate target position based on lane and direction
        // If direction is (0,0,-1) [North], lanes are X: -2.5, 0, 2.5
        // If direction is (-1,0,0) [West], lanes are Z: -2.5, 0, 2.5
        // This requires knowing current "Track Axis"
        
        // Simplified: The PathManager handles the "Logic" of where lanes are.
        // The player just lerps local X/Z relative to the path center.
        // We will handle lateral movement in 'handleInput' by shifting position perpendicular to direction.
        
        // Update Collider
        this.collider.setFromObject(this.mesh);
        // Shrink collider slightly for fair play
        this.collider.min.addScalar(0.2);
        this.collider.max.subScalar(0.2);
        
        // Handle Slide
        if (this.isSliding) {
            this.slideTimer -= dt;
            if (this.slideTimer <= 0) {
                this.endSlide();
            }
        }
        
        // Check falling death
        if (this.mesh.position.y < -5) {
            this.die();
        }
    }
    
    jump() {
        if (!this.isJumping && !this.isSliding) {
            this.velocity.y = JUMP_FORCE;
            this.isJumping = true;
        }
    }
    
    slide() {
        if (!this.isSliding && !this.isJumping) {
            this.isSliding = true;
            this.slideTimer = 1.0; // 1 second slide
            
            // Squash mesh
            this.mesh.scale.set(1, 0.5, 1);
            this.mesh.position.y -= 0.5; // Adjust pivot
        }
    }
    
    endSlide() {
        this.isSliding = false;
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.y += 0.0; // Physics loop will fix Y
    }
    
    moveLane(dir) { // -1 (left) or 1 (right)
        // Calculate right vector relative to current direction
        const right = new THREE.Vector3(0, 1, 0).cross(this.direction).normalize();
        const moveAmount = LANE_WIDTH * dir;
        this.mesh.position.add(right.multiplyScalar(moveAmount));
        
        // Clamp logic should be handled by checking path bounds?
        // For now, allow free movement, punish falling off.
    }
    
    turn(dir) { // -1 (left) or 1 (right)
        // Rotate direction vector 90 degrees
        const axis = new THREE.Vector3(0, 1, 0);
        this.direction.applyAxisAngle(axis, -Math.PI / 2 * dir);
        this.mesh.rotateY(-Math.PI / 2 * dir);
        
        // Snap to nearest 90 deg to avoid drift
        // round direction components
        this.direction.x = Math.round(this.direction.x);
        this.direction.z = Math.round(this.direction.z);
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        this.isDead = true;
    }
}

export class Coin {
    constructor(x, y, z) {
        const geo = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xffd700, 
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            metalness: 1.0,
            roughness: 0.3
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(x, y, z);
        this.active = true;
        this.collider = new THREE.Box3();
        
        gameState.scene.add(this.mesh);
    }
    
    update(dt) {
        this.mesh.rotation.y += 3 * dt;
        this.collider.setFromObject(this.mesh);
    }
    
    collect() {
        this.active = false;
        this.mesh.visible = false;
        gameState.scene.remove(this.mesh);
    }
}

export class Obstacle {
    constructor(x, y, z, type) {
        // type: "LOG" (jump), "BEAM" (slide), "WALL" (block)
        this.type = type;
        this.mesh = new THREE.Group();
        this.position = new THREE.Vector3(x, y, z);
        
        let geo, mat;
        
        if (type === "LOG") {
            geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
            mat = new THREE.MeshStandardMaterial({ map: createWoodTexture() });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.z = Math.PI / 2;
            mesh.position.y = 0.3;
            this.mesh.add(mesh);
            this.damageBox = new THREE.Box3().setFromObject(mesh);
        } else if (type === "BEAM") {
            // High beam, pass under
            geo = new THREE.BoxGeometry(4, 0.5, 0.5);
            mat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 2.0;
            
            // Posts
            const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            const postL = new THREE.Mesh(postGeo, mat);
            postL.position.set(-1.8, 1, 0);
            const postR = new THREE.Mesh(postGeo, mat);
            postR.position.set(1.8, 1, 0);
            
            this.mesh.add(mesh);
            this.mesh.add(postL);
            this.mesh.add(postR);
        } else {
            // WALL or FIRE
            geo = new THREE.BoxGeometry(4, 1, 1);
            mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.y = 0.5;
            this.mesh.add(mesh);
        }
        
        this.mesh.position.set(x, y, z);
        gameState.scene.add(this.mesh);
        
        this.active = true;
        this.collider = new THREE.Box3();
    }
    
    update() {
        // Orient obstacle to be perpendicular to path?
        // For simplicity, obstacles are spawned already rotated by PathManager
        this.collider.setFromObject(this.mesh);
        // Shrink collider slightly
        this.collider.min.addScalar(0.1);
        this.collider.max.subScalar(0.1);
    }
}