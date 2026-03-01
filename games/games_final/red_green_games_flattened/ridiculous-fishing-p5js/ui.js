import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONSTANTS } from './globals.js';
import { KEYS } from './input.js';

export function renderUI(p) {
    p.push();
    
    // HUD - Money & Depth
    if (gameState.gamePhase === "PLAYING") {
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(20);
        p.fill(255, 215, 0); // Gold
        p.text(`$${gameState.money}`, 10, 10);

        // Score Component
        p.fill(255);
        p.textSize(16);
        p.text(`Score: ${gameState.score}`, 10, 35);

        if (gameState.subPhase === "DESCENT" || gameState.subPhase === "ASCENT") {
            p.textAlign(p.RIGHT, p.TOP);
            p.fill(255);
            p.text(`${Math.floor(gameState.depth)}m`, CANVAS_WIDTH - 10, 10);
        }
    }

    // Subphase specific UIs
    if (gameState.subPhase === "SHOP") {
        renderShop(p);
    } else if (gameState.subPhase === "SUMMARY") {
        renderSummary(p);
    }

    p.pop();
}

function renderShop(p) {
    // Semi-transparent bg
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.textAlign(p.CENTER, p.TOP);
    p.fill(255);
    p.textSize(32);
    p.text("THE FISHING SHOP", CANVAS_WIDTH/2, 40);

    p.textSize(16);
    p.text(`Current Balance: $${gameState.money}`, CANVAS_WIDTH/2, 80);

    // Shop Items
    const items = [
        { name: "Line Length", level: gameState.lineLengthLevel, price: CONSTANTS.SHOP_PRICES.LINE * gameState.lineLengthLevel, key: "1" },
        { name: "Gun Power", level: gameState.gunLevel, price: CONSTANTS.SHOP_PRICES.GUN * gameState.gunLevel, key: "2" },
        { name: "Lure Speed", level: gameState.lureSpeedLevel, price: CONSTANTS.SHOP_PRICES.LURE * gameState.lureSpeedLevel, key: "3" }
    ];

    let startY = 140;
    items.forEach((item, index) => {
        const isSelected = gameState.shopSelection === index;
        
        // Selection Box
        if (isSelected) {
            p.stroke(0, 255, 255);
            p.strokeWeight(2);
            p.fill(255, 255, 255, 30);
        } else {
            p.noStroke();
            p.fill(50);
        }
        
        p.rect(100, startY + index * 60, CANVAS_WIDTH - 200, 50, 5);
        
        // Text
        p.noStroke();
        p.fill(255);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(`${item.name} (Lvl ${item.level})`, 120, startY + index * 60 + 25);
        
        p.textAlign(p.RIGHT, p.CENTER);
        p.fill(gameState.money >= item.price ? 100 : 255, gameState.money >= item.price ? 255 : 100, 100);
        p.text(`$${item.price}`, CANVAS_WIDTH - 120, startY + index * 60 + 25);
    });

    p.textAlign(p.CENTER, p.BOTTOM);
    p.fill(200);
    p.textSize(14);
    p.text("ARROWS to Select | Z to Buy | ENTER to Cast", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

function renderSummary(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("FISHING COMPLETE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.textSize(16);
    p.text("Press ENTER to return to Shop", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
}

export function renderStartScreen(p) {
    p.background(0, 100, 150);
    
    // Simple waves
    p.fill(0, 80, 130);
    p.noStroke();
    p.rect(0, CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT/2);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(48);
    p.text("RIDICULOUS FISHING", CANVAS_WIDTH/2, 120);
    p.textSize(24);
    p.text("A Tale of Redemption", CANVAS_WIDTH/2, 160);
    
    p.textSize(16);
    p.fill(200);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, 300);
    
    // Draw a decorative fish
    p.fill(255, 100, 50);
    p.ellipse(CANVAS_WIDTH/2, 220, 60, 40);
    p.triangle(CANVAS_WIDTH/2 - 30, 220, CANVAS_WIDTH/2 - 50, 210, CANVAS_WIDTH/2 - 50, 230);
}