// ui.js - UI rendering for different game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, ZONES } from './globals.js';

// ============================================================================
// START SCREEN
// ============================================================================

export function renderStartScreen(p) {
    p.background(135, 206, 235); // Sky blue
    
    // Draw decorative elements
    drawClouds(p);
    drawGrass(p, 0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Title
    p.fill(255);
    p.stroke(60, 60, 60);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('GOOSE CHAOS', CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.noStroke();
    p.fill(80, 80, 80);
    p.textSize(20);
    p.text("It's a lovely day in the village...", CANVAS_WIDTH / 2, 130);
    p.text("and you are a horrible goose!", CANVAS_WIDTH / 2, 155);
    
    // Instructions box
    p.fill(255, 255, 255, 230);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2 - 200, 190, 400, 160, 10);
    
    // Instructions
    p.noStroke();
    p.fill(60);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const instructions = [
        "Arrow Keys - Move the goose",
        "SPACE - HONK!",
        "SHIFT - Sprint (uses stamina)",
        "Z - Grab/Drop items",
        "",
        "Complete all tasks to win!"
    ];
    
    let yOffset = 200;
    instructions.forEach(line => {
        p.text(line, CANVAS_WIDTH / 2 - 180, yOffset);
        yOffset += 24;
    });
    
    // Start prompt
    p.fill(255);
    p.stroke(80, 150, 60);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    const pulse = Math.sin(gameState.frameCount * 0.1) * 10 + 245;
    p.fill(pulse, pulse, 100);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

// ============================================================================
// PLAYING SCREEN - HUD
// ============================================================================

export function renderHUD(p) {
    // Task list panel
    renderTaskList(p);
    
    // Score
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Minimap
    renderMinimap(p);
}

function renderTaskList(p) {
    const panelX = CANVAS_WIDTH - 210;
    const panelY = 10;
    const panelWidth = 200;
    const panelHeight = Math.min(200, 40 + gameState.tasks.length * 25);
    
    // Panel background
    p.fill(255, 255, 255, 230);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(panelX, panelY, panelWidth, panelHeight, 5);
    
    // Title
    p.noStroke();
    p.fill(80, 80, 80);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text('TO-DO LIST', panelX + 10, panelY + 10);
    
    // Tasks
    p.textSize(12);
    let yOffset = panelY + 35;
    
    gameState.tasks.forEach(task => {
        const checkColor = task.completed ? COLORS.UI_COMPLETE : [200, 200, 200];
        
        // Checkbox
        p.stroke(100);
        p.strokeWeight(2);
        p.fill(...checkColor);
        p.rect(panelX + 10, yOffset, 15, 15, 2);
        
        // Checkmark if completed
        if (task.completed) {
            p.stroke(60, 150, 60);
            p.strokeWeight(3);
            p.line(panelX + 12, yOffset + 7, panelX + 16, yOffset + 11);
            p.line(panelX + 16, yOffset + 11, panelX + 23, yOffset + 4);
        }
        
        // Task description
        p.noStroke();
        p.fill(task.completed ? 120 : 60);
        p.textAlign(p.LEFT, p.TOP);
        const taskText = task.description;
        p.text(taskText.substring(0, 25), panelX + 30, yOffset + 2);
        
        yOffset += 25;
    });
}

function renderMinimap(p) {
    const minimapWidth = 120;
    const minimapHeight = 80;
    const minimapX = 10;
    const minimapY = CANVAS_HEIGHT - minimapHeight - 10;
    
    // Background
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(minimapX, minimapY, minimapWidth, minimapHeight);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(minimapX, minimapY, minimapWidth, minimapHeight);
    
    // Scale factor
    const scaleX = minimapWidth / gameState.worldWidth;
    const scaleY = minimapHeight / gameState.worldHeight;
    
    // Draw zones
    p.noStroke();
    for (const zone of Object.values(ZONES)) {
        p.fill(60, 120, 60, 100);
        p.rect(
            minimapX + zone.x * scaleX,
            minimapY + zone.y * scaleY,
            zone.width * scaleX,
            zone.height * scaleY
        );
    }
    
    // Draw player
    if (gameState.player) {
        p.fill(255, 255, 0);
        p.circle(
            minimapX + gameState.player.x * scaleX,
            minimapY + gameState.player.y * scaleY,
            4
        );
    }
    
    // Draw villagers
    gameState.villagers.forEach(villager => {
        const color = villager.state === 'chase' ? [255, 0, 0] : [100, 100, 255];
        p.fill(...color);
        p.circle(
            minimapX + villager.x * scaleX,
            minimapY + villager.y * scaleY,
            3
        );
    });
    
    // Draw camera view
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(1);
    p.rect(
        minimapX + gameState.cameraX * scaleX,
        minimapY + gameState.cameraY * scaleY,
        CANVAS_WIDTH * scaleX,
        CANVAS_HEIGHT * scaleY
    );
}

// ============================================================================
// PAUSED SCREEN
// ============================================================================

export function renderPausedOverlay(p) {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Paused text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    
    p.textSize(20);
    p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

// ============================================================================
// GAME OVER SCREEN
// ============================================================================

export function renderGameOver(p) {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    // Result text
    p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text(isWin ? 'MISSION COMPLETE!' : 'CAUGHT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    // Message
    p.fill(255);
    p.textSize(24);
    if (isWin) {
        p.text('You successfully pranked the village!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    } else {
        p.text('The villagers caught you!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    }
    
    // Score
    p.textSize(28);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    // Stats
    p.textSize(18);
    p.text(`Tasks Completed: ${gameState.tasksCompleted}/${gameState.totalTasks}`, 
           CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(22);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}

// ============================================================================
// DECORATIVE ELEMENTS
// ============================================================================

function drawClouds(p) {
    p.noStroke();
    p.fill(255, 255, 255, 200);
    
    const clouds = [
        { x: 100, y: 50, size: 40 },
        { x: 300, y: 70, size: 50 },
        { x: 500, y: 40, size: 45 }
    ];
    
    clouds.forEach(cloud => {
        p.circle(cloud.x, cloud.y, cloud.size);
        p.circle(cloud.x + 20, cloud.y, cloud.size * 0.8);
        p.circle(cloud.x + 40, cloud.y, cloud.size * 0.6);
        p.circle(cloud.x + 20, cloud.y - 15, cloud.size * 0.7);
    });
}

function drawGrass(p, x, y, width, height) {
    // Base grass
    p.fill(...COLORS.GRASS);
    p.noStroke();
    p.rect(x, y, width, height);
    
    // Grass details
    p.stroke(...COLORS.GRASS_DARK);
    p.strokeWeight(2);
    for (let i = 0; i < width; i += 10) {
        const grassY = y + Math.sin(i * 0.1) * 5;
        p.line(i, grassY, i, grassY + 8);
    }
}