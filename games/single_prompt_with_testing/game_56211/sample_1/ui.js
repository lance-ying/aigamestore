import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SUITS } from './globals.js';

export function drawCard(p, x, y, card, isSelected, isHovered) {
    const w = 40;
    const h = 56;
    
    p.push();
    p.translate(x, y);
    
    // Selection Bounce
    if (isSelected) {
        p.translate(0, -10);
    }
    
    // Hover effect
    if (isHovered && !isSelected) {
        p.translate(0, -5);
    }
    
    // Card Body
    p.fill(240);
    p.stroke(0);
    p.rectMode(p.CENTER);
    p.rect(0, 0, w, h, 4);
    
    if (isSelected) {
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(3);
        p.rect(0, 0, w + 4, h + 4, 6);
    }
    
    // Draw Suit and Rank
    const isRed = (card.suit === 'Hearts' || card.suit === 'Diamonds');
    p.fill(isRed ? p.color(200, 40, 40) : p.color(20, 20, 20));
    p.noStroke();
    
    // Rank Top Left
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(card.rank, -w/2 + 4, -h/2 + 4);
    
    // Suit Center
    p.push();
    p.translate(0, 5);
    drawSuit(p, 0, 0, card.suit, 15);
    p.pop();
    
    // Rank Bottom Right (Upside down)
    p.push();
    p.rotate(p.PI);
    p.text(card.rank, -w/2 + 4, -h/2 + 4);
    p.pop();
    
    p.pop();
}

function drawSuit(p, x, y, suit, size) {
    p.push();
    p.translate(x, y);
    p.scale(size / 10); // Base size approx 10
    
    if (suit === 'Hearts') {
        p.beginShape();
        p.vertex(0, 3);
        p.bezierVertex(-4, -3, -5, -6, 0, -8);
        p.bezierVertex(5, -6, 4, -3, 0, 3);
        p.endShape();
    } else if (suit === 'Diamonds') {
        p.quad(0, -8, 5, 0, 0, 8, -5, 0);
    } else if (suit === 'Spades') {
        p.beginShape();
        p.vertex(0, -8);
        p.bezierVertex(5, -4, 5, 2, 0, 2);
        p.bezierVertex(-5, 2, -5, -4, 0, -8);
        p.endShape();
        p.triangle(0, 0, 1, 6, -1, 6); // Stem
    } else if (suit === 'Clubs') {
        p.circle(-3, 1, 5);
        p.circle(3, 1, 5);
        p.circle(0, -4, 5);
        p.triangle(0, 0, 1, 6, -1, 6); // Stem
    }
    
    p.pop();
}

export function drawJoker(p, x, y, joker, isHovered) {
    const w = 40;
    const h = 56;
    
    p.push();
    p.translate(x, y);
    
    if (isHovered) {
        p.translate(0, -5);
        p.noFill();
        p.stroke(255, 200, 0);
        p.strokeWeight(3);
        p.rectMode(p.CENTER);
        p.rect(0, 0, w + 4, h + 4, 6);
    }
    
    p.fill(80, 40, 100); // Purple base for joker
    p.stroke(0);
    p.strokeWeight(1);
    p.rectMode(p.CENTER);
    p.rect(0, 0, w, h, 4);
    
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("JOKER", 0, -15);
    
    // Name abbreviation
    const abbr = joker.name.split(' ').map(w => w[0]).join('');
    p.textSize(16);
    p.text(abbr, 0, 5);
    
    p.pop();
}

export function renderHUD(p) {
    // Top Bar
    p.fill(40, 40, 40);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Left: Score
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(`Score: ${gameState.currentScore}`, 10, 20);
    
    p.fill(200, 50, 50);
    p.text(`Goal: ${gameState.targetScore}`, 150, 20);
    
    // Center: Ante/Round
    p.fill(255, 200, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`Ante: ${gameState.ante} - Round: ${gameState.round}`, CANVAS_WIDTH / 2, 20);
    
    // Right: Money
    p.fill(100, 255, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`$${gameState.money}`, CANVAS_WIDTH - 10, 20);
    
    // Stats Box
    p.fill(30, 30, 40);
    p.stroke(60);
    p.rect(10, 50, 120, 80);
    p.noStroke();
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Hands: ${gameState.handsLeft}`, 20, 60);
    p.text(`Discards: ${gameState.discardsLeft}`, 20, 85);
    
    // Controls Hint
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(10);
    p.fill(150);
    p.text("ARROWS: Move | SPACE: Select | UP: Play | DOWN: Discard", CANVAS_WIDTH - 5, CANVAS_HEIGHT - 5);
}

export function renderShop(p) {
    p.background(20, 15, 30);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(32);
    p.text("SHOP", CANVAS_WIDTH / 2, 20);
    
    p.textSize(20);
    p.fill(100, 255, 100);
    p.text(`Money: $${gameState.money}`, CANVAS_WIDTH / 2, 60);
    
    // Draw Shop Items
    const startX = CANVAS_WIDTH / 2 - ((gameState.shopItems.length - 1) * 70) / 2;
    
    for (let i = 0; i < gameState.shopItems.length; i++) {
        const item = gameState.shopItems[i];
        const x = startX + i * 70;
        const y = 200;
        const isSelected = (gameState.selectedIndex === i);
        
        drawJoker(p, x, y, item, isSelected);
        
        // Price tag
        p.fill(255);
        p.noStroke();
        p.textSize(14);
        p.textAlign(p.CENTER);
        p.text(`$${item.cost}`, x, y + 40);
    }
    
    // Render held jokers
    renderJokers(p);
    
    // Description Box
    if (gameState.shopItems.length > 0) {
        const selected = gameState.shopItems[gameState.selectedIndex];
        if (selected) {
            p.fill(40, 40, 50);
            p.stroke(100);
            p.rectMode(p.CENTER);
            p.rect(CANVAS_WIDTH / 2, 300, 300, 60);
            
            p.fill(255);
            p.noStroke();
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text(selected.name, CANVAS_WIDTH / 2, 285);
            p.textSize(12);
            p.fill(200);
            p.text(selected.description, CANVAS_WIDTH / 2, 310);
        }
    }
    
    // Next Round Button
    const isNextSelected = (gameState.selectedIndex === gameState.shopItems.length);
    p.push();
    p.translate(CANVAS_WIDTH / 2, 360);
    if (isNextSelected) p.scale(1.1);
    p.fill(isNextSelected ? [200, 50, 50] : [150, 30, 30]);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 120, 40, 5);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("Next Round", 0, 0);
    p.pop();
}

export function renderJokers(p) {
    // Draw owned jokers at top center
    const jokerStartX = CANVAS_WIDTH / 2 - ((gameState.jokers.length - 1) * 50) / 2;
    
    for (let i = 0; i < gameState.jokers.length; i++) {
        drawJoker(p, jokerStartX + i * 50, 80, gameState.jokers[i], false);
    }
}

export function renderHand(p) {
    const cardSpacing = 45;
    const handWidth = (gameState.hand.length - 1) * cardSpacing;
    const startX = CANVAS_WIDTH / 2 - handWidth / 2;
    const y = CANVAS_HEIGHT - 60;
    
    for (let i = 0; i < gameState.hand.length; i++) {
        const card = gameState.hand[i];
        const x = startX + i * cardSpacing;
        const isHovered = (i === gameState.selectedIndex);
        
        drawCard(p, x, y, card, card.isSelected, isHovered);
    }
}