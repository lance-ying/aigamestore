import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, PLAYER_SPEED, JUMP_FORCE, BLOCKS, WORLD_SIZE } from './globals.js';
import { checkCollision } from './physics.js';
import { textureManager } from './textures.js';

export class Player {
    constructor() {
        this.camera = gameState.camera;
        
        // Player State - spawn high enough to avoid being inside terrain
        this.position = new THREE.Vector3(WORLD_SIZE/2, 30, WORLD_SIZE/2);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.dimensions = new THREE.Vector3(0.6, 1.8, 0.6);
        this.grounded = false;
        
        // Look angles
        this.pitch = 0;
        this.yaw = 0;
        
        // Animation
        this.swinging = false;
        this.swingProgress = 0;

        // Sync camera initially
        this.updateCamera();
        this.setupHand();
    }
    
    setupHand() {
        // Container for hand visualization
        this.handGroup = new THREE.Group();
        this.handGroup.position.set(0.5, -0.5, -0.8);
        this.handGroup.rotation.set(0, 0, 0);
        this.camera.add(this.handGroup);

        // Generic Block Mesh
        const blockGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const blockMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        this.handMesh = new THREE.Mesh(blockGeo, blockMat);
        this.handMesh.castShadow = true;
        this.handGroup.add(this.handMesh);

        // Sword Mesh
        this.swordGroup = new THREE.Group();
        // Blade
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, 0.1),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        blade.position.y = 0.4;
        // Hilt
        const hilt = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.05, 0.1),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        hilt.position.y = 0.0;
        // Handle
        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.2, 0.08),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        handle.position.y = -0.125;
        
        this.swordGroup.add(blade);
        this.swordGroup.add(hilt);
        this.swordGroup.add(handle);
        this.swordGroup.visible = false;
        this.swordGroup.rotation.x = -Math.PI / 4; // Point forward
        this.handGroup.add(this.swordGroup);
    }

    update(deltaTime) {
        this.handleInput(deltaTime);
        this.applyPhysics(deltaTime);
        this.updateCamera();
        this.updateHand(deltaTime);
        this.logInfo();
    }

    triggerSwing() {
        if (!this.swinging) {
            this.swinging = true;
            this.swingProgress = 0;
        }
    }

    updateHand(deltaTime) {
        const toolIdx = gameState.selectedToolIndex;
        // 0-5: Blocks, 6: Remover, 7: Sword
        
        // Visibility logic
        if (toolIdx === 7) {
            this.handMesh.visible = false;
            this.swordGroup.visible = true;
        } else {
            this.handMesh.visible = true;
            this.swordGroup.visible = false;
            
            if (toolIdx === 6) {
                // Remover (Pickaxe stick representation)
                this.handMesh.geometry = new THREE.BoxGeometry(0.1, 0.1, 0.6);
                this.handMesh.material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            } else {
                // Block
                this.handMesh.geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
                this.handMesh.material = textureManager.getMaterial(toolIdx + 1);
            }
        }

        // Bobbing Animation (Walking)
        if (this.grounded && (this.velocity.x !== 0 || this.velocity.z !== 0)) {
            const bobSpeed = 10;
            const bobAmount = 0.05;
            this.handGroup.position.y = -0.5 + Math.sin(gameState.time * bobSpeed) * bobAmount;
            this.handGroup.position.x = 0.5 + Math.cos(gameState.time * bobSpeed) * bobAmount * 0.5;
        } else {
            // Return to rest
            this.handGroup.position.y += (-0.5 - this.handGroup.position.y) * deltaTime * 5;
            this.handGroup.position.x += (0.5 - this.handGroup.position.x) * deltaTime * 5;
        }

        // Swing Animation
        if (this.swinging) {
            this.swingProgress += deltaTime * 10; // Swing speed
            if (this.swingProgress >= Math.PI) {
                this.swinging = false;
                this.swingProgress = 0;
                this.handGroup.rotation.x = 0;
                this.handGroup.rotation.z = 0;
            } else {
                // Chop motion
                this.handGroup.rotation.x = Math.sin(this.swingProgress) * 1.5;
                this.handGroup.rotation.z = Math.sin(this.swingProgress) * 0.5;
            }
        } else {
             this.handGroup.rotation.x = 0;
             this.handGroup.rotation.z = 0;
        }
    }
    
    handleInput(deltaTime) {
        const keys = gameState.keys;
        
        // Rotation (Arrow Keys)
        const rotSpeed = 2.0 * deltaTime;
        if (keys[37]) this.yaw += rotSpeed; // Left
        if (keys[39]) this.yaw -= rotSpeed; // Right
        if (keys[38]) this.pitch = Math.min(Math.PI/2 - 0.1, this.pitch + rotSpeed); // Up
        if (keys[40]) this.pitch = Math.max(-Math.PI/2 + 0.1, this.pitch - rotSpeed); // Down
        
        // Movement (WASD)
        const moveSpeed = PLAYER_SPEED;
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        // Calculate intended velocity (horizontal)
        const moveVel = new THREE.Vector3(0, 0, 0);
        if (keys[87]) moveVel.add(forward); // W
        if (keys[83]) moveVel.sub(forward); // S
        if (keys[65]) moveVel.sub(right);   // A
        if (keys[68]) moveVel.add(right);   // D
        
        if (moveVel.length() > 0) moveVel.normalize().multiplyScalar(moveSpeed);
        
        // Apply to velocity (preserve Y)
        this.velocity.x = moveVel.x;
        this.velocity.z = moveVel.z;
        
        // Jump
        if (keys[32] && this.grounded) { // Space
            this.velocity.y = JUMP_FORCE;
            this.grounded = false;
        }
    }
    
    applyPhysics(deltaTime) {
        // Gravity
        this.velocity.y -= GRAVITY * deltaTime;
        
        // Terminal velocity
        this.velocity.y = Math.max(this.velocity.y, -30);

        // Collision detection and response
        const result = checkCollision(this.position, this.dimensions, this.velocity, deltaTime);
        this.grounded = result.grounded;
    }
    
    updateCamera() {
        // Position camera at eye level
        this.camera.position.copy(this.position);
        this.camera.position.y += this.dimensions.y * 0.9; // Eyes near top
        
        // Set rotation
        const lookTarget = new THREE.Vector3(0, 0, -1);
        lookTarget.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.pitch);
        lookTarget.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        this.camera.lookAt(this.camera.position.clone().add(lookTarget));
    }
    
    logInfo() {
        if(window.logs.player_info) {
             window.logs.player_info.push({
                 x: this.position.x,
                 y: this.position.y,
                 z: this.position.z,
                 yaw: this.yaw,
                 pitch: this.pitch,
                 frame: gameState.frameCount,
                 timestamp: Date.now()
             });
        }
    }
}