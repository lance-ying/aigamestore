/**
 * game.js
 * Main entry point, game loop, and level management.
 */

import { gameState, getGameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, resetLevelState } from './globals.js';
import { Knife, Target, Apple } from './entities.js';
import { checkKnifeTargetCollision, checkKnifeKnifeCollision, checkKnifeAppleCollision, getImpactAngle, triggerScreenShake, getShakeOffset, normalizeAngle } from './physics.js';
import { renderStartScreen, renderUI, renderGameOver, renderPaused } from './ui.js';
import { handleKeyPressed, handleAutomatedInput } from './input.js';
import { spawnParticles, updateAndRenderParticles } from './particles.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
    
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(TARGET_FPS);
        p.randomSeed(42);
        
        // Log start
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        // Update Time
        const now = p.millis();
        gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = now;
        gameState.frameCount = p.frameCount;
        
        // Automated Input
        handleAutomatedInput();

        // Screen Shake calculation
        const shake = getShakeOffset(p);
        
        p.push();
        // Apply camera shake globally
        p.translate(shake.x, shake.y);
        
        // Background
        p.background(GAME_CONFIG.colors.bg);
        
        switch (gameState.gamePhase) {
            case "START":
                renderStartScreen(p);
                break;
            case "PLAYING":
                updateGame(p);
                renderGame(p);
                renderUI(p);
                break;
            case "PAUSED":
                renderGame(p);
                renderPaused(p);
                break;
            case "GAME_OVER_WIN":
            case "GAME_OVER_LOSE":
                renderGame(p);
                renderGameOver(p);
                break;
        }
        
        p.pop();
    };

    p.keyPressed = function() {
        handleKeyPressed(p);
    };
    
    // Setup Level Helper
    p.setupLevel = function() {
        resetLevelState();
        
        const isBoss = gameState.stage % GAME_CONFIG.bossInterval === 0;
        
        // Create Target
        gameState.target = new Target(isBoss, gameState.stage);
        
        // Add Pre-existing knives (Obstacles)
        // More obstacles on higher levels
        const obstacleCount = isBoss ? 0 : Math.min(Math.floor(gameState.stage / 2), 5);
        for(let i=0; i<obstacleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const k = new Knife(0, 0); // Pos doesn't matter for stuck
            k.state = "STUCK";
            k.angle = angle;
            gameState.stuckKnives.push(k);
        }
        
        // Add Apples
        const appleChance = 0.5;
        if (Math.random() < appleChance || isBoss) {
            const count = isBoss ? 3 : 1;
            for(let i=0; i<count; i++) {
                // Find open spot roughly
                const angle = Math.random() * Math.PI * 2;
                gameState.target.addApple(angle);
            }
        }
        
        // Set Knives needed to clear
        gameState.knivesRemaining = 7 + Math.floor(gameState.stage * 0.5);
        
        // Spawn first active knife
        spawnNextKnife();
    };
});

function spawnNextKnife() {
    gameState.activeKnife = new Knife(CANVAS_WIDTH / 2, GAME_CONFIG.knifeSpawnY);
}

function updateGame(p) {
    // 0. Initialize Level if needed
    if (!gameState.target) {
        p.setupLevel();
    }
    
    // 1. Update Target
    if (gameState.target) {
        gameState.target.update();
    }
    
    // 2. Update Active Knife
    if (gameState.activeKnife) {
        gameState.activeKnife.update();
        
        // Collision Detection
        if (gameState.activeKnife.state === "FLYING") {
            const k = gameState.activeKnife;
            const t = gameState.target;
            
            if (checkKnifeTargetCollision(k, t)) {
                handleKnifeHit(p, k, t);
            }
        }
    }
    
    // 3. Update Projectiles (Rebounding knives)
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const k = gameState.projectiles[i];
        k.update();
        if (k.y > CANVAS_HEIGHT + 100) {
            gameState.projectiles.splice(i, 1);
        }
    }
    
    // 4. Update Particles
    // Particles update in their own manager but we call it here
}

function handleKnifeHit(p, knife, target) {
    // 1. Calculate Stick Angle
    // The angle on the target where the knife hit.
    // Screen Hit Angle is PI/2 (90 deg).
    // AngleOnTarget = ScreenAngle - TargetRotation
    const screenAngle = Math.PI / 2;
    const hitAngle = normalizeAngle(screenAngle - target.rotation);
    
    // 2. Check Valid Hit (vs Existing Knives)
    if (checkKnifeKnifeCollision(hitAngle, gameState.stuckKnives)) {
        // FAIL!
        failGame(p, knife);
        return;
    }
    
    // 3. Check Apple Hit
    const hitAppleIndex = checkKnifeAppleCollision(knife, target);
    if (hitAppleIndex !== null) {
        // Collect Apple
        target.apples.splice(hitAppleIndex, 1);
        gameState.applesCollected++;
        gameState.score += 50; // Bonus score
        
        // Apple Particles
        // We need world coords of the hit
        // Approx at top of knife
        spawnParticles(knife.x, knife.y - knife.height/2, "APPLE", 8);
    }
    
    // 4. Stick the knife
    knife.state = "STUCK";
    knife.angle = hitAngle;
    gameState.stuckKnives.push(knife);
    gameState.activeKnife = null;
    gameState.score += 10;
    
    // Visual Feedback
    target.pulse = 5;
    spawnParticles(knife.x, knife.y - knife.height/2, "WOOD", 5);
    triggerScreenShake(3, 5); // Mild shake
    
    // 5. Progression Check
    if (gameState.knivesRemaining > 0) {
        // More knives to throw
        setTimeout(() => spawnNextKnife(), 100);
    } else {
        // LEVEL CLEARED
        levelClear(p);
    }
}

function failGame(p, knife) {
    // Rebound the knife
    knife.rebound();
    gameState.projectiles.push(knife); // Add to projectiles to fall
    gameState.activeKnife = null;
    
    triggerScreenShake(10, 20); // Big shake
    spawnParticles(knife.x, knife.y - knife.height/2, "SPARK", 15);
    
    gameState.gamePhase = "GAME_OVER_LOSE";
}

function levelClear(p) {
    // Break the log effect?
    // For now, just wait a sec then next level
    // Maybe small pause or flash
    
    // Reset Target
    gameState.target = null; // Will trigger setupLevel in updateGame
    gameState.stage++;
    
    // Reset physics speed dampening?
    // Handled in setupLevel gen
}

function renderGame(p) {
    // Render Particles First (behind?) or Last (front?)
    // Usually particles on top
    
    // Render Target (which renders stuck knives)
    if (gameState.target) {
        gameState.target.render(p);
    }
    
    // Render Active Knife
    if (gameState.activeKnife) {
        gameState.activeKnife.render(p);
    }
    
    // Render Projectiles (falling knives)
    gameState.projectiles.forEach(k => k.render(p));
    
    // Render Particles
    updateAndRenderParticles(p);
}

// Global hook
window.gameInstance = gameInstance;
window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
};