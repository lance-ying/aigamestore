import { gameState, CONSTANTS } from './globals.js';
import { normalizeAngle } from './utils.js';

const keys = {};

export function setupInput() {
    document.addEventListener('keydown', (e) => {
        keys[e.keyCode] = true;
        
        logInput('keydown', e.key, e.keyCode);
        
        // Global State Controls
        if (e.code === 'Enter') {
            if (gameState.gamePhase === 'START') {
                gameState.gamePhase = 'PLAYING';
            }
        }
        
        if (e.code === 'Escape') {
            if (gameState.gamePhase === 'PLAYING') gameState.gamePhase = 'PAUSED';
            else if (gameState.gamePhase === 'PAUSED') gameState.gamePhase = 'PLAYING';
        }
        
        if (e.code === 'KeyR') {
            if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
                // Use restart function instead of reloading the page
                if (typeof window.restartHelixJump === 'function') {
                    window.restartHelixJump();
                } else {
                    console.warn('[HelixJump] restartHelixJump function not found, falling back to reload');
                    window.location.reload();
                }
            }
        }
        
        // Debug/Testing Controls for Manual Override in Test Mode
        if (e.code === 'KeyT') {
            // Toggle test mode manually if needed
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.keyCode] = false;
        logInput('keyup', e.key, e.keyCode);
    });
}

function logInput(type, key, code) {
    if (window.logs) {
        window.logs.inputs.push({
            type, key, code,
            frame: gameState.frameCount,
            time: Date.now()
        });
    }
}

export function handleInput(dt) {
    if (gameState.gamePhase !== 'PLAYING') return;

    // AI / Test Control
    if (gameState.controlMode.startsWith('TEST')) {
        handleAIControl(dt);
        return;
    }

    // Human Control
    // Rotate Tower
    const speed = CONSTANTS.ROTATION_SPEED;
    
    if (keys[37] || keys[65]) { // Left or A
        gameState.targetRotation += speed;
    }
    if (keys[39] || keys[68]) { // Right or D
        gameState.targetRotation -= speed;
    }
}

function handleAIControl(dt) {
    if (gameState.controlMode === 'TEST_1') {
        // Simple spin
        gameState.targetRotation -= CONSTANTS.ROTATION_SPEED;
    } else if (gameState.controlMode === 'TEST_2') {
        // Smart Solver
        if (!gameState.ball) return;
        
        // Find platform below
        const ballY = gameState.ball.mesh.position.y;
        const platforms = gameState.platforms;
        
        let targetPlatform = null;
        for (let p of platforms) {
            // We want the first platform strictly below the ball
            if (p.y < ballY - CONSTANTS.BALL_RADIUS) {
                targetPlatform = p;
                break;
            }
        }
        
        if (targetPlatform) {
            // Goal: Align platform gap with Ball Angle (PI/2)
            // Ball Angle relative to platform = (PI/2 + towerRotation)
            // We want relativeAngle == gapAngle
            // So: PI/2 + towerRotation = gapAngle
            // => towerRotation = gapAngle - PI/2
            
            const desiredRotation = targetPlatform.gapAngle - Math.PI/2;
            
            // Smoothly move towards desired
            // Normalize angles for shortest path
            let diff = desiredRotation - gameState.targetRotation;
            // Wrap diff to -PI to PI
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            if (Math.abs(diff) > 0.1) {
                gameState.targetRotation += Math.sign(diff) * CONSTANTS.ROTATION_SPEED;
            } else {
                 gameState.targetRotation = desiredRotation;
            }
        }
    }
}