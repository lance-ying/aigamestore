import { CANVAS_HEIGHT } from './globals.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    const player = gameState.player;
    const obstacles = gameState.obstacles;
    const coins = gameState.coins;
    
    if (gameState.controlMode === 'TEST_1') {
        // Survival Mode
        // Find nearest threatening obstacle
        let threat = null;
        let minDist = 10000;
        
        obstacles.forEach(obs => {
            if (obs.x > player.x - 20 && obs.x < player.x + 400) {
                if (obs.x < minDist) {
                    minDist = obs.x;
                    threat = obs;
                }
            }
        });
        
        if (threat) {
            // Determine threat center Y
            let threatY = threat.y + (threat.h || 0) / 2;
            
            // If threat is high, go low. If low, go high.
            // Zappers:
            if (threat.vertical) {
                // Vertical zapper, try to go under or over based on gap
                // Simplified: just go opposite to its center
                if (threatY < CANVAS_HEIGHT / 2) {
                    // Threat is high, drop down
                    return null;
                } else {
                    // Threat is low, fly up
                    return { keyCode: 32 };
                }
            } else {
                // Horizontal zapper
                if (threat.y < player.y) {
                    // It's above us, stay down
                    return null;
                } else {
                    // It's below us, fly up
                    return { keyCode: 32 };
                }
            }
        }
        
        // No immediate threat, maintain middle altitude to react better
        if (player.y > CANVAS_HEIGHT * 0.6) {
            return { keyCode: 32 };
        }
        return null;
    } 
    else if (gameState.controlMode === 'TEST_2') {
        // Coin Collector Mode
        // Prioritize coins unless threat is immediate
        
        // Check for immediate death threats first
        let threat = null;
        let minThreatDist = 200; // Closer reaction radius
        obstacles.forEach(obs => {
            if (obs.x > player.x && obs.x < player.x + minThreatDist) {
                threat = obs;
            }
        });
        
        if (threat) {
            // Dodge logic
            if (threat.y + (threat.h||20)/2 > player.y) {
                return { keyCode: 32 }; // Obstacle below/level, fly up
            } else {
                return null; // Obstacle above, fall
            }
        }
        
        // Seek Coins
        let targetCoin = null;
        let minCoinDist = 600;
        
        coins.forEach(coin => {
            if (!coin.collected && coin.x > player.x && coin.x < player.x + minCoinDist) {
                minCoinDist = coin.x;
                targetCoin = coin;
            }
        });
        
        if (targetCoin) {
            if (player.y > targetCoin.y) {
                return { keyCode: 32 }; // Fly up to coin
            } else {
                return null; // Drop to coin
            }
        }
        
        // Default: hover in middle
        if (player.y > CANVAS_HEIGHT / 2) return { keyCode: 32 };
        return null;
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;