import { gameState, GRID_SIZE } from './globals.js';
import { isSolid } from './physics.js';

// Controller for TEST_1: Survival Strategy
function getSurvivalAction(gameState) {
    const player = gameState.player;
    if (!player || player.isMoving || player.isDead) return null;
    
    const currentLane = gameState.laneManager.getLaneAt(player.gridY);
    const forwardLane = gameState.laneManager.getLaneAt(player.gridY - 1);
    
    if (!forwardLane) return null;

    // Helper: Predict collision at a grid point in future
    // Basic heuristic: check if any obstacle is dangerously close to intersection
    function isDangerous(lane, gridX, stepsAway = 0) {
        if (!lane) return true; // Void is bad
        
        // 1. Static obstacles (Trees)
        if (lane.staticMap && lane.staticMap[gridX]) return true;
        
        // 2. Dynamic obstacles
        // Calculate player center X in world
        const checkX = gridX * GRID_SIZE + GRID_SIZE/2;
        const safetyMargin = GRID_SIZE * 1.5;
        
        if (lane.type === 'ROAD' || lane.type === 'RAIL') {
            // Train warning
            if (lane.type === 'RAIL' && (lane.isWarning || lane.trainActive)) return true;
            
            for (let obs of lane.obstacles) {
                // Time to impact?
                // Simple: is it currently close?
                // Better: Where will it be in (stepsAway * moveDuration + reactionTime)
                // Let's stick to simple "Is it close now moving towards us"
                const dist = obs.x + obs.width/2 - checkX;
                
                // If moving towards us
                if ((lane.direction === 1 && obs.x < checkX + safetyMargin && obs.x + obs.width > checkX - safetyMargin * 2) ||
                    (lane.direction === -1 && obs.x > checkX - safetyMargin && obs.x < checkX + safetyMargin * 2)) {
                    return true;
                }
            }
            return false;
        } 
        
        if (lane.type === 'WATER') {
            // Dangerous if NO log is there
            let hasLog = false;
            for (let obs of lane.obstacles) {
                const centerObs = obs.x + obs.width/2;
                // Check if log covers the grid center
                if (checkX > obs.x && checkX < obs.x + obs.width) {
                    hasLog = true;
                    break;
                }
            }
            return !hasLog;
        }
        
        return false;
    }
    
    // Strategy:
    // 1. Can we move Forward? (UP)
    if (!isDangerous(forwardLane, player.gridX)) {
        return { keyCode: 38 }; // UP
    }
    
    // 2. If blocked, can we move Left or Right to a safer spot?
    // Or just wait.
    
    // If we are currently in danger (e.g. log moving away), we MUST move.
    const amInDanger = isDangerous(currentLane, player.gridX); // Mostly checks water/rail
    
    if (amInDanger) {
        // Panic! Move anywhere safe.
        if (!isDangerous(currentLane, player.gridX - 1)) return { keyCode: 37 }; // Left
        if (!isDangerous(currentLane, player.gridX + 1)) return { keyCode: 39 }; // Right
        if (!isDangerous(forwardLane, player.gridX)) return { keyCode: 38 }; // Up (Try again)
        return { keyCode: 40 }; // Back
    }
    
    // If waiting for a car to pass, maybe move sideways to optimize?
    // Random side step if waiting too long?
    if (Math.random() < 0.05) {
        if (player.gridX > 2) return { keyCode: 37 };
        if (player.gridX < 12) return { keyCode: 39 };
    }

    return null; // Wait
}

// Controller for TEST_2: Random Chaos
function getRandomAction(gameState) {
    const actions = [37, 38, 39, 40]; // Arrows
    if (Math.random() < 0.2) { // 20% chance to press key per frame
        return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
    }
    return null;
}

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== 'PLAYING') return null;

    switch (gameState.controlMode) {
        case "TEST_1":
            return getSurvivalAction(gameState);
        case "TEST_2":
            return getRandomAction(gameState);
        default:
            return null;
    }
}

window.get_automated_testing_action = get_automated_testing_action;