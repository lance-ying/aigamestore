// ui.js
import { 
    gameState, PLANT_TYPES, PLANT_KEYS, 
    CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRID_OFFSET_X, GRID_OFFSET_Y, 
    CELL_WIDTH, CELL_HEIGHT, GRID_COLS, GRID_ROWS, COLORS 
} from './globals.js';

export function renderBackground(p) {
    p.background(COLORS.BG);
    
    // Draw Lawn Grid
    for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const x = GRID_OFFSET_X + c * CELL_WIDTH;
            const y = GRID_OFFSET_Y + r * CELL_HEIGHT;
            
            // Checkerboard pattern
            if ((c + r) % 2 === 0) {
                p.fill(COLORS.LAWN_LIGHT);
            } else {
                p.fill(COLORS.LAWN_DARK);
            }
            p.noStroke();
            p.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
        }
    }
    
    // Lane lines (subtle)
    p.stroke(0, 30);
    p.strokeWeight(2);
    for (let r = 0; r <= GRID_ROWS; r++) {
        const y = GRID_OFFSET_Y + r * CELL_HEIGHT;
        p.line(GRID_OFFSET_X, y, GRID_OFFSET_X + GRID_COLS * CELL_WIDTH, y);
    }
}

export function renderHUD(p) {
    // Top Bar Background
    p.fill(COLORS.HUD_BG);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, GRID_OFFSET_Y - 10);
    
    // Sun Counter
    p.fill(COLORS.HUD_BORDER);
    p.rect(10, 5, 80, 40, 5);
    p.fill(COLORS.ACCENT);
    p.noStroke();
    p.circle(30, 25, 25); // Sun Icon
    p.fill(0);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(Math.floor(gameState.sun), 50, 25);
    
    // Plant Cards
    const cardWidth = 60;
    const cardHeight = 45;
    const startX = 110;
    
    PLANT_KEYS.forEach((key, index) => {
        const type = PLANT_TYPES[key];
        const x = startX + index * (cardWidth + 10);
        const y = 5;
        
        // Selection highlight
        if (index === gameState.selectedPlantIndex) {
            p.stroke(255); // White border for selected
            p.strokeWeight(3);
        } else {
            p.stroke(0);
            p.strokeWeight(1);
        }
        
        // Card BG
        // Check affordability
        if (gameState.sun >= type.cost) {
            p.fill(200); 
        } else {
            p.fill(150, 100, 100); // Reddish tint if expensive
        }
        p.rect(x, y, cardWidth, cardHeight, 4);
        
        // Plant Icon (Simple text or shape)
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.noStroke();
        p.text(type.icon, x + cardWidth/2, y + cardHeight/2 - 5);
        
        // Cost
        p.textSize(10);
        p.fill(0);
        p.text(type.cost, x + cardWidth/2, y + cardHeight - 8);
        
        // Cooldown Overlay
        const cd = gameState.plantCooldowns[key];
        if (cd > 0) {
            const maxCd = type.cooldown;
            const ratio = cd / maxCd;
            p.fill(0, 0, 0, 150);
            p.rect(x, y + cardHeight * (1-ratio), cardWidth, cardHeight * ratio);
        }
    });
    
    // Wave Progress
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    p.text(`Wave: ${gameState.currentWave}/${gameState.totalWaves}`, CANVAS_WIDTH - 20, 25);
}

export function renderCursor(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const { col, row } = gameState.cursor;
    const x = GRID_OFFSET_X + col * CELL_WIDTH;
    const y = GRID_OFFSET_Y + row * CELL_HEIGHT;
    
    // Pulsing alpha
    const alpha = 100 + p.sin(p.frameCount * 0.1) * 50;
    
    p.noFill();
    p.stroke(255, alpha);
    p.strokeWeight(4);
    p.rect(x, y, CELL_WIDTH, CELL_HEIGHT);
    
    // Crosshair markers
    p.line(x + CELL_WIDTH/2 - 5, y + CELL_HEIGHT/2, x + CELL_WIDTH/2 + 5, y + CELL_HEIGHT/2);
    p.line(x + CELL_WIDTH/2, y + CELL_HEIGHT/2 - 5, x + CELL_WIDTH/2, y + CELL_HEIGHT/2 + 5);
}

export function renderStartScreen(p) {
    p.background(0, 0, 0, 200);
    p.fill(COLORS.LAWN_LIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GARDEN DEFENDERS", CANVAS_WIDTH/2, 100);
    p.textSize(24);
    p.fill(255);
    p.text("Pixel Patch", CANVAS_WIDTH/2, 140);
    
    p.textSize(18);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, 250);
    
    p.textSize(14);
    p.fill(200);
    p.text("ARROWS to Move | SPACE to Plant/Collect", CANVAS_WIDTH/2, 300);
    p.text("Z to Switch Plants | SHIFT+SPACE to Dig", CANVAS_WIDTH/2, 320);
}

export function renderGameOver(p, win) {
    p.background(0, 0, 0, 220);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (win) {
        p.fill(COLORS.ACCENT);
        p.textSize(48);
        p.text("VICTORY!", CANVAS_WIDTH/2, 150);
        p.textSize(24);
        p.fill(255);
        p.text("The lawn is safe... for now.", CANVAS_WIDTH/2, 200);
    } else {
        p.fill(COLORS.DANGER);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
        p.textSize(24);
        p.fill(255);
        p.text("The zombies ate your brains!", CANVAS_WIDTH/2, 200);
    }
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 300);
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}