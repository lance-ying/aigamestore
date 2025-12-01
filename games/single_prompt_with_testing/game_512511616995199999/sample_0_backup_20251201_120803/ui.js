import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { drawTextWrapped } from './utils.js';
import { CARD_TYPES } from './card_definitions.js';

/**
 * UI Rendering functions.
 */

export function renderUI(p) {
    // Top Bar (HUD)
    if (gameState.gamePhase !== "START" && gameState.gamePhase !== "GAME_OVER_WIN" && gameState.gamePhase !== "GAME_OVER_LOSE") {
        renderHUD(p);
    }

    switch (gameState.gamePhase) {
        case "START": renderStartScreen(p); break;
        case "MAP": renderMapScreen(p); break;
        case "BATTLE": renderBattleScreen(p); break;
        case "REWARD": renderRewardScreen(p); break;
        case "CAMPFIRE": renderCampfireScreen(p); break;
        case "GAME_OVER_WIN": renderGameOverScreen(p, true); break;
        case "GAME_OVER_LOSE": renderGameOverScreen(p, false); break;
        case "PAUSED": renderPausedScreen(p); break;
    }
}

function renderHUD(p) {
    p.push();
    p.fill(COLORS.UI_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    
    // HP
    p.fill(200, 50, 50);
    p.text(`HP: ${gameState.player.currentHp}/${gameState.player.maxHp}`, 20, 20);
    
    // Gold
    p.fill(255, 215, 0);
    p.text(`Gold: ${gameState.gold}`, 150, 20);
    
    // Floor
    p.fill(200);
    p.text(`Floor: ${gameState.floor + 1}`, 280, 20);
    
    p.pop();
}

function renderStartScreen(p) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.ACCENT);
    p.textSize(40);
    p.text("SPIRE CLIMBER", CANVAS_WIDTH/2, 100);
    
    p.fill(COLORS.TEXT);
    p.textSize(16);
    drawTextWrapped(p, "Climb the Spire. Slay the Boss. Build your Deck.", CANVAS_WIDTH/2 - 150, 160, 300, 25);
    
    p.fill(200);
    p.textSize(14);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 300);
    }
    
    p.textSize(12);
    p.fill(150);
    p.text("Arrow Keys: Navigate | Space/Enter: Select | Z: End Turn", CANVAS_WIDTH/2, 350);
}

