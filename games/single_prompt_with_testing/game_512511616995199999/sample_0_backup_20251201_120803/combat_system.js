import { gameState, log, COLORS } from './globals.js';
import { shuffleArray, uuid } from './utils.js';
import { Player, Enemy } from './entities.js';
import { CARD_DATABASE, getCardData, TARGET_TYPES } from './card_definitions.js';
import { createDamageParticle } from './particles.js';

/**
 * Handles Combat Logic.
 */

// Helper class for in-combat card instance
class CombatCard {
    constructor(cardData) {
        this.data = cardData;
        this.uid = uuid(); // Unique ID for this instance in hand
    }
}

export function startCombat(enemyType) {
    gameState.gamePhase = "BATTLE";
    gameState.combat.turn = 1;
    gameState.combat.energy = gameState.player.energy;
    gameState.combat.hand = [];
    gameState.combat.discardPile = [];
    gameState.combat.exhaustPile = [];
    gameState.combat.phase = "PLAYER_TURN";
    gameState.combat.selectedCardIndex = 0;
    gameState.combat.message = "Battle Start!";
    
    // Initialize Draw Pile from Master Deck
    gameState.combat.drawPile = gameState.deck.map(data => new CombatCard(data));
    shuffleArray(gameState.combat.drawPile);
    
    // Spawn Enemy
    let e = new Enemy(450, 250, enemyType || 'cultist');
    gameState.combat.enemies = [e];
    
    // Reset Player combat stats
    gameState.player.block = 0;
    gameState.player.powers = { vulnerable: 0, weak: 0, strength: 0 };
    
    // Draw initial hand
    drawCards(5);
    
    log("game_info", { event: "combat_start", enemy: enemyType });
}

export function drawCards(amount) {
    for (let i = 0; i < amount; i++) {
        if (gameState.combat.drawPile.length === 0) {
            if (gameState.combat.discardPile.length === 0) break; // No cards left
            // Reshuffle
            gameState.combat.drawPile = gameState.combat.discardPile;
            gameState.combat.discardPile = [];
            shuffleArray(gameState.combat.drawPile);
        }
        gameState.combat.hand.push(gameState.combat.drawPile.pop());
    }
    // Limit hand size? usually 10.
}

export function playCard() {
    const combat = gameState.combat;
    if (combat.hand.length === 0) return;
    
    const cardInstance = combat.hand[combat.selectedCardIndex];
    const card = cardInstance.data;
    const player = gameState.player;
    const target = combat.enemies[0]; // Simplification: Single target or auto-target first
    
    // Check Energy
    if (combat.energy < card.cost) {
        combat.message = "Not Enough Energy!";
        return;
    }
    
    // Apply Effects
    combat.energy -= card.cost;
    
    let dmg = card.damage || 0;
    // Apply Strength
    if (dmg > 0) dmg += player.powers.strength;
    // Apply Weak (player deals less)
    if (player.powers.weak > 0) dmg = Math.floor(dmg * 0.75);

    if (card.target === TARGET_TYPES.ENEMY) {
        if (dmg > 0) target.takeDamage(dmg);
        if (card.vulnerable) target.powers.vulnerable += card.vulnerable;
    } else if (card.target === TARGET_TYPES.ALL_ENEMIES) {
        combat.enemies.forEach(e => {
            if (dmg > 0) e.takeDamage(dmg);
        });
    }
    
    if (card.block) {
        player.addBlock(card.block);
    }
    
    if (card.draw) {
        drawCards(card.draw);
    }

    if (card.special === "copy_self") {
        combat.discardPile.push(new CombatCard(card));
    }
    
    // Move to discard
    combat.discardPile.push(cardInstance);
    combat.hand.splice(combat.selectedCardIndex, 1);
    
    // Adjust selection index
    if (combat.selectedCardIndex >= combat.hand.length) {
        combat.selectedCardIndex = Math.max(0, combat.hand.length - 1);
    }
    
    // Check for Win
    if (combat.enemies.every(e => e.isDead)) {
        endCombat(true);
    }
}

export function endTurn() {
    gameState.combat.phase = "ENEMY_TURN";
    gameState.combat.message = "Enemy Turn";
    
    // Discard Hand
    while(gameState.combat.hand.length > 0) {
        gameState.combat.discardPile.push(gameState.combat.hand.pop());
    }
    
    // Enemy Actions
    setTimeout(() => {
        const player = gameState.player;
        
        gameState.combat.enemies.forEach(e => {
            if (!e.isDead) e.executeTurn(player);
        });
        
        // Check Loss
        if (player.currentHp <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
            return;
        }
        
        // Start Player Turn
        startPlayerTurn();
        
    }, 1000); // Delay for visual pacing
}

function startPlayerTurn() {
    gameState.combat.phase = "PLAYER_TURN";
    gameState.combat.turn++;
    gameState.combat.energy = gameState.player.maxEnergy;
    gameState.combat.message = "Player Turn";
    
    // Reset Block (unless Barricade relic - not impl)
    gameState.player.block = 0;
    
    // Tick powers
    if (gameState.player.powers.vulnerable > 0) gameState.player.powers.vulnerable--;
    if (gameState.player.powers.weak > 0) gameState.player.powers.weak--;
    
    drawCards(5);
}

function endCombat(win) {
    if (win) {
        gameState.combat.message = "Victory!";
        // Delay then go to rewards
        setTimeout(() => {
            setupRewards();
        }, 1500);
    }
}

import { getRandomCardReward } from './card_definitions.js';

function setupRewards() {
    gameState.gamePhase = "REWARD";
    gameState.rewards = [];
    
    // Card Reward
    gameState.rewards.push({ type: 'card_choice', data: [getRandomCardReward(), getRandomCardReward(), getRandomCardReward()] });
    
    // Gold Reward
    const goldAmt = Math.floor(Math.random() * 20) + 10;
    gameState.rewards.push({ type: 'gold', amount: goldAmt });
    
    gameState.rewardSelectionIndex = 0;
    
    if (gameState.currentNode.type === 'boss') {
        gameState.gamePhase = "GAME_OVER_WIN"; // Short game loop for this implementation
    }
}