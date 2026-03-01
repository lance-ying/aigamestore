import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY, TERMINAL_VELOCITY } from './globals.js';

export class AABB {
    constructor(position, width, height, depth) {
        this.position = position; // Center position
        this.halfSize = new THREE.Vector3(width/2, height/2, depth/2);
    }

    intersects(other) {
        return (
            Math.abs(this.position.x - other.position.x) < (this.halfSize.x + other.halfSize.x) &&
            Math.abs(this.position.y - other.position.y) < (this.halfSize.y + other.halfSize.y) &&
            Math.abs(this.position.z - other.position.z) < (this.halfSize.z + other.halfSize.z)
        );
    }
    
    // Returns the overlap vector to push 'this' out of 'other'
    getOverlap(other) {
        const dx = this.position.x - other.position.x;
        const dy = this.position.y - other.position.y;
        const dz = this.position.z - other.position.z;
        
        const ox = (this.halfSize.x + other.halfSize.x) - Math.abs(dx);
        const oy = (this.halfSize.y + other.halfSize.y) - Math.abs(dy);
        const oz = (this.halfSize.z + other.halfSize.z) - Math.abs(dz);
        
        return { x: ox, y: oy, z: oz, dx, dy, dz };
    }
}

export function updatePhysicsEntity(entity, deltaTime, walls) {
    if (entity.isStatic) return;

    // Gravity
    if (!entity.onGround) {
        entity.velocity.y += GRAVITY;
        if (entity.velocity.y < TERMINAL_VELOCITY) entity.velocity.y = TERMINAL_VELOCITY;
    }

    // Apply Velocity
    // We do axis-independent collision checking for better sliding
    
    // X Axis
    entity.mesh.position.x += entity.velocity.x * deltaTime;
    let collision = checkWallCollisions(entity, walls);
    if (collision) {
        if (collision.dx > 0) entity.mesh.position.x += collision.overlap.x;
        else entity.mesh.position.x -= collision.overlap.x;
        entity.velocity.x = 0;
    }

    // Z Axis
    entity.mesh.position.z += entity.velocity.z * deltaTime;
    collision = checkWallCollisions(entity, walls);
    if (collision) {
        if (collision.dz > 0) entity.mesh.position.z += collision.overlap.z;
        else entity.mesh.position.z -= collision.overlap.z;
        entity.velocity.z = 0;
    }

    // Y Axis
    entity.mesh.position.y += entity.velocity.y * deltaTime;
    entity.onGround = false;
    collision = checkWallCollisions(entity, walls);
    if (collision) {
        if (collision.dy > 0) { // Hitting ceiling
            entity.mesh.position.y += collision.overlap.y;
            entity.velocity.y = 0;
        } else { // Hitting floor
            entity.mesh.position.y -= collision.overlap.y;
            entity.velocity.y = 0;
            entity.onGround = true;
        }
    }
    
    // Ground plane check (fallback)
    if (entity.mesh.position.y - entity.height/2 < 0) {
        entity.mesh.position.y = entity.height/2;
        entity.velocity.y = 0;
        entity.onGround = true;
    }
    
    // Friction
    if (entity.onGround) {
        entity.velocity.x *= 0.85; // Ground friction
        entity.velocity.z *= 0.85;
    } else {
        entity.velocity.x *= 0.95; // Air resistance
        entity.velocity.z *= 0.95;
    }
}

function checkWallCollisions(entity, walls) {
    const entityBox = new AABB(entity.mesh.position, entity.width, entity.height, entity.depth);
    
    for (const wall of walls) {
        const wallBox = new AABB(wall.mesh.position, wall.width, wall.height, wall.depth);
        if (entityBox.intersects(wallBox)) {
            const overlap = entityBox.getOverlap(wallBox);
            
            // Find minimum overlap dimension
            let minOverlap = overlap.x;
            let axis = 'x';
            if (overlap.y < minOverlap) { minOverlap = overlap.y; axis = 'y'; }
            if (overlap.z < minOverlap) { minOverlap = overlap.z; axis = 'z'; }
            
            // Only return collision for the shallowest penetration
            // This is a simplification; for axis-separate movement we just need the overlap for that axis
            // But here we are calling this function AFTER moving on one axis.
            // So the smallest overlap should logically be the axis we just moved on, 
            // unless we are deep inside (which shouldn't happen with small timesteps).
            
            return {
                overlap: overlap,
                dx: overlap.dx,
                dy: overlap.dy,
                dz: overlap.dz,
                axis: axis
            };
        }
    }
    return null;
}

export function raycast(origin, direction, objects, maxDist = 100) {
    const raycaster = new THREE.Raycaster(origin, direction.normalize(), 0, maxDist);
    const intersects = raycaster.intersectObjects(objects.map(o => o.mesh));
    if (intersects.length > 0) {
        return intersects[0];
    }
    return null;
}