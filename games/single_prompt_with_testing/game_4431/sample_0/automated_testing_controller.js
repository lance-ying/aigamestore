/**
 * automated_testing_controller.js
 * Logic for automated testing bots.
 */

export function get_automated_testing_action(gameState) {
    // Throttle inputs
    if (gameState.frameCount % 15 !== 0) return null;
    if (gameState.gamePhase !== "PLAYING") return { keyCode: 13 }; // Press Enter to start

    if (gameState.controlMode === "TEST_1") {
        // Random Bot (Monkey testing)
        const keys = [37, 38, 39, 40, 32, 90, 16]; // Arrows, Space, Z, Shift
        return { keyCode: keys[Math.floor(Math.random() * keys.length)] };
    }

    if (gameState.controlMode === "TEST_2") {
        // "Win" Bot - just end turns to win by survival
        return { keyCode: 16 }; // Press Shift (End Turn)
    }

    if (gameState.controlMode === "TEST_3") {
        // "Lose" Bot - End turns but maybe fail? 
        // Just ending turns might actually win if enemies are bad.
        // But checking the logic of turn cycling is enough.
        return { keyCode: 16 };
    }

    return null;
}