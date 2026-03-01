/**
 * Input Handling
 */

import { gameState } from './globals.js';
import { rhythmManager } from './rhythm.js';
import { physics } from './physics.js';
import { createFloatingText } from './particles.js';

export function handleInput(p, keyCode) {
    // Global controls
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        return;
    }
    
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart handled in game.js logic
        }
        return;
    }

    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.startTime = p.millis(); // Start music/rhythm now
        }
        return;
    }

    // Gameplay controls
    if (gameState.gamePhase !== "PLAYING") return;

    // Movement
    let dx = 0;
    let dy = 0;
    let actionTaken = false;

    if (keyCode === 37) dx = -1; // Left
    if (keyCode === 39) dx = 1;  // Right
    if (keyCode === 38) dy = -1; // Up
    if (keyCode === 40) dy = 1;  // Down
    if (keyCode === 32) actionTaken = true; // Space (Skip)

    if (dx !== 0 || dy !== 0 || actionTaken) {
        const timing = rhythmManager.checkInputTiming(p.millis());
        
        // Log Input
        gameState.logs.inputs.push({
            key: keyCode,
            timing: timing,
            beat: gameState.beatCount
        });

        if (timing === "PERFECT" || timing === "GOOD") {
            // SUCCESS
            gameState.playerMissedBeat = false;
            
            if (dx !== 0 || dy !== 0) {
                const moved = physics.tryMoveEntity(gameState.player, dx, dy);
                if (moved) actionTaken = true;
            }
            
            if (actionTaken) {
                // Rhythm success
                gameState.combo++;
                if (gameState.combo > 5) gameState.multiplier = 2;
                if (gameState.combo > 10) gameState.multiplier = 3;
                if (gameState.combo > 20) gameState.multiplier = 4;
                
                const player = gameState.player;
                createFloatingText(player.pixelX + 20, player.pixelY - 10, "Nice!", [0, 255, 0]);
                
                // Process Turn
                processGameTurn(p);
            }
        } 
        else if (timing === "MISS") {
            // FAIL - Stumble
            gameState.playerMissedBeat = true;
            
            // Note: We no longer damage the player directly on miss.
            // Damage only happens if an enemy attacks the player while they are off-beat.
            
            const player = gameState.player;
            createFloatingText(player.pixelX + 20, player.pixelY - 10, "Miss!", [255, 0, 0]);
            
            // Player loses turn (stumbles), but enemies still move
            processGameTurn(p);
        }
        else if (timing === "ALREADY_ACTED") {
            // Ignore
        }
    }
}

export function processGameTurn(p) {
    // Update enemies
    gameState.entities.forEach(entity => {
        if (entity.type === 'ENEMY') {
            updateEnemyAI(entity);
        }
    });
}

function updateEnemyAI(enemy) {
    if (!gameState.player) return;

    // Check Stun
    if (enemy.stunned) {
        enemy.stunned = false;
        return; // Skip turn
    }

    // Determine behavior
    // 1. Check distance
    const dist = Math.abs(enemy.gridX - gameState.player.gridX) + Math.abs(enemy.gridY - gameState.player.gridY);
    
    // Slimes don't move
    if (enemy.enemyType === 'SLIME') return;

    // Skeletons move every beat towards player
    if (enemy.enemyType === 'SKELETON') {
        if (dist < 8) { // Aggro range
             moveTowardsPlayer(enemy);
        }
    }
    
    // Bats move randomly or towards player every 2 beats
    if (enemy.enemyType === 'BAT') {
        // Use global beat count to determine move turn
        if (gameState.beatCount % 2 === 0) {
            if (Math.random() < 0.5) moveTowardsPlayer(enemy);
            else moveRandomly(enemy);
        }
    }
}

function moveTowardsPlayer(enemy) {
    const dx = gameState.player.gridX - enemy.gridX;
    const dy = gameState.player.gridY - enemy.gridY;
    
    let moveX = 0;
    let moveY = 0;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        moveX = Math.sign(dx);
    } else {
        moveY = Math.sign(dy);
    }
    
    // Try primary direction
    if (!physics.tryMoveEntity(enemy, moveX, moveY)) {
        // Try secondary
        if (moveX !== 0) {
            moveX = 0; moveY = Math.sign(dy);
        } else {
            moveY = 0; moveX = Math.sign(dx);
        }
        if (moveY !== 0 || moveX !== 0) {
             physics.tryMoveEntity(enemy, moveX, moveY);
        }
    }
}

function moveRandomly(enemy) {
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    physics.tryMoveEntity(enemy, dir[0], dir[1]);
}