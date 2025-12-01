import { gameState } from './globals.js';

export function handleInput(p) {
    // Phase control handled in main keyPressed
    
    // Gameplay inputs
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (p.keyCode === p.LEFT_ARROW) gameState.player.move(-1, 0);
        if (p.keyCode === p.RIGHT_ARROW) gameState.player.move(1, 0);
        if (p.keyCode === p.UP_ARROW) gameState.player.move(0, -1);
        if (p.keyCode === p.DOWN_ARROW) gameState.player.move(0, 1);
    }
}

export function automatedInput(p) {
    // Called every frame
    if (!gameState.player) return;
    if (gameState.gamePhase !== "PLAYING") {
        // Handle restarts automatically for testing
        if (gameState.gamePhase === "GAME_OVER_LOSE" && Math.random() < 0.05) {
             // Simulate R key
             window.gameInstance.keyPressed({keyCode: 82});
        }
        return;
    }

    // Only input if IDLE to simulate meaningful decisions
    if (gameState.player.state !== "IDLE") return;

    if (gameState.controlMode === "TEST_1") {
        // Random moves
        const moves = [
            {code: 37, dx: -1, dy: 0},
            {code: 39, dx: 1, dy: 0},
            {code: 38, dx: 0, dy: -1},
            {code: 40, dx: 0, dy: 1}
        ];
        const move = moves[Math.floor(Math.random() * moves.length)];
        gameState.player.move(move.dx, move.dy);
    }
    else if (gameState.controlMode === "TEST_2") {
        // Heuristic:
        // 1. Scan for nearby coins
        // 2. Prefer UP
        // 3. Avoid Down if Tide is close
        
        // Simple scan
        let bestMove = {dx: 0, dy: -1}; // Default UP
        
        // Check if UP is blocked immediately
        // (This requires knowledge of walls, simplifying for test logic)
        // Just pick a valid direction that isn't blocked
        
        const moves = [
            {dx: 0, dy: -1, w: 10}, // UP
            {dx: 1, dy: 0, w: 5},   // RIGHT
            {dx: -1, dy: 0, w: 5},  // LEFT
            {dx: 0, dy: 1, w: 1}    // DOWN
        ];
        
        // Randomly pick based on weight
        const r = Math.random() * 21;
        let sum = 0;
        for(let m of moves) {
            sum += m.w;
            if (r < sum) {
                gameState.player.move(m.dx, m.dy);
                break;
            }
        }
    }
}