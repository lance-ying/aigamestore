import { gameState } from './globals.js';
import { getNextAvailableNodes } from './map.js';
import { startCombat, playCard, endTurn } from './combat_system.js';
import { getRandomCardReward } from './card_definitions.js';

/**
 * Input handling state machine.
 */

export function handleInput(p, keyCode) {
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "BATTLE" || gameState.gamePhase === "MAP") {
            gameState.previousPhase = gameState.gamePhase;
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = gameState.previousPhase;
        }
        return;
    }

    if (keyCode === 82) { // R
        if (gameState.gamePhase.includes("GAME_OVER")) {
            window.location.reload(); // Simple restart
        }
        return;
    }

    switch (gameState.gamePhase) {
        case "START":
            if (keyCode === 13) { // ENTER
                gameState.gamePhase = "MAP";
            }
            break;
            
        case "MAP":
            handleMapInput(keyCode);
            break;
            
        case "BATTLE":
            handleBattleInput(keyCode);
            break;
            
        case "REWARD":
            handleRewardInput(keyCode);
            break;
            
        case "CAMPFIRE":
            handleCampfireInput(keyCode);
            break;
    }
}

function handleMapInput(keyCode) {
    const available = getNextAvailableNodes();
    if (available.length === 0) return;
    
    if (keyCode === 39) { // Right
        gameState.mapSelectionIndex = (gameState.mapSelectionIndex + 1) % available.length;
    } else if (keyCode === 37) { // Left
        gameState.mapSelectionIndex = (gameState.mapSelectionIndex - 1 + available.length) % available.length;
    } else if (keyCode === 13 || keyCode === 32) { // Enter/Space
        const nextNode = available[gameState.mapSelectionIndex];
        visitNode(nextNode);
    }
}

function visitNode(node) {
    gameState.currentNode = node;
    gameState.floor = node.floor;
    node.visited = true;
    
    if (node.type === 'monster' || node.type === 'elite' || node.type === 'boss') {
        startCombat(node.type);
    } else if (node.type === 'rest') {
        gameState.gamePhase = "CAMPFIRE";
        gameState.campfireOptions = [{ label: "Rest", action: "heal" }]; // Simplify
        gameState.campfireSelectionIndex = 0;
    } else {
        // Fallback for events/starts
        gameState.gamePhase = "MAP"; 
    }
}

function handleBattleInput(keyCode) {
    const combat = gameState.combat;
    
    if (combat.phase !== "PLAYER_TURN") return;
    
    if (keyCode === 39) { // Right
        combat.selectedCardIndex = Math.min(combat.selectedCardIndex + 1, combat.hand.length - 1);
    } else if (keyCode === 37) { // Left
        combat.selectedCardIndex = Math.max(combat.selectedCardIndex - 1, 0);
    } else if (keyCode === 13 || keyCode === 32) { // Enter/Space
        playCard();
    } else if (keyCode === 90) { // Z
        endTurn();
    }
}

function handleRewardInput(keyCode) {
    if (keyCode === 38 || keyCode === 40) { // Up/Down
        gameState.rewardSelectionIndex = (gameState.rewardSelectionIndex === 0) ? 1 : 0;
    } else if (keyCode === 13 || keyCode === 32) {
        // Claim reward
        const reward = gameState.rewards[gameState.rewardSelectionIndex];
        if (reward) {
            if (reward.type === 'gold') {
                gameState.gold += reward.amount;
            } else if (reward.type === 'card_choice') {
                // Auto pick first for simplicity in this constrained version
                // Ideally opens another sub-menu
                gameState.deck.push(reward.data[0]); 
            }
            gameState.rewards.splice(gameState.rewardSelectionIndex, 1);
            if (gameState.rewards.length === 0) {
                gameState.gamePhase = "MAP";
                // Reset selection for next map traversal
                gameState.mapSelectionIndex = 0;
            }
        }
    } else if (keyCode === 27) { // ESC - Skip
        gameState.gamePhase = "MAP";
    }
}

function handleCampfireInput(keyCode) {
    if (keyCode === 13 || keyCode === 32) {
        // Heal
        gameState.player.heal(Math.floor(gameState.player.maxHp * 0.3));
        gameState.gamePhase = "MAP";
    }
}