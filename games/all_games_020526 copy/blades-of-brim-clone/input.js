import { gameState, logs } from './globals.js';

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        handleKey(e.key, e.code, true);
    });

    window.addEventListener('keyup', (e) => {
        handleKey(e.key, e.code, false);
    });
}

function handleKey(key, code, isPressed) {
    const input = gameState.input;
    
    // Log Input
    if (isPressed) {
        logs.inputs.push({
            type: 'keydown',
            key: key,
            code: code,
            frame: gameState.frameCount,
            time: Date.now()
        });
    }

    // Mapping
    switch(code) {
        case 'ArrowLeft':
        case 'KeyA':
            input.left = isPressed;
            break;
        case 'ArrowRight':
        case 'KeyD':
            input.right = isPressed;
            break;
        case 'ArrowUp':
        case 'KeyW':
            input.up = isPressed;
            break;
        case 'ArrowDown':
        case 'KeyS':
            input.down = isPressed;
            break;
        case 'Space':
            input.attack = isPressed;
            break;
        case 'Enter':
            input.start = isPressed;
            break;
        case 'Escape':
            // Toggle pause only on down press
            if (isPressed) input.pause = !input.pause; 
            break;
        case 'KeyR':
            input.restart = isPressed;
            break;
    }
}

export function processInput() {
    // Phase Transitions
    if (gameState.input.start && gameState.gamePhase === 'START') {
        gameState.gamePhase = 'PLAYING';
    }
    
    if (gameState.input.pause && gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
    } else if (!gameState.input.pause && gameState.gamePhase === 'PAUSED') {
        // This toggle logic in handleKey handles the flip, 
        // but we need to ensure we don't flip-flop every frame.
        // Simplified: ESC sets a flag, logic here handles state.
        // Correct implementation: handleKey toggles a 'pauseRequest' or similar.
        // For simplicity: KeyDown on Escape executes logic directly usually.
        // Let's rely on KeyDown event in handleKey for Pause toggle to avoid bounce.
    }
    
    if (gameState.gamePhase === 'PAUSED' && !gameState.input.pause) {
         gameState.gamePhase = 'PLAYING';
    }

    if (gameState.input.restart && (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE')) {
        window.location.reload(); // Simple restart
    }

    // Player Control
    if (gameState.gamePhase === 'PLAYING' && gameState.player) {
        const player = gameState.player;
        
        // Lane changing (needs single press detection)
        if (gameState.input.left) {
            if (!player.wasLeft) {
                // Corrected: Left key decreases index (moves left)
                player.changeLane(-1);
            }
            player.wasLeft = true;
        } else {
            player.wasLeft = false;
        }

        if (gameState.input.right) {
            if (!player.wasRight) {
                player.changeLane(1);
            }
            player.wasRight = true;
        } else {
            player.wasRight = false;
        }

        if (gameState.input.up) {
            player.jump();
        }

        if (gameState.input.down) {
            player.roll();
        }

        if (gameState.input.attack) {
            player.attack();
        }
    }
}