import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_CONSTANTS, logGameInfo } from './globals.js';
import { checkSphereCollision, checkSphereBoxCollision } from './utils.js';
import { ParticleSystem } from './entities.js';

export function updatePhysics(dt) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const player = gameState.player;
    if (!player) return;

    // Check Obstacle Collisions
    // We iterate backwards to allow safe removal
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        
        // Simple optimization: only check if close enough in Z
        if (Math.abs(player.mesh.position.z - obs.mesh.position.z) < 2.0) {
            if (checkSphereCollision(player.mesh.position, GAME_CONSTANTS.PLAYER_RADIUS, obs.mesh.position, GAME_CONSTANTS.BALL_RADIUS)) {
                handleBallCollision(obs);
            }
        }
        
        // Cull objects behind player
        if (obs.mesh.position.z > player.mesh.position.z + 10) {
            obs.dispose();
            gameState.obstacles.splice(i, 1);
        }
    }
    
    // Check Ramp Collisions
    for (let i = gameState.ramps.length - 1; i >= 0; i--) {
        const ramp = gameState.ramps[i];
        
        // Z distance check
        if (Math.abs(player.mesh.position.z - ramp.mesh.position.z) < GAME_CONSTANTS.RAMP_LENGTH + 2) {
            // Use box check for ramp
            // Note: Ramps are positioned at their 'front', extending -Z.
            const rampCenterZ = ramp.mesh.position.z - GAME_CONSTANTS.RAMP_LENGTH / 2;
            const rampPos = new THREE.Vector3(ramp.mesh.position.x, GAME_CONSTANTS.RAMP_HEIGHT/2, rampCenterZ);
            const rampSize = new THREE.Vector3(GAME_CONSTANTS.LANE_WIDTH * 0.9, GAME_CONSTANTS.RAMP_HEIGHT, GAME_CONSTANTS.RAMP_LENGTH);
            
            if (checkSphereBoxCollision(player.mesh.position, GAME_CONSTANTS.PLAYER_RADIUS, rampPos, rampSize)) {
                handleRampCollision(ramp);
            }
        }
        
        if (ramp.mesh.position.z > player.mesh.position.z + 10) {
            ramp.dispose();
            gameState.ramps.splice(i, 1);
        }
    }
}

function handleBallCollision(obstacle) {
    if (obstacle.colorName === gameState.player.colorName) {
        // MATCH!
        gameState.score += 10;
        gameState.speed += 0.2; // Slight speed up
        new ParticleSystem(obstacle.mesh.position, obstacle.mesh.material.color);
        obstacle.dispose();
        
        // Remove from array
        const idx = gameState.obstacles.indexOf(obstacle);
        if (idx > -1) gameState.obstacles.splice(idx, 1);
        
        logGameInfo("COLLECTED_BALL", { color: obstacle.colorName, score: gameState.score });
    } else {
        // CRASH!
        gameOver("CRASH_WRONG_COLOR");
    }
}

function handleRampCollision(ramp) {
    // Only trigger if we aren't already jumping high or processed this ramp
    if (gameState.player.mesh.position.y < GAME_CONSTANTS.RAMP_HEIGHT + 1) {
        gameState.player.setColor(ramp.colorName);
        gameState.player.jump(10); // Launch!
        new ParticleSystem(gameState.player.mesh.position, ramp.mesh.material.color, 10);
        logGameInfo("USED_RAMP", { newColor: ramp.colorName });
    }
}

function gameOver(reason) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    new ParticleSystem(gameState.player.mesh.position, gameState.player.mesh.material.color, 50);
    // Hide player
    gameState.player.mesh.visible = false;
    logGameInfo("GAME_OVER", { reason: reason, finalScore: gameState.score });
}