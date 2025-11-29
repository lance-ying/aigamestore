import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';
import { LEVELS } from './levels.js';

export function renderLevelSelect(p) {
    p.background(COLORS.BACKGROUND);
    
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("SELECT LEVEL", CANVAS_WIDTH/2, 40);
    
    // Draw level boxes
    const cols = 3;
    const boxWidth = 150;
    const boxHeight = 100;
    const spacing = 20;
    const startX = (CANVAS_WIDTH - (cols * boxWidth + (cols - 1) * spacing)) / 2;
    const startY = 100;
    
    for (let i = 0; i < LEVELS.length; i++) {
        const level = LEVELS[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxWidth + spacing);
        const y = startY + row * (boxHeight + spacing);
        
        // Box background
        const isHovered = p.mouseX >= x && p.mouseX <= x + boxWidth &&
                          p.mouseY >= y && p.mouseY <= y + boxHeight;
        
        p.fill(isHovered ? 60 : 40);
        p.stroke(isHovered ? 100 : 60);
        p.strokeWeight(2);
        p.rect(x, y, boxWidth, boxHeight, 5);
        
        // Level info
        p.fill(255);
        p.noStroke();
        p.textSize(14);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Level ${i + 1}`, x + boxWidth/2, y + 10);
        
        p.textSize(12);
        p.fill(200);
        p.text(level.name, x + boxWidth/2, y + 30);
        
        // Difficulty color
        let diffColor;
        if (level.difficulty === "Easy") diffColor = p.color(0, 200, 0);
        else if (level.difficulty === "Medium") diffColor = p.color(255, 165, 0);
        else diffColor = p.color(255, 0, 0);
        
        p.fill(diffColor);
        p.textSize(11);
        p.text(level.difficulty, x + boxWidth/2, y + 50);
        
        p.fill(150);
        p.textSize(10);
        p.text(`${level.worldWidth}x${level.worldHeight}`, x + boxWidth/2, y + 68);
        p.text(`${level.bots.length} enemies`, x + boxWidth/2, y + 82);
    }
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER, p.CENTER);
    
    const level = LEVELS[gameState.currentLevel];
    
    p.textSize(40);
    p.text(level.name, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 80);
    
    p.textSize(16);
    let diffColor;
    if (level.difficulty === "Easy") diffColor = p.color(0, 200, 0);
    else if (level.difficulty === "Medium") diffColor = p.color(255, 165, 0);
    else diffColor = p.color(255, 0, 0);
    p.fill(diffColor);
    p.text(`Difficulty: ${level.difficulty}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.fill(255);
    p.textSize(14);
    p.text(`World Size: ${level.worldWidth} x ${level.worldHeight}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 25);
    p.text(`Enemies: ${level.bots.length}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 5);
    p.text(`Win at ${level.winCondition}% territory`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 15);
    
    p.textSize(12);
    p.fill(180);
    p.text("Arrows: Steer  |  Space: Boost", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    if (p.frameCount % 60 < 30) {
        p.fill(255, 255, 0);
        p.textSize(16);
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 90);
    }
    
    p.fill(150);
    p.textSize(10);
    p.text("ESC: Back to level select", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
}

export function renderHUD(p) {
    const level = LEVELS[gameState.currentLevel];
    
    p.fill(255);
    p.noStroke();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Level ${gameState.currentLevel + 1}: ${level.name}`, 10, 10);
    p.text(`Territory: ${gameState.score}% / ${level.winCondition}%`, 10, 28);
    
    // Leaderboard
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(11);
    p.text("LEADERBOARD", CANVAS_WIDTH - 10, 10);
    
    const sorted = [
        {name: "YOU", score: gameState.score, color: COLORS.PLAYER},
        ...gameState.enemies.map((e, i) => ({
            name: `BOT ${i+1}`, 
            score: gameState.worldGrid ? gameState.worldGrid.getScore(e.id) : 0, 
            color: e.color
        }))
    ].sort((a, b) => b.score - a.score);

    for (let i = 0; i < sorted.length; i++) {
        p.fill(sorted[i].color);
        p.text(`${sorted[i].name}: ${sorted[i].score}%`, CANVAS_WIDTH - 10, 26 + i * 14);
    }
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 255, 0);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        
        p.fill(255);
        p.textSize(18);
        p.text(`Final Territory: ${gameState.score}%`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        
        if (gameState.currentLevel < LEVELS.length - 1) {
            p.textSize(14);
            p.text("Press N for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
        } else {
            p.textSize(16);
            p.fill(255, 215, 0);
            p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
        }
        
        p.fill(200);
        p.textSize(12);
        p.text("R: Restart  |  ESC: Level Select", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    } else {
        p.fill(255, 0, 0);
        p.text("ELIMINATED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        
        p.fill(255);
        p.textSize(16);
        p.text(`Territory: ${gameState.score}%`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        p.textSize(12);
        p.text("R: Restart  |  ESC: Level Select", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    }
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}