function renderMapScreen(p) {
    p.textAlign(p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text("Map", CANVAS_WIDTH/2, 80);
    
    if (!gameState.map) return;
    
    // Draw connections first
    p.stroke(100);
    p.strokeWeight(2);
    gameState.map.forEach(floor => {
        floor.forEach(node => {
            node.next.forEach(nextId => {
                // Find next node object (inefficient search but fine for small map)
                let nextNode;
                gameState.map.forEach(f => f.forEach(n => { if(n.id === nextId) nextNode = n; }));
                
                if (nextNode) {
                    p.line(node.x, node.y, nextNode.x, nextNode.y);
                }
            });
        });
    });
    
    // Draw Nodes
    gameState.map.forEach(floor => {
        floor.forEach(node => {
            // Determine color
            if (node === gameState.currentNode) {
                p.fill(COLORS.PLAYER);
                p.stroke(255);
            } else if (node.visited) {
                p.fill(50);
                p.noStroke();
            } else {
                // Check if available
                let isAvailable = gameState.currentNode && gameState.currentNode.next.includes(node.id);
                
                switch(node.type) {
                    case 'monster': p.fill(COLORS.ENEMY); break;
                    case 'elite': p.fill(150, 0, 0); break;
                    case 'rest': p.fill(255, 100, 50); break;
                    case 'boss': p.fill(100, 0, 0); break;
                    default: p.fill(200);
                }
                
                if (isAvailable) {
                    p.stroke(COLORS.HIGHLIGHT);
                    p.strokeWeight(2);
                    // Selection Highlight
                    let available = import('./map.js').then(m => m.getNextAvailableNodes()); // Async issue in sync render? 
                    // Better: logic handles selection index
                    // Let's just highlight based on ID matching available nodes logic from input
                } else {
                    p.noStroke();
                }
            }
            
            p.circle(node.x, node.y, 30);
            
            // Icon/Text
            p.fill(255);
            p.noStroke();
            p.textSize(10);
            let label = node.type.substring(0, 1).toUpperCase();
            if (node.type === 'monster') label = 'M';
            if (node.type === 'rest') label = 'R';
            if (node.type === 'boss') label = 'B';
            p.text(label, node.x, node.y + 4);
        });
    });

    // Draw selection cursor for available nodes
    // Access selection index from GameState if we are in map phase selecting
    // NOTE: This requires fetching the available nodes list again which duplicates logic.
    // In a full implementation, `availableNodes` would be cached in gameState.
    
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.text("Choose next room (Arrows + Enter)", CANVAS_WIDTH/2, 380);
}

function renderBattleScreen(p) {
    // Message overlay
    if (gameState.combat.message) {
        p.textAlign(p.CENTER);
        p.fill(255, 255, 255, 100);
        p.textSize(30);
        p.text(gameState.combat.message, CANVAS_WIDTH/2, 100);
    }
    
    // Draw Energy
    p.fill(COLORS.ENERGY_ICON);
    p.circle(50, 320, 40);
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${gameState.combat.energy}/${gameState.player.maxEnergy}`, 50, 320);
    p.textSize(12);
    p.text("Energy", 50, 350);
    
    // Draw Cards
    const hand = gameState.combat.hand;
    const cardW = 80;
    const cardH = 120;
    const startX = 120;
    const gap = 10;
    
    hand.forEach((cardInstance, index) => {
        let x = startX + index * (cardW + gap);
        let y = 300;
        
        // Highlight selection
        if (index === gameState.combat.selectedCardIndex) {
            y -= 20; // Pop up
            p.stroke(COLORS.HIGHLIGHT);
            p.strokeWeight(3);
        } else {
            p.stroke(0);
            p.strokeWeight(1);
        }
        
        // Card BG
        const data = cardInstance.data;
        if (data.type === CARD_TYPES.ATTACK) p.fill(COLORS.CARD_ATTACK);
        else if (data.type === CARD_TYPES.SKILL) p.fill(COLORS.CARD_SKILL);
        else p.fill(COLORS.CARD_POWER);
        
        p.rect(x, y, cardW, cardH, 5);
        
        // Cost
        p.fill(COLORS.ENERGY_ICON);
        p.circle(x + 10, y + 10, 15);
        p.fill(255);
        p.textSize(10);
        p.text(data.cost, x + 10, y + 10);
        
        // Title
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.CENTER);
        p.text(data.name, x + cardW/2, y + 25);
        
        // Desc
        p.textSize(9);
        p.fill(200);
        drawTextWrapped(p, data.description, x + 5, y + 45, cardW - 10, 11);
    });
    
    // Draw End Turn Hint
    p.fill(150);
    p.textSize(12);
    p.textAlign(p.RIGHT);
    p.text("Press Z to End Turn", CANVAS_WIDTH - 20, 380);
    
    // Draw Piles count
    p.textAlign(p.LEFT);
    p.text(`Draw: ${gameState.combat.drawPile.length}`, 10, 380);
    p.text(`Discard: ${gameState.combat.discardPile.length}`, 10, 395);
}

function renderRewardScreen(p) {
    p.textAlign(p.CENTER);
    p.fill(COLORS.TEXT);
    p.textSize(32);
    p.text("Rewards", CANVAS_WIDTH/2, 80);
    
    let y = 150;
    gameState.rewards.forEach((reward, index) => {
        if (index === gameState.rewardSelectionIndex) {
            p.fill(COLORS.HIGHLIGHT);
            p.rect(CANVAS_WIDTH/2 - 100, y - 15, 200, 30);
            p.fill(0);
        } else {
            p.fill(255);
        }
        
        p.textSize(18);
        if (reward.type === 'gold') {
            p.text(`Gold: ${reward.amount}`, CANVAS_WIDTH/2, y);
        } else if (reward.type === 'card_choice') {
            p.text("Add a Card to Deck", CANVAS_WIDTH/2, y);
        }
        
        y += 50;
    });
    
    p.fill(150);
    p.textSize(14);
    p.text("Select with Arrows, Enter to Confirm", CANVAS_WIDTH/2, 350);
}

function renderCampfireScreen(p) {
    // Background image abstract
    p.fill(50, 20, 10);
    p.rect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 100, 50);
    p.circle(CANVAS_WIDTH/2, 200, 50); // Fire
    
    p.fill(255);
    p.textSize(30);
    p.text("Rest Site", CANVAS_WIDTH/2, 100);
    
    let options = gameState.campfireOptions;
    let startX = CANVAS_WIDTH/2 - (options.length * 100) / 2 + 50;
    
    options.forEach((opt, idx) => {
        let x = startX + idx * 100;
        let y = 300;
        
        if (idx === gameState.campfireSelectionIndex) {
            p.stroke(COLORS.HIGHLIGHT);
            p.strokeWeight(3);
        } else {
            p.noStroke();
        }
        
        p.fill(50);
        p.rect(x - 40, y - 20, 80, 40);
        
        p.fill(255);
        p.noStroke();
        p.textSize(14);
        p.text(opt.label, x, y);
    });
}

function renderGameOverScreen(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER);
    if (win) {
        p.fill(100, 255, 100);
        p.textSize(48);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    } else {
        p.fill(200, 50, 50);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Floor Reached: ${gameState.floor + 1}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.textSize(16);
    p.fill(150);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

function renderPausedScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}