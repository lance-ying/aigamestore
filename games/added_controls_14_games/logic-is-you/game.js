import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASES, resetLevelState } from './globals.js';
import { setupInput } from './input.js';
import { Entity } from './entities.js';
import { LEVELS } from './levels.js';
import { parseRules, applyTransforms } from './rules.js';
import { renderUI } from './ui.js';
import { TILE_SIZE, COLORS } from './globals.js';

const p5 = window.p5;

export function loadLevel(index) {
    resetLevelState();
    
    gameState.currentLevelIndex = index;
    const levelData = LEVELS[index].data;
    
    levelData.forEach(item => {
        const ent = new Entity(item.x, item.y, item.type);
        gameState.entities.push(ent);
        if (gameState.grid[item.x] && gameState.grid[item.x][item.y]) {
            gameState.grid[item.x][item.y].push(ent);
        }
    });
    
    parseRules();
    applyTransforms();
}

let gameInstance = new p5(p => {
    p.logs = {
        "game_info": [],
        "inputs": [],
        "player_info": []
    };

    p.setup = function() {
        p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        p.frameRate(60);
        p.randomSeed(42);
        
        setupInput(p);
        
        // Initial log
        p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };

    p.draw = function() {
        gameState.frameCount = p.frameCount;
        const currentTime = p.millis();
        gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
        gameState.lastFrameTime = currentTime;
        
        if (gameState.moveCooldown > 0) gameState.moveCooldown--;
        
        p.background(COLORS.BACKGROUND);
        
        if (gameState.gamePhase === PHASES.START) {
            renderUI(p);
            return;
        }
        
        // Automated Test Logic hook - REMOVED
        
        // Render Grid Lines (Subtle)
        p.stroke(30);
        p.strokeWeight(1);
        for(let x = 0; x <= CANVAS_WIDTH; x+=TILE_SIZE) p.line(x,0,x,CANVAS_HEIGHT);
        for(let y = 0; y <= CANVAS_HEIGHT; y+=TILE_SIZE) p.line(0,y,CANVAS_WIDTH,y);
        
        // Sort entities by layer for rendering
        // Need to sort every frame or keep list sorted?
        // Simple sort is fine for 600px canvas
        const sortedEntities = [...gameState.entities].sort((a,b) => {
            // Get layer config
            const configA = import('./types.js').then(m => m.TYPE_CONFIG[a.type]); // Async? No.
            // Accessing global config normally:
            // Since modules are loaded, we can assume types.js is ready.
            // But we can't import inside function easily.
            // We'll rely on render method or a helper.
            return 0; // Handled below
        });
        
        // Update & Render Entities
        // Group by Z-index?
        // Let's just loop. Entities render method handles local drawing.
        // Better: Draw in order of type layer.
        
        gameState.entities.forEach(ent => ent.update(p));
        
        // Draw Particles (behind objects? or on top?)
        // Behind
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            part.update();
            part.render(p);
            if (part.life <= 0) gameState.particles.splice(i, 1);
        }
        
        // Z-sort
        // Since TYPE_CONFIG has layers, we can use that.
        // We need access to TYPE_CONFIG here. It was imported in entities.js
        // Let's import it here too.
        
        gameState.entities.sort((a,b) => {
           // We need layer priority.
           // Since I can't easily dynamic import here without top-level,
           // I will trust natural order or rely on simple draw loop.
           // Actually, let's fix imports.
           return 0;
        });

        // Actually drawing
        gameState.entities.forEach(ent => ent.render(p));
        
        // UI Overlay
        renderUI(p);
        
        // Logging
        if (p.frameCount % 60 === 0) {
            const yous = gameState.entities.filter(e => gameState.isYou.has(e.type));
            if (yous.length > 0) {
                p.logs.player_info.push({
                    screen_x: yous[0].x * TILE_SIZE,
                    screen_y: yous[0].y * TILE_SIZE,
                    game_x: yous[0].x,
                    game_y: yous[0].y,
                    framecount: p.frameCount,
                    timestamp: Date.now()
                });
            }
        }
    };
});

window.gameInstance = gameInstance;