import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Enemy } from './entities.js';

export class Tile {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.x = gridX * TILE_SIZE;
        this.y = gridY * TILE_SIZE;
        this.isActive = false;
        this.animProgress = 0;
        
        // Visual variation
        const seed = Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453;
        this.variant = Math.abs(seed - Math.floor(seed));
    }
    
    update(playerX, playerY) {
        // Activate if close to player
        const dist = Math.sqrt((this.x - playerX)**2 + (this.y - playerY)**2);
        if (dist < 300 && !this.isActive) {
            this.isActive = true;
        }
        
        if (this.isActive && this.animProgress < 1) {
            this.animProgress += 0.05;
            if (this.animProgress > 1) this.animProgress = 1;
        }
    }
    
    containsPoint(px, py) {
        // Simple AABB for the rotated quad/rect
        const half = TILE_SIZE / 2;
        return (px >= this.x - half && px <= this.x + half &&
                py >= this.y - half && py <= this.y + half);
    }
    
    render(p) {
        if (!this.isActive) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        // Fall-in animation: start high and small, land normal
        const anim = this.animProgress;
        // Ease out elastic or just overshoot
        const yOffset = (1 - anim) * -200;
        const scale = anim;
        
        p.translate(0, yOffset);
        p.scale(scale);
        
        // Draw isometric-ish tile (it's actually flat in logic, but we draw it pretty)
        // Base color
        p.noStroke();
        if (this.variant > 0.8) p.fill(100, 150, 100); // Grass
        else if (this.variant > 0.5) p.fill(120, 140, 120);
        else p.fill(130, 130, 130); // Stone
        
        p.rectMode(p.CENTER);
        p.rect(0, 0, TILE_SIZE - 2, TILE_SIZE - 2);
        
        // Top highlight
        p.fill(255, 255, 255, 30);
        p.rect(0, 0, TILE_SIZE - 6, TILE_SIZE - 6);
        
        p.pop();
    }
}

export function generateWorld(seed) {
    gameState.tiles.clear();
    gameState.enemies = [];
    
    // Generate a winding path
    let cx = 0;
    let cy = 0;
    const pathLength = 60;
    
    const addTile = (x, y) => {
        const key = `${x},${y}`;
        if (!gameState.tiles.has(key)) {
            gameState.tiles.set(key, new Tile(x, y));
            
            // Random enemy spawn
            if (Math.random() < 0.1 && (Math.abs(x) > 5 || Math.abs(y) > 5)) {
                const type = Math.random() < 0.7 ? 'scumbag' : 'windbag';
                gameState.enemies.push(new Enemy(x * TILE_SIZE, y * TILE_SIZE, type));
            }
        }
    };
    
    // Start area
    for(let i=-2; i<=2; i++) {
        for(let j=-2; j<=2; j++) addTile(i, j);
    }
    
    // Main path
    for(let i=0; i<pathLength; i++) {
        const dir = Math.floor(Math.random() * 4); // 0:R, 1:D, 2:L, 3:U
        // Bias towards Right and Down
        const bias = Math.random();
        
        if (bias < 0.4) cx++;
        else if (bias < 0.8) cy++;
        else if (bias < 0.9) cx--;
        else cy--;
        
        // Make path wider
        addTile(cx, cy);
        addTile(cx+1, cy);
        addTile(cx, cy+1);
    }
    
    // End area
    gameState.endPoint = { x: cx * TILE_SIZE, y: cy * TILE_SIZE };
    for(let i=-2; i<=2; i++) {
        for(let j=-2; j<=2; j++) addTile(cx+i, cy+j);
    }
    
    // Set start
    gameState.startPoint = { x: 0, y: 0 };
}