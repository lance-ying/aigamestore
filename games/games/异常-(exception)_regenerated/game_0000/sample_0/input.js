/**
 * Input Handling
 */
import { gameState, COMMANDS, MAX_COMMANDS } from './globals.js';
import { startSimulation, stopSimulation, resetLevel, loadLevel } from './logic.js';

export function handleKeyPress(p) {
    const key = p.keyCode;

    // Global Controls
    if (key === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            // Full restart if win, level restart if lose
            if (gameState.gamePhase === "GAME_OVER_WIN") gameState.currentLevelIndex = 0;
            loadLevel(gameState.currentLevelIndex);
            gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "PLAYING") {
            resetLevel();
        }
        return;
    }

    if (key === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        return;
    }

    if (key === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            loadLevel(0);
            gameState.gamePhase = "PLAYING";
        }
        return;
    }

    // Gameplay Controls
    if (gameState.gamePhase === "PLAYING") {
        if (key === 90) { // Z - Run/Stop
            if (gameState.isSimulating) {
                stopSimulation();
            } else {
                startSimulation();
            }
            return;
        }

        if (gameState.isSimulating) return; // Lock editing during sim

        // Unit Selection
        if (key === 16) { // SHIFT
            gameState.activeUnitIndex = (gameState.activeUnitIndex + 1) % gameState.units.length;
        }

        // Slot Navigation
        if (key === p.LEFT_ARROW) {
            gameState.selectedSlotIndex = (gameState.selectedSlotIndex - 1 + MAX_COMMANDS) % MAX_COMMANDS;
        }
        if (key === p.RIGHT_ARROW) {
            gameState.selectedSlotIndex = (gameState.selectedSlotIndex + 1) % MAX_COMMANDS;
        }

        // Edit Commands
        const unit = gameState.units[gameState.activeUnitIndex];
        if (unit) {
            if (key === p.UP_ARROW) {
                cycleCommand(unit, gameState.selectedSlotIndex, 1);
            }
            if (key === p.DOWN_ARROW) {
                cycleCommand(unit, gameState.selectedSlotIndex, -1);
            }
            if (key === 32) { // SPACE - Clear
                unit.commands[gameState.selectedSlotIndex] = COMMANDS.EMPTY;
            }
        }
    }
}

function cycleCommand(unit, slotIndex, dir) {
    const current = unit.commands[slotIndex];
    // Cycle between 0 and 5
    let next = current + dir;
    if (next > 5) next = 0;
    if (next < 0) next = 5;
    unit.commands[slotIndex] = next;
}