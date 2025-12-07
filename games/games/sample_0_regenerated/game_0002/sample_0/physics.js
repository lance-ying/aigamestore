import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GRAVITY } from './globals.js';

export function checkIntersection(box1, box2) {
    return (
        box1.min.x <= box2.max.x && box1.max.x >= box2.min.x &&
        box1.min.y <= box2.max.y && box1.max.y >= box2.min.y &&
        box1.min.z <= box2.max.z && box1.max.z >= box2.min.z
    );
}

export function updatePhysics(deltaTime) {
    if (!gameState.player) return;

    // Apply Gravity to Player
    if (!gameState.player.onGround) {
        gameState.player.velocity.y += GRAVITY;
    }

    // Move Player Vertically
    gameState.player.mesh.position.y += gameState.player.velocity.y;

    // Ground Collision
    // Simple ground plane at y=0, but we need to account for gaps
    // Check if player is over a gap in the path
    const playerZ = gameState.player.mesh.position.z;
    
    // Find current segment
    // Since segments are generated continuously, we check if there is a floor under player
    let hasFloor = false;
    for (const seg of gameState.pathSegments) {
        if (playerZ <= seg.zStart && playerZ >= seg.zEnd) {
             if (seg.type !== 'gap') {
                 hasFloor = true;
             }
             break;
        }
    }

    // Ground level is 0
    if (hasFloor) {
        if (gameState.player.mesh.position.y <= 0) {
            gameState.player.mesh.position.y = 0;
            gameState.player.velocity.y = 0;
            gameState.player.onGround = true;
            gameState.player.isJumping = false;
        }
    } else {
        // Falling into pit
        gameState.player.onGround = false;
    }

    // Death by falling
    if (gameState.player.mesh.position.y < -10) {
        gameState.player.die();
    }
}

export function handleCollisions() {
    if (!gameState.player || gameState.gamePhase !== 'PLAYING') return;

    const playerBox = new THREE.Box3().setFromObject(gameState.player.mesh);
    // Shrink player box slightly for fairer gameplay
    playerBox.expandByScalar(-0.2);

    // Obstacles
    for (const obstacle of gameState.obstacles) {
        const obsBox = new THREE.Box3().setFromObject(obstacle.mesh);
        if (playerBox.intersectsBox(obsBox)) {
            gameState.player.die();
            return;
        }
    }

    // Collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const coin = gameState.collectibles[i];
        const coinBox = new THREE.Box3().setFromObject(coin.mesh);
        if (playerBox.intersectsBox(coinBox)) {
            coin.collect();
            gameState.collectibles.splice(i, 1);
        }
    }
}