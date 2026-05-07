import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, CAR_ACCELERATION, CAR_FRICTION, CAR_TURN_SPEED, CAR_MAX_SPEED, CAR_BRAKE_FORCE, CAR_REVERSE_SPEED } from './globals.js';

/**
 * Handles vehicle physics update
 * @param {Entity} car - The car entity
 * @param {Object} inputs - Input state
 * @param {Number} dt - Delta time
 */
export function updateCarPhysics(car, inputs, dt) {
    // Apply Gravity
    if (!car.onGround) {
        car.velocity.y += GRAVITY * dt;
    }

    // Calculate forward/backward forces
    const speed = car.forwardSpeed;
    let force = 0;

    if (inputs.up) {
        if (speed < CAR_MAX_SPEED) {
            force = CAR_ACCELERATION;
            if (inputs.boost && gameState.fuel > 0) {
                force *= 1.5;
                gameState.fuel -= dt * 5;
            }
        }
    } else if (inputs.down) {
        if (speed > -CAR_REVERSE_SPEED) {
            force = -CAR_BRAKE_FORCE; // Braking/Reverse is stronger
        }
    }

    // Apply Friction (Air resistance + Rolling resistance)
    car.forwardSpeed *= Math.pow(CAR_FRICTION, dt * 60);

    // Apply Engine Force
    car.forwardSpeed += force * dt;

    // Steering
    // Can only steer if moving
    if (Math.abs(car.forwardSpeed) > 0.1) {
        const turnDirection = inputs.left ? 1 : (inputs.right ? -1 : 0);
        
        // Reverse steering when going backwards for natural feel
        const reverseFactor = car.forwardSpeed < 0 ? -1 : 1;
        
        // Turning radius depends on speed (tighter at low speeds, wider at high)
        // But not 0 at 0 speed logic handled by if check above
        car.rotationAngle += turnDirection * CAR_TURN_SPEED * reverseFactor * dt;
    }

    // Update Mesh Rotation
    // Create a quaternion for Y-axis rotation
    const rotationQuat = new THREE.Quaternion();
    rotationQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), car.rotationAngle);
    car.mesh.quaternion.copy(rotationQuat);

    // Calculate Velocity Vector based on facing direction and speed
    const forwardDir = new THREE.Vector3(0, 0, -1);
    forwardDir.applyQuaternion(car.mesh.quaternion);
    
    // We update the X/Z components of the velocity vector
    // Y component is handled by gravity independently
    car.velocity.x = forwardDir.x * car.forwardSpeed;
    car.velocity.z = forwardDir.z * car.forwardSpeed;

    // Integrate Position
    car.mesh.position.add(car.velocity.clone().multiplyScalar(dt));

    // Handle collision with ground/terrain
    // For this simple game, terrain is flat at y=0
    if (car.mesh.position.y < 0.5) { // 0.5 is approx half wheel height
        car.mesh.position.y = 0.5;
        car.velocity.y = 0;
        car.onGround = true;
    } else {
        car.onGround = false;
    }

    // World Boundaries
    const limit = 1000; // Large bounds
    if (Math.abs(car.mesh.position.x) > limit || Math.abs(car.mesh.position.z) > limit) {
        // Reset if fell off world
        car.mesh.position.set(0, 2, 0);
        car.velocity.set(0,0,0);
        car.forwardSpeed = 0;
    }
}

/**
 * AABB Collision Detection for static obstacles
 */
export function checkCollisions(entity, obstacles) {
    const playerBox = new THREE.Box3().setFromObject(entity.mesh);
    
    // Shrink player box slightly to allow grazing
    playerBox.expandByScalar(-0.2);

    for (let obs of obstacles) {
        if (!obs.collider) {
            // Fix: Handle both wrapper entities (with .mesh) and direct Three.js objects (like trees)
            const mesh = obs.mesh || obs;
            
            // Validate it's a 3D object before creating box
            if (mesh && mesh.isObject3D) {
                obs.collider = new THREE.Box3().setFromObject(mesh);
            } else {
                continue;
            }
        }

        if (playerBox.intersectsBox(obs.collider)) {
            resolveCollision(entity, obs.collider);
        }
    }
}

function resolveCollision(entity, obstacleBox) {
    // Simple resolution: bounce back
    // Calculate center difference
    const entityCenter = new THREE.Vector3();
    const obsCenter = new THREE.Vector3();
    
    new THREE.Box3().setFromObject(entity.mesh).getCenter(entityCenter);
    obstacleBox.getCenter(obsCenter);
    
    const direction = new THREE.Vector3().subVectors(entityCenter, obsCenter).normalize();
    
    // Push out
    entity.mesh.position.add(direction.multiplyScalar(0.5));
    
    // Kill velocity (crash)
    entity.forwardSpeed *= -0.3; // Bounce slightly
    entity.velocity.multiplyScalar(-0.3);
    
    // Visual shake or damage could be triggered here
}