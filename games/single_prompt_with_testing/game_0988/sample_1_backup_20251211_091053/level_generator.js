import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, DIRECTION, PLATFORM_WIDTH } from './globals.js';
import { Platform, Collectible } from './entities.js';

// Random generator instance
let rng = new Math.seedrandom('twist_game_seed');

export function initLevel() {
    rng = new Math.seedrandom('twist_game_seed'); // Reset seed on restart
    gameState.platformsSpawned = 0;
    gameState.lastPlatformPos.set(0, 0, 0);
    gameState.currentDirection = DIRECTION.NORTH; // Start heading -Z
    
    // Create starting platform - long safety runway
    createPlatform(15, DIRECTION.NORTH); 
    
    // Generate initial buffer
    for(let i=0; i<5; i++) {
        generateNextSegment();
    }
}

export function updateLevelGenerator() {
    // Check distance of player to end of generated path
    // If player gets close to the "last" generated point, generate more
    // We can use the platform count or distance
    
    // Simple heuristic: Ensure we have at least 10 platforms ahead
    // Since we remove old ones, we can just check array length? No, array length includes behind.
    // Let's track the position.
    
    if (gameState.player) {
        const distToLast = gameState.player.mesh.position.distanceTo(gameState.lastPlatformPos);
        if (distToLast < 40) { // If closer than 40 units to the edge
            generateNextSegment();
        }
        
        // Cleanup old platforms
        cleanupPlatforms();
    }
}

function generateNextSegment() {
    // Decide type: Straight, Left Turn, Right Turn, or Gap
    // Gaps only happen after a straight usually
    
    const r = rng();
    const length = 4 + Math.floor(rng() * 6); // Random length 4-10
    
    // Difficulty scaling: As score/platforms increases, more turns, more gaps
    const difficulty = Math.min(gameState.platformsSpawned / 50, 0.8);
    
    let nextDir = gameState.currentDirection;
    let isGap = false;
    
    // Decide if we turn
    // Can only turn 90 degrees (Left or Right relative to current)
    // Avoid turning back (U-turn) immediately? The logic handles 90 deg turns naturally.
    
    if (r < 0.2 + (difficulty * 0.3)) {
        // Turn Left
        nextDir = turnDir(gameState.currentDirection, "LEFT");
    } else if (r < 0.4 + (difficulty * 0.6)) {
        // Turn Right
        nextDir = turnDir(gameState.currentDirection, "RIGHT");
    } else {
        // Go Straight
        // Chance for gap
        if (r > 0.8 - (difficulty * 0.2)) {
            isGap = true;
        }
    }
    
    // Logic for placing the platform based on NextDir
    // If turning, the new platform starts at the end of the previous one, growing in new direction
    
    // Actually, "Twist" logic:
    // Platforms usually connect corner-to-corner or overlap slightly.
    
    if (isGap) {
        // Move the "cursor" forward without placing a block
        moveCursor(2 + rng() * 2, nextDir); // Gap size
    }
    
    createPlatform(length, nextDir);
    gameState.currentDirection = nextDir;
    
    // Maybe spawn gem
    if (rng() < 0.3) {
        spawnGemOnPlatform(gameState.platforms[gameState.platforms.length-1]);
    }
    
    gameState.platformsSpawned++;
}

function createPlatform(length, direction) {
    const pos = gameState.lastPlatformPos.clone();
    
    // We need to calculate the center position of the box
    // The `pos` tracks the END of the previous platform (roughly)
    // Actually, let's track the joint.
    
    // Offset center based on direction and length
    let centerX = pos.x;
    let centerZ = pos.z;
    let axis = 'z';
    
    const halfLen = length / 2;
    const halfWidth = PLATFORM_WIDTH / 2;
    
    // Adjust start point so we don't overlap previous too much or gap
    // We want the START of this platform to be at `pos`
    
    if (direction === DIRECTION.NORTH) { // -Z
        centerZ -= halfLen;
        axis = 'z';
        // Update cursor to end
        gameState.lastPlatformPos.z -= length;
    } else if (direction === DIRECTION.SOUTH) { // +Z
        centerZ += halfLen;
        axis = 'z';
        gameState.lastPlatformPos.z += length;
    } else if (direction === DIRECTION.EAST) { // +X
        centerX += halfLen;
        axis = 'x';
        gameState.lastPlatformPos.x += length;
    } else if (direction === DIRECTION.WEST) { // -X
        centerX -= halfLen;
        axis = 'x';
        gameState.lastPlatformPos.x -= length;
    }
    
    // Fix corners overlap for visuals:
    // Simple boxes overlap poorly at corners. 
    // Ideally we spawn a "Joint" cube at turns, but for this constraint, overlapping is acceptable.
    
    new Platform(centerX, 0, centerZ, length, axis);
}

function moveCursor(amount, direction) {
    if (direction === DIRECTION.NORTH) gameState.lastPlatformPos.z -= amount;
    if (direction === DIRECTION.SOUTH) gameState.lastPlatformPos.z += amount;
    if (direction === DIRECTION.EAST)  gameState.lastPlatformPos.x += amount;
    if (direction === DIRECTION.WEST)  gameState.lastPlatformPos.x -= amount;
}

function turnDir(current, turn) {
    // turn is "LEFT" or "RIGHT"
    // N=0, E=1, S=2, W=3
    // Left: N->W (0->3), W->S (3->2) => -1
    // Right: N->E (0->1) => +1
    let change = (turn === "RIGHT") ? 1 : -1;
    let next = current + change;
    if (next < 0) next = 3;
    if (next > 3) next = 0;
    return next;
}

function spawnGemOnPlatform(platform) {
    const pPos = platform.mesh.position;
    // Spawn somewhat centered, maybe raised
    new Collectible(pPos.x, pPos.y + 0.5, pPos.z);
}

function cleanupPlatforms() {
    if (!gameState.player) return;
    
    // Remove platforms far behind
    // "Behind" is tricky with turns. Use simple distance.
    const cleanupDist = 30;
    
    for (let i = gameState.platforms.length - 1; i >= 0; i--) {
        const p = gameState.platforms[i];
        if (p.mesh.position.distanceTo(gameState.player.mesh.position) > cleanupDist) {
            // Only remove if it's "behind" in time?
            // Distance is safe enough for a fog based runner
            p.remove();
            gameState.platforms.splice(i, 1);
        }
    }
}