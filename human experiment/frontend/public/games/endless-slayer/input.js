/**
 * Input handling system.
 */
import { gameState, CLASSES } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const keys = {};

export function handleInput(p) {
    // If in automated mode, override inputs
    if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Simulate key press for one frame
            if (action.keys) {
                // Clear keys first to emulate precise control
                for(let k in keys) delete keys[k];
                
                action.keys.forEach(k => {
                    keys[k] = true;
                });
            }
        }
    }
}

export function isKeyPressed(keyCode) {
    return !!keys[keyCode];
}

export function handleKeyPressed(p) {
    // Prevent default browser scrolling for arrow keys and space
    if([37, 38, 39, 40, 32].indexOf(p.keyCode) > -1) {
        // p.keyEvent is not directly accessible to preventDefault in instance mode easily 
        // without the event object, but p5 handles this usually.
    }

    // Update internal key state
    keys[p.keyCode] = true;

    // Logging
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Phase Transitions
    switch (gameState.gamePhase) {
        case "START":
            handleStartScreenInput(p);
            break;
        case "PLAYING":
            handlePlayingInput(p);
            break;
        case "PAUSED":
            if (p.keyCode === 27) { // ESC
                gameState.gamePhase = "PLAYING";
            }
            break;
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (p.keyCode === 82) { // R
                // Handled in main loop or here, let's trigger a restart event?
                // Ideally, main loop checks this, but we can set a flag or just reset here.
                // Resetting logic is complex, better to handle in game.js. 
                // We'll let game.js poll for this state or handle it there.
                // Actually, constraints say PLAYING->GAME_OVER->START.
                // So R goes to START.
                // The actual reset happens in game.js when transitioning to START.
                gameState.gamePhase = "START";
            }
            break;
    }
}

export function handleKeyReleased(p) {
    keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

// Helper for Start Screen
function handleStartScreenInput(p) {
    if (p.keyCode === 37) { // Left
        gameState.selectedClassIndex = (gameState.selectedClassIndex - 1 + 3) % 3;
    } else if (p.keyCode === 39) { // Right
        gameState.selectedClassIndex = (gameState.selectedClassIndex + 1) % 3;
    } else if (p.keyCode === 13) { // Enter
        gameState.gamePhase = "PLAYING";
        // Setup player is done in game.js update loop on phase change
    }
}

// Helper for Playing Phase
function handlePlayingInput(p) {
    if (p.keyCode === 27) { // ESC
        gameState.gamePhase = "PAUSED";
    }
    // Gameplay actions like Jump and Attack are polled in Player.update()
}