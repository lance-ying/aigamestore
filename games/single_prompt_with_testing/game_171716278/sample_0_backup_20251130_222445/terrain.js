// terrain.js
// Terrain rendering system

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getTerrainHeight } from './math_utils.js';

export function renderTerrain(p) {
    const startX = Math.floor(gameState.cameraX / 10) * 10;
    const endX = startX + CANVAS_WIDTH + 50; // Render a bit extra
    
    // Draw Terrain Shape
    p.noStroke();
    
    // Striped Pattern
    // We draw thin vertical strips to approximate the curve and create the pattern texture
    // Optimization: Draw one large shape for the base color, then overlay texture
    
    // 1. Base Shape
    p.fill(120, 200, 120); // Base Green
    p.beginShape();
    p.vertex(startX - gameState.cameraX, CANVAS_HEIGHT + 100); // Bottom Left
    
    for (let x = startX; x <= endX; x += 10) {
        const y = getTerrainHeight(p, x);
        p.vertex(x - gameState.cameraX, y);
    }
    
    p.vertex(endX - gameState.cameraX, CANVAS_HEIGHT + 100); // Bottom Right
    p.endShape(p.CLOSE);
    
    // 2. Texture Overlay (Stripes)
    // We only draw visible stripes
    p.strokeWeight(2);
    for (let x = startX; x <= endX; x += 20) {
        const y = getTerrainHeight(p, x);
        // Calculate stripe color based on slope or noise
        const n = p.noise(x * 0.05);
        if (n > 0.5) {
            p.stroke(100, 180, 100, 100);
            p.line(x - gameState.cameraX, y, x - gameState.cameraX, CANVAS_HEIGHT);
        }
    }
    
    // 3. Top Edge Highlight
    p.noFill();
    p.stroke(200, 255, 200);
    p.strokeWeight(4);
    p.beginShape();
    for (let x = startX; x <= endX; x += 10) {
        const y = getTerrainHeight(p, x);
        p.vertex(x - gameState.cameraX, y);
    }
    p.endShape();
    
    // 4. Draw "Night" wall
    const nightScreenX = gameState.nightX - gameState.cameraX;
    if (nightScreenX > -200 && nightScreenX < CANVAS_WIDTH) {
        p.noStroke();
        p.fill(0, 0, 50, 150); // Dark blue transparent
        p.rect(nightScreenX - 1000, 0, 1000, CANVAS_HEIGHT); // Darkness behind
        
        // Edge fuzziness
        for(let i=0; i<50; i++) {
             p.fill(0, 0, 50, 150 - i * 3);
             p.rect(nightScreenX + i*2, 0, 2, CANVAS_HEIGHT);
        }
    }
}