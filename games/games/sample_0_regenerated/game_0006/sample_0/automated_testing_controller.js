// automated_testing_controller.js

export function get_automated_testing_action(gameState) {
    // Only return actions if not human mode
    if (gameState.controlMode === 'HUMAN') return null;

    const action = {
        left: false,
        right: false,
        jump: false,
        attack: false
    };

    // TEST_1: Simple Movement Check
    if (gameState.controlMode === 'TEST_1') {
        // Move right and jump constantly
        action.right = true;
        if (gameState.frameCount % 60 < 20) action.jump = true;
        return action;
    }
    
    // TEST_2: Collision Check
    if (gameState.controlMode === 'TEST_2') {
        // Try to run into walls
        action.left = true;
        return action; // Should stop at wall
    }
    
    // TEST_3: Attack Check
    if (gameState.controlMode === 'TEST_3') {
        if (gameState.frameCount % 30 === 0) action.attack = true;
        return action;
    }

    return null;
}