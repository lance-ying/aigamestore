/**
 * Level data and generation.
 */
import { gameState, LEVEL_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { PowerUp } from './entities.js';

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

export class Hazard {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

export function generateLevel() {
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.entities = gameState.entities.filter(e => e.constructor.name === "Runner"); // Keep players
    
    // Create a 3200px wide looping track
    // Floor
    addPlatform(0, 350, 800, 50);
    addPlatform(900, 300, 500, 50); // Step up
    addPlatform(1500, 350, 400, 50); // Lower
    
    // Walls and ceilings
    addPlatform(600, 200, 200, 20); // Floating platform
    addPlatform(800, 100, 20, 200); // Vertical Wall
    
    // Big Gap with ceiling grapple
    addPlatform(2000, 350, 200, 50);
    addPlatform(2400, 300, 200, 50);
    addPlatform(2100, 50, 400, 20); // Ceiling for grappling
    
    // Spikes
    addHazard(1400, 340, 100, 40); // Between floors
    addHazard(2200, 380, 200, 20); // Pit spikes
    
    // End loop transition
    addPlatform(2800, 350, 400, 50);
    
    // Powerups
    gameState.entities.push(new PowerUp(650, 150));
    gameState.entities.push(new PowerUp(2100, 200));
}

function addPlatform(x, y, w, h) {
    gameState.platforms.push(new Platform(x, y, w, h));
}

function addHazard(x, y, w, h) {
    gameState.hazards.push(new Hazard(x, y, w, h));
}

export function renderLevel(p) {
    // We need to render platforms multiple times for the loop illusion 
    // if the camera sees the seam.
    
    const camX = gameState.cameraX;
    
    // Calculate visible loops
    // E.g., if camera is at 3100, we see end of Loop 0 and start of Loop 1.
    
    // Render Platforms
    p.fill(COLORS.platforms);
    p.noStroke();
    
    // Draw logic: Draw normal, then draw offset -LEVEL_WIDTH and +LEVEL_WIDTH
    // Just draw 3 copies always? Efficient enough for < 50 platforms.
    
    [-1, 0, 1].forEach(loop => {
        const offset = loop * LEVEL_WIDTH;
        
        // Optimization: Check bounds
        if (offset + LEVEL_WIDTH < camX || offset > camX + 600) return; // Crude culling
        
        p.push();
        p.translate(offset - camX, -gameState.cameraY);
        
        gameState.platforms.forEach(plat => {
             // Simple culling
             if (plat.x + plat.width + offset < camX || plat.x + offset > camX + 600) {
                 // return; // Logic is tricky with translate. Just draw.
             }
             p.rect(plat.x, plat.y, plat.width, plat.height);
             
             // Tech details
             p.stroke(60, 70, 90);
             p.line(plat.x, plat.y, plat.x + plat.width, plat.y);
             p.line(plat.x, plat.y + plat.height, plat.x + plat.width, plat.y + plat.height);
             p.noStroke();
        });
        
        // Draw Hazards
        p.fill(COLORS.spikes);
        gameState.hazards.forEach(haz => {
             p.triangle(
                 haz.x, haz.y + haz.height,
                 haz.x + haz.width/2, haz.y,
                 haz.x + haz.width, haz.y + haz.height
             );
        });
        
        p.pop();
    });
}