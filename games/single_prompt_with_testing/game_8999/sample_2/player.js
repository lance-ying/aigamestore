import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, PLAYER_SPEED, JUMP_FORCE, BLOCKS, WORLD_SIZE } from './globals.js';
import { checkCollision } from './physics.js';

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
        
        // Sync camera initially
        this.updateCamera();
    }
    
    update(deltaTime) {
        this.handleInput(deltaTime);
        this.applyPhysics(deltaTime);
        this.updateCamera();
        this.logInfo();
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