/**
 * Automated testing logic.
 */
import { gameState } from './globals.js';
import { getNextAvailableNodes } from './map.js';

export function get_automated_testing_action(gs) {
    const mode = gs.controlMode;
    if (mode === "HUMAN") return null;

    if (mode === "TEST_1") {
        return test1Strategy(gs);
    } else if (mode === "TEST_2") {
        return test2Strategy(gs);
    }
    return null;
}

// Basic Traversal Test
function test1Strategy(gs) {
    if (gs.gamePhase === "START") return { keyCode: 13 }; // Enter
    
    if (gs.gamePhase === "MAP") {
        return { keyCode: 13 }; // Just press Enter to go to pre-selected next node
    }
    
    if (gs.gamePhase === "BATTLE") {
        if (gs.combat.phase === "PLAYER_TURN") {
            // If energy > 0 and cards available, play first card
            if (gs.combat.energy > 0 && gs.combat.hand.length > 0) {
                return { keyCode: 32 }; // Play
            } else {
                return { keyCode: 90 }; // End Turn
            }
        }
    }
    
    if (gs.gamePhase === "REWARD") return { keyCode: 13 }; // Take all
    if (gs.gamePhase === "CAMPFIRE") return { keyCode: 13 }; // Rest
    
    return null;
}

// Smart Survival Test
function test2Strategy(gs) {
    if (gs.gamePhase === "START") return { keyCode: 13 };
    if (gs.gamePhase === "MAP") return { keyCode: 13 };
    
    if (gs.gamePhase === "BATTLE") {
        if (gs.combat.phase === "PLAYER_TURN") {
            const hand = gs.combat.hand;
            if (gs.combat.energy === 0 || hand.length === 0) return { keyCode: 90 };
            
            // Analyze intent
            const enemy = gs.combat.enemies[0];
            const isAttacking = enemy && enemy.nextMove && enemy.nextMove.type.includes('attack');
            
            // Find Defend cards
            let defendIndex = -1;
            let attackIndex = -1;
            
            hand.forEach((c, i) => {
                if (c.data.id === 'defend' || c.data.block > 0) defendIndex = i;
                if (c.data.type === 'ATTACK') attackIndex = i;
            });
            
            // Selection logic
            let targetIndex = 0;
            if (isAttacking && defendIndex !== -1) {
                targetIndex = defendIndex;
            } else if (attackIndex !== -1) {
                targetIndex = attackIndex;
            } else {
                targetIndex = 0; // Fallback
            }
            
            // Move cursor
            if (gs.combat.selectedCardIndex < targetIndex) return { keyCode: 39 };
            if (gs.combat.selectedCardIndex > targetIndex) return { keyCode: 37 };
            
            // Play
            return { keyCode: 32 };
        }
    }
    
    if (gs.gamePhase === "REWARD") return { keyCode: 13 };
    if (gs.gamePhase === "CAMPFIRE") return { keyCode: 13 };
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;