import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { boxIntersectsBox } from './utils.js';

export function handleCollisions() {
    if (!gameState.player) return;

    const player = gameState.player;
    
    // Create player bounding box
    // Adjust size based on state (sliding = smaller/lower box)
    const pPos = player.mesh.position;
    const pSize = player.isSliding ? new THREE.Vector3(0.5, 0.5, 0.5) : new THREE.Vector3(0.6, 1.5, 0.6);
    const pCenterY = player.isSliding ? 0.25 : 0.75;
    
    const playerBox = new THREE.Box3();
    playerBox.setFromCenterAndSize(
        new THREE.Vector3(pPos.x, pPos.y + pCenterY, pPos.z),
        pSize
    );

    // Check Obstacles
    for (const obs of gameState.obstacles) {
        if (playerBox.intersectsBox(obs.collisionBox)) {
            resolveObstacleCollision(player, obs);
            if (gameState.gamePhase !== 'PLAYING') return; // Exit if dead
        }
    }
}

function resolveObstacleCollision(player, obstacle) {
    // "Close call" detection could go here
    
    // Simple logic: hit = die, unless specific condition matches
    let survived = false;

    if (obstacle.type === 'WALL') {
        // Must jump over
        // If player bottom > obstacle top, we are fine (handled by AABB usually, but 3D physics requires Y check)
        // Since we use AABB intersection, if we are intersecting, we hit it.
        // So we just die unless we are purely above it? 
        // No, if AABB intersects, we hit. 
        // We need to check if player "cleared" it before intersection frame?
        // Actually, if we are mid-jump, our Y is high. If Y is high enough, boxes won't intersect.
        // So intersection means failure.
        survived = false;
    } else if (obstacle.type === 'BEAM') {
        // Must slide under
        if (player.isSliding) {
            // Sliding lowers the hitbox. If boxes still intersect, it implies the beam is too low or player box too high.
            // My Obstacle BEAM bounds start at Y=1.2. Player sliding height max is 0.5. They shouldn't intersect.
            // If they intersect, the player wasn't sliding (height 1.5).
            survived = false;
        }
    } else if (obstacle.type === 'PIT') {
        // Pit is on the floor (Y ~ 0). If player Y > 0 (jumping), no intersection with floor box?
        // My pit box is Y: -1 to 0.1.
        // If jumping, player Y > 0. If grounded, Y=0.
        survived = false;
    }

    if (!survived) {
        // Stumble mechanic?
        // If hit wall side, maybe stumble. If pit, die.
        if (obstacle.type === 'PIT') {
            player.die();
        } else {
            // Hit a solid object
            player.die();
            // TODO: Implement stumble for grazing hits in v2
        }
    }
}