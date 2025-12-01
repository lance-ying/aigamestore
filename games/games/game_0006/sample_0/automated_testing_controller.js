import { simulateKeyPress, simulateKeyRelease, KEYS } from './input.js';

export function get_automated_testing_action(gameState) {
    // Only return action for logging/debugging if needed, 
    // real logic modifies input state directly
    if (gameState.controlMode === "TEST_1") {
        testMovement();
    } else if (gameState.controlMode === "TEST_2") {
        testFloating();
    } else if (gameState.controlMode === "TEST_3") {
        testAILevelComplete(gameState);
    }
}

let testTimer = 0;

function testMovement() {
    testTimer++;
    if (testTimer < 60) {
        simulateKeyPress(KEYS.RIGHT);
    } else {
        simulateKeyRelease(KEYS.RIGHT);
    }
}

function testFloating() {
    testTimer++;
    // Jump first
    if (testTimer < 10) {
        simulateKeyPress(KEYS.UP);
    } else if (testTimer < 20) {
        simulateKeyRelease(KEYS.UP); // Peak of jump
    } else if (testTimer < 100) {
        simulateKeyPress(KEYS.SPACE); // Float down
    } else {
        simulateKeyRelease(KEYS.SPACE);
    }
}

function testAILevelComplete(gameState) {
    const player = gameState.player;
    if (!player) return;

    // Find nearest target (Coin or Exit)
    let target = null;
    let minDist = Infinity;

    // Check coins first
    for (let coin of gameState.coins) {
        let d = Math.abs(player.x - coin.x) + Math.abs(player.y - coin.y);
        if (d < minDist) {
            minDist = d;
            target = coin;
        }
    }

    // If all coins collected, target end of level
    if (gameState.coinsCollectedInLevel >= gameState.totalCoinsInLevel) {
        target = { x: gameState.worldWidth, y: player.y };
    }

    if (target) {
        // Horizontal Control
        if (target.x > player.x + 10) {
            simulateKeyPress(KEYS.RIGHT);
            simulateKeyRelease(KEYS.LEFT);
        } else if (target.x < player.x - 10) {
            simulateKeyPress(KEYS.LEFT);
            simulateKeyRelease(KEYS.RIGHT);
        } else {
            simulateKeyRelease(KEYS.LEFT);
            simulateKeyRelease(KEYS.RIGHT);
        }

        // Vertical Control / Jump
        // Jump if target is significantly above
        if (target.y < player.y - 50 && player.onGround) {
            simulateKeyPress(KEYS.UP);
        } 
        // Float if falling and target is high
        else if (player.vy > 0 && target.y < player.y) {
            simulateKeyPress(KEYS.SPACE);
        }
        else {
            simulateKeyRelease(KEYS.UP);
            simulateKeyRelease(KEYS.SPACE);
        }
    }
}

window.get_automated_testing_action = get_automated_testing_action;