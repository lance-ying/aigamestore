import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, BLOCKS } from './globals.js';

// Simple AABB physics
export class AABB {
    constructor(min, max) {
        this.min = min; // Vector3
        this.max = max; // Vector3
    }

    intersects(other) {
        return (
            this.min.x <= other.max.x && this.max.x >= other.min.x &&
            this.min.y <= other.max.y && this.max.y >= other.min.y &&
            this.min.z <= other.max.z && this.max.z >= other.min.z
        );
    }
}

export function checkCollision(position, dimensions, velocity, deltaTime) {
    const world = gameState.voxelWorld;
    if (!world) return { grounded: false };

    // Player bounds
    const playerWidth = dimensions.x;
    const playerHeight = dimensions.y;
    const playerDepth = dimensions.z;

    // Separate axes for collision resolution
    
    // X Axis
    let nextX = position.x + velocity.x * deltaTime;
    if (world.checkIntersection(
        nextX - playerWidth/2, position.y, position.z - playerDepth/2, 
        playerWidth, playerHeight, playerDepth
    )) {
        velocity.x = 0;
    } else {
        position.x = nextX;
    }

    // Z Axis
    let nextZ = position.z + velocity.z * deltaTime;
    if (world.checkIntersection(
        position.x - playerWidth/2, position.y, nextZ - playerDepth/2,
        playerWidth, playerHeight, playerDepth
    )) {
        velocity.z = 0;
    } else {
        position.z = nextZ;
    }

    // Y Axis
    let grounded = false;
    let nextY = position.y + velocity.y * deltaTime;
    
    // Check ceiling/floor
    if (world.checkIntersection(
        position.x - playerWidth/2, nextY, position.z - playerDepth/2,
        playerWidth, playerHeight, playerDepth
    )) {
        if (velocity.y < 0) { // Falling
             // Snap to top of block
             position.y = Math.ceil(nextY) - (nextY % 1); 
             grounded = true;
        } else if (velocity.y > 0) { // Jumping into ceiling
             position.y = Math.floor(nextY + playerHeight) - playerHeight;
        }
        velocity.y = 0;
    } else {
        position.y = nextY;
    }

    return { grounded };
}

// Raycasting for Voxel Grid (DDA Algorithm for precision)
export function raycastVoxels(start, direction, range) {
    const world = gameState.voxelWorld;
    if (!world) return null;

    let x = Math.floor(start.x);
    let y = Math.floor(start.y);
    let z = Math.floor(start.z);

    const stepX = Math.sign(direction.x);
    const stepY = Math.sign(direction.y);
    const stepZ = Math.sign(direction.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

    let tMaxX = stepX > 0 ? (Math.floor(x) + 1 - start.x) * tDeltaX : (start.x - Math.floor(x)) * tDeltaX;
    let tMaxY = stepY > 0 ? (Math.floor(y) + 1 - start.y) * tDeltaY : (start.y - Math.floor(y)) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (Math.floor(z) + 1 - start.z) * tDeltaZ : (start.z - Math.floor(z)) * tDeltaZ;
    
    // Avoid small initial values causing issues
    if(Number.isNaN(tMaxX)) tMaxX = Infinity;
    if(Number.isNaN(tMaxY)) tMaxY = Infinity;
    if(Number.isNaN(tMaxZ)) tMaxZ = Infinity;

    let hit = null;
    let dist = 0;
    let lastFace = null; // Normal of the face entered

    while (dist < range) {
        // Check current voxel
        const block = world.getBlock(x, y, z);
        if (block && block !== BLOCKS.AIR) {
            hit = { x, y, z, face: lastFace };
            break;
        }

        // Move to next voxel
        if (tMaxX < tMaxY) {
            if (tMaxX < tMaxZ) {
                x += stepX;
                dist = tMaxX;
                tMaxX += tDeltaX;
                lastFace = new THREE.Vector3(-stepX, 0, 0);
            } else {
                z += stepZ;
                dist = tMaxZ;
                tMaxZ += tDeltaZ;
                lastFace = new THREE.Vector3(0, 0, -stepZ);
            }
        } else {
            if (tMaxY < tMaxZ) {
                y += stepY;
                dist = tMaxY;
                tMaxY += tDeltaY;
                lastFace = new THREE.Vector3(0, -stepY, 0);
            } else {
                z += stepZ;
                dist = tMaxZ;
                tMaxZ += tDeltaZ;
                lastFace = new THREE.Vector3(0, 0, -stepZ);
            }
        }
    }

    return hit;
}