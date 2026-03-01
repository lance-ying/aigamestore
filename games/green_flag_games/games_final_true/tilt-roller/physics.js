import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONFIG } from './globals.js';
import { clamp, AABB } from './utils.js';
import { inputState } from './input.js';

export class PhysicsSystem {
    constructor() {
        this.gravity = new THREE.Vector3(0, -CONFIG.GRAVITY_STRENGTH, 0);
        this.tempVector = new THREE.Vector3();
    }

    update(deltaTime) {
        if (!gameState.player || !gameState.worldContainer) return;

        // 1. Update Stage Tilt based on Input
        this.updateTilt();

        // 2. Calculate Local Gravity Vector
        // If the stage is tilted +X (pitched down), gravity in local space points somewhat +Z.
        // We simulate the world rotating, but mathematically we keep the stage static 
        // and rotate the gravity vector opposite to the visual rotation.
        
        // Visual Rotation (Stage)
        const tiltX = gameState.currentTilt.x; // Pitch
        const tiltZ = gameState.currentTilt.y; // Roll (mapped to Z axis rotation visually)

        // Calculate Gravity in Local Space
        // Start with world down (0, -1, 0)
        // Apply inverse rotations
        const localGravity = new THREE.Vector3(0, -1, 0);
        localGravity.applyAxisAngle(new THREE.Vector3(1, 0, 0), -tiltX); // Counter-pitch
        localGravity.applyAxisAngle(new THREE.Vector3(0, 0, 1), -tiltZ); // Counter-roll
        
        localGravity.multiplyScalar(CONFIG.GRAVITY_STRENGTH);
        gameState.gravityVector.copy(localGravity);

        // 3. Integrate Player Physics
        this.integrateBall(deltaTime);
        
        // 4. Collision Detection
        this.handleCollisions();
        
        // 5. Check Triggers (Win/Loss)
        this.checkTriggers();
    }

    updateTilt() {
        const targetX = inputState.axis.y * CONFIG.MAX_TILT; // Up key = Negative Tilt (Forward)
        const targetZ = -inputState.axis.x * CONFIG.MAX_TILT; // Right key = Negative Z Tilt (Right down)
        
        // Interpolate current tilt towards target
        gameState.currentTilt.x += (targetX - gameState.currentTilt.x) * CONFIG.TILT_SPEED;
        gameState.currentTilt.y += (targetZ - gameState.currentTilt.y) * CONFIG.TILT_SPEED;
        
        // Apply to visual container
        gameState.worldContainer.rotation.x = gameState.currentTilt.x;
        gameState.worldContainer.rotation.z = gameState.currentTilt.y;
    }

    integrateBall(dt) {
        const player = gameState.player;
        
        // Apply Gravity
        player.velocity.add(gameState.gravityVector.clone().multiplyScalar(dt * 60)); // Scale for 60fps
        
        // Apply Brake (Friction)
        if (inputState.brake) {
            player.velocity.multiplyScalar(0.9);
        } else {
            // Natural rolling friction (Increased friction from 0.99 to 0.98)
            player.velocity.multiplyScalar(0.98);
        }
        
        // Update Position
        player.position.add(player.velocity.clone().multiplyScalar(dt * 60));
        
        // Update Mesh Position
        player.mesh.position.copy(player.position);
        
        // Update Ball Rotation (Visual Rolling)
        // Rotate around axis perpendicular to velocity
        const speed = player.velocity.length();
        if (speed > 0.01) {
            const axis = new THREE.Vector3()
                .crossVectors(new THREE.Vector3(0, 1, 0), player.velocity)
                .normalize();
            
            // Circumference = 2 * PI * r
            // Angle = Distance / Radius
            const angle = speed / CONFIG.BALL_RADIUS;
            
            const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            player.mesh.quaternion.multiplyQuaternions(q, player.mesh.quaternion);
        }
    }

    handleCollisions() {
        const player = gameState.player;
        const spherePos = player.position;
        const radius = CONFIG.BALL_RADIUS;
        
        // Reset ground flag
        player.onGround = false;

        // Check against all level objects
        for (const obj of gameState.levelObjects) {
            if (obj.type === 'BOX') {
                this.resolveSphereBox(player, obj);
            }
        }
    }

    resolveSphereBox(player, box) {
        // Get box AABB
        const boxAABB = box.aabb;
        
        // Find closest point on box to sphere center
        const closest = boxAABB.closestPointToPoint(player.position);
        
        // Distance
        const distance = player.position.distanceTo(closest);
        
        if (distance < CONFIG.BALL_RADIUS) {
            // Collision detected
            
            // Calculate normal
            const normal = new THREE.Vector3()
                .subVectors(player.position, closest)
                .normalize();
            
            // If sphere is exactly inside, normal might be zero, handle edge case
            if (normal.lengthSq() < 0.001) {
                normal.set(0, 1, 0); // Push up by default
            }

            // Penetration depth
            const penetration = CONFIG.BALL_RADIUS - distance;
            
            // Position Correction
            player.position.add(normal.clone().multiplyScalar(penetration));
            
            // Velocity Correction (Bounce + Slide)
            const velocityDot = player.velocity.dot(normal);
            
            if (velocityDot < 0) {
                // Remove velocity component along normal (Slide)
                const restitution = 0.3; // Bounciness
                const j = -(1 + restitution) * velocityDot;
                
                const impulse = normal.multiplyScalar(j);
                player.velocity.add(impulse);
                
                // If normal is roughly up, we are on ground
                if (normal.y > 0.7) {
                    player.onGround = true;
                }
            }
        }
    }

    checkTriggers() {
        const player = gameState.player;
        
        // 1. Loss Condition: Fallen too far down
        if (player.position.y < -20) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
        
        // 2. Win Condition: Reached Goal
        if (gameState.goal) {
            const distToGoal = new THREE.Vector2(player.position.x, player.position.z)
                .distanceTo(new THREE.Vector2(gameState.goal.position.x, gameState.goal.position.z));
                
            if (distToGoal < (gameState.goal.radius + CONFIG.BALL_RADIUS)) {
                // Ensure we are somewhat vertically aligned too
                if (Math.abs(player.position.y - gameState.goal.position.y) < 2.0) {
                    if (gameState.gamePhase === "PLAYING") {
                        gameState.score += 1000;
                        gameState.gamePhase = "GAME_OVER_WIN";
                    }
                }
            }
        }
    }
}