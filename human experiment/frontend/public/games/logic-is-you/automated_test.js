// Automated Testing Controller

export function get_automated_testing_action(gameState) {
    // Only act in test modes
    if (gameState.controlMode !== 'TEST_1' && gameState.controlMode !== 'TEST_2') return null;
    
    // Very simple scripted actions or random
    
    if (gameState.controlMode === 'TEST_1') {
        // Just move randomly
        const keys = [37, 38, 39, 40];
        const key = keys[Math.floor(Math.random() * keys.length)];
        return { keyCode: key };
    }
    
    if (gameState.controlMode === 'TEST_2') {
        // Attempt to move right towards flag (assuming level 1)
        return { keyCode: 39 }; // Right arrow
    }
    
    return null;
}
window.get_automated_testing_action = get_automated_testing_action;