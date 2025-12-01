import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function get_automated_testing_action(currentGameState) {
    if (!currentGameState.player) return null;

    const player = currentGameState.player;
    const hoops = currentGameState.hoops;

    // Default: No action
    let action = null;

    if (currentGameState.controlMode === 'TEST_1') {
        // Strategy: Survival / Scoring
        // Find the nearest upcoming hoop
        let targetHoop = null;
        for (let hoop of hoops) {
            // If hoop is in front of player (with some margin for passing)
            if (hoop.x > player.x - 30) {
                targetHoop = hoop;
                break;
            }
        }

        if (targetHoop) {
            // If we are far from the hoop, we want to be high enough to drop into it
            // Target height is above the hoop
            const targetHeight = targetHoop.y - 120; // Aim above the hoop
            
            // If we are close to the hoop (horizontal distance), we stop jumping to fall through
            const distToHoop = targetHoop.x - player.x;
            
            if (distToHoop > 80) {
                // If we are far, maintain altitude
                if (player.y > targetHeight) {
                    action = { keyCode: 32 }; // Jump
                }
            } else if (distToHoop > 0) {
                // We are approaching the hoop
                // If we are dangerously low (below rim), panic jump
                if (player.y > targetHoop.y - 20) {
                    action = { keyCode: 32 };
                }
                // Otherwise let gravity pull us down
            }
        } else {
            // No hoops, just stay in middle
            if (player.y > CANVAS_HEIGHT / 2) {
                action = { keyCode: 32 };
            }
        }
    } else if (currentGameState.controlMode === 'TEST_2') {
        // Random chaos
        if (Math.random() < 0.1) {
            action = { keyCode: 32 };
        }
    }

    return action;
}

window.get_automated_testing_action = get_automated_testing_action;