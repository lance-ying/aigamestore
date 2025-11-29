// automated_testing.js
import { dist } from './utils.js';

export function get_automated_testing_action(p, gameState) {
    if (!gameState.player) return null;

    const player = gameState.player;
    const action = { keys: [] };
    const buffer = 10;

    if (gameState.controlMode === 'TEST_1') {
        // WIN STRATEGY: Collect Modules
        let target = null;

        // Find nearest uncollected module
        if (gameState.collectibles.length > 0) {
            let record = Infinity;
            for(let c of gameState.collectibles) {
                if (c.type === 'MODULE') {
                    const d = dist(player.x, player.y, c.x, c.y);
                    if (d < record) {
                        record = d;
                        target = c;
                    }
                }
            }
        }

        if (target) {
            // Move towards target
            if (player.x < target.x - buffer) action.keys.push(p.RIGHT_ARROW);
            else if (player.x > target.x + buffer) action.keys.push(p.LEFT_ARROW);
            
            if (player.y < target.y - buffer) action.keys.push(p.DOWN_ARROW);
            else if (player.y > target.y + buffer) action.keys.push(p.UP_ARROW);

            // Dash if far
            if (dist(player.x, player.y, target.x, target.y) > 100) {
                action.keys.push(32); // Space
            }
        } else {
            // No modules left, should have won. Just idle.
        }

    } else if (gameState.controlMode === 'TEST_2') {
        // LOSE STRATEGY: Hug Enemy
        let target = null;
        let record = Infinity;
        
        for(let e of gameState.enemies) {
            const d = dist(player.x, player.y, e.x, e.y);
            if (d < record) {
                record = d;
                target = e;
            }
        }

        if (target) {
            if (player.x < target.x) action.keys.push(p.RIGHT_ARROW);
            else action.keys.push(p.LEFT_ARROW);
            
            if (player.y < target.y) action.keys.push(p.DOWN_ARROW);
            else action.keys.push(p.UP_ARROW);
        }

    } else if (gameState.controlMode === 'TEST_3') {
        // ATTACK STRATEGY
        let target = null;
        let record = Infinity;
        for(let e of gameState.enemies) {
            const d = dist(player.x, player.y, e.x, e.y);
            if (d < record) {
                record = d;
                target = e;
            }
        }

        if (target) {
            if (dist(player.x, player.y, target.x, target.y) > 40) {
                if (player.x < target.x) action.keys.push(p.RIGHT_ARROW);
                else action.keys.push(p.LEFT_ARROW);
                
                if (player.y < target.y) action.keys.push(p.DOWN_ARROW);
                else action.keys.push(p.UP_ARROW);
            } else {
                // Attack
                if (p.frameCount % 10 === 0) action.keys.push(90); // Z
            }
        }
    }

    return action;
}