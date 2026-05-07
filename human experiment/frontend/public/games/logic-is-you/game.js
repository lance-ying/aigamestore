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
        
        // Freeze movement cooldown if paused
        if (gameState.gamePhase !== PHASES.PAUSED && gameState.moveCooldown > 0) {
            gameState.moveCooldown--;
        }
        
        p.background(COLORS.BACKGROUND);
        
        if (gameState.gamePhase === PHASES.START) {
            renderUI(p);
            return;
        }
        
        // Render Grid Lines (Subtle)
        p.stroke(30);
        p.strokeWeight(1);
        for(let x = 0; x <= CANVAS_WIDTH; x+=TILE_SIZE) p.line(x,0,x,CANVAS_HEIGHT);
        for(let y = 0; y <= CANVAS_HEIGHT; y+=TILE_SIZE) p.line(0,y,CANVAS_WIDTH,y);
        
        // Update Entities (only if not paused)
        if (gameState.gamePhase !== PHASES.PAUSED) {
            gameState.entities.forEach(ent => ent.update(p));
        }
        
        // Update & Render Particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const part = gameState.particles[i];
            // Freeze particle movement if paused
            if (gameState.gamePhase !== PHASES.PAUSED) {
                part.update();
            }
            part.render(p);
            if (part.life <= 0) gameState.particles.splice(i, 1);
        }
        
        // Z-sort (Natural order preserved as per existing architecture)
        gameState.entities.sort((a,b) => 0);

        // Rendering entities always happens to show the frozen state
        gameState.entities.forEach(ent => ent.render(p));
        
        // UI Overlay (Pause overlay removed in ui.js)
